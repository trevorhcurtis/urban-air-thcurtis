<?php

declare(strict_types=1);

namespace UrbanAir\Repositories;

use PDO;
use UrbanAir\Domain\FlightStatus;

/**
 * Reads flights, fares, and seats. Every search returns the same full set of 40 flights.
 */
final class FlightRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        $flights = $this->pdo->query(
            'SELECT f.id, f.flight_number, f.flight_date, f.depart_time, f.arrive_time, f.duration_min, f.status,
                    a.id AS aircraft_id, a.tail_number, a.name AS aircraft_name, a.type_code,
                    t.manufacturer, t.model
               FROM flights f
               JOIN aircraft a ON a.id = f.aircraft_id
               JOIN aircraft_types t ON t.code = a.type_code
              ORDER BY f.flight_date, f.depart_time, f.id'
        )->fetchAll();

        $fares = $this->fareRows();
        $open = $this->openSeatCounts();

        return array_map(function (array $flight) use ($fares, $open): array {
            $id = (int) $flight['id'];
            return $this->shape($flight, $fares[$id] ?? [], $open[$id] ?? []);
        }, $flights);
    }

    /** @return array<string, mixed>|null */
    public function find(int $id): ?array
    {
        foreach ($this->all() as $flight) {
            if ($flight['id'] === $id) {
                return $flight;
            }
        }
        return null;
    }

    /** @return list<array{row: int, col: string, class: string, status: string, features: list<string>}> */
    public function seats(int $flightId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT row_num, col_letter, class_code, status, feature_codes FROM seats WHERE flight_id = ? ORDER BY row_num, col_letter'
        );
        $stmt->execute([$flightId]);

        return array_map(fn (array $s) => [
            'row' => (int) $s['row_num'],
            'col' => $s['col_letter'],
            'class' => $s['class_code'],
            'status' => $s['status'],
            'features' => $s['feature_codes'] === '' ? [] : explode(',', $s['feature_codes']),
        ], $stmt->fetchAll());
    }

    /** @return array<int, list<array{code: string, price_cents: int, seats_total: int}>> */
    private function fareRows(): array
    {
        $grouped = [];
        foreach ($this->pdo->query('SELECT flight_id, class_code, price_cents, seats_total FROM flight_fares ORDER BY flight_id, price_cents DESC')->fetchAll() as $row) {
            $grouped[(int) $row['flight_id']][] = [
                'code' => $row['class_code'],
                'price_cents' => (int) $row['price_cents'],
                'seats_total' => (int) $row['seats_total'],
            ];
        }
        return $grouped;
    }

    /** @return array<int, array<string, int>> */
    private function openSeatCounts(): array
    {
        $counts = [];
        $rows = $this->pdo->query(
            "SELECT flight_id, class_code, COUNT(*) AS open_count FROM seats WHERE status = 'open' GROUP BY flight_id, class_code"
        )->fetchAll();
        foreach ($rows as $row) {
            $counts[(int) $row['flight_id']][$row['class_code']] = (int) $row['open_count'];
        }
        return $counts;
    }

    /**
     * @param array<string, mixed> $flight
     * @param list<array{code: string, price_cents: int, seats_total: int}> $fares
     * @param array<string, int> $open
     * @return array<string, mixed>
     */
    private function shape(array $flight, array $fares, array $open): array
    {
        return [
            'id' => (int) $flight['id'],
            'flight_number' => $flight['flight_number'],
            'flight_date' => $flight['flight_date'],
            'depart_time' => substr($flight['depart_time'], 0, 5),
            'arrive_time' => substr($flight['arrive_time'], 0, 5),
            'duration_min' => (int) $flight['duration_min'],
            'status' => $flight['status'],
            'status_label' => FlightStatus::label($flight['status']),
            'aircraft' => [
                'id' => (int) $flight['aircraft_id'],
                'tail_number' => $flight['tail_number'],
                'name' => $flight['aircraft_name'],
                'type_code' => $flight['type_code'],
                'manufacturer' => $flight['manufacturer'],
                'model' => $flight['model'],
            ],
            'classes' => array_map(fn (array $fare) => [
                'code' => $fare['code'],
                'label' => self::classLabel($fare['code']),
                'price_cents' => $fare['price_cents'],
                'seats_total' => $fare['seats_total'],
                'seats_open' => $open[$fare['code']] ?? 0,
                'baggage' => self::classBaggage($fare['code']),
                'restrictions' => self::classRestrictions($fare['code']),
            ], $fares),
        ];
    }

    /**
     * Fare restrictions for each fare class. Fixed prototype values, not stored in the database.
     * Shown on the flight card on hover or tap. Replace with the approved fare rules before launch.
     *
     * @return list<array{label: string, value: string}>
     */
    public static function classRestrictions(string $code): array
    {
        return match ($code) {
            'BUSINESS' => [
                ['label' => 'Changes', 'value' => 'Free before departure'],
                ['label' => 'Cancellation', 'value' => 'Refundable, less a service fee'],
                ['label' => 'Seat selection', 'value' => 'Included'],
            ],
            'PREMIUM' => [
                ['label' => 'Changes', 'value' => 'Allowed for a fee'],
                ['label' => 'Cancellation', 'value' => 'Partial refund'],
                ['label' => 'Seat selection', 'value' => 'Included'],
            ],
            default => [
                ['label' => 'Changes', 'value' => 'Allowed for a fee'],
                ['label' => 'Cancellation', 'value' => 'Non-refundable'],
                ['label' => 'Seat selection', 'value' => 'Fee applies'],
            ],
        };
    }

    /**
     * Baggage allowance for each fare class. Fixed prototype values, not stored in the database.
     * Checked-bag fees are displayed only. They are not added to the fare total.
     *
     * @return array{carry_on: int, checked_included: int, checked_fee_available: bool}
     */
    public static function classBaggage(string $code): array
    {
        return match ($code) {
            'BUSINESS' => ['carry_on' => 2, 'checked_included' => 2, 'checked_fee_available' => true],
            'PREMIUM' => ['carry_on' => 1, 'checked_included' => 1, 'checked_fee_available' => true],
            default => ['carry_on' => 1, 'checked_included' => 0, 'checked_fee_available' => true],
        };
    }

    public static function classLabel(string $code): string
    {
        return match ($code) {
            'BUSINESS' => 'Business',
            'PREMIUM' => 'Premium Economy',
            default => 'Economy',
        };
    }
}
