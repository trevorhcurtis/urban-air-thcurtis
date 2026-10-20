<?php

declare(strict_types=1);

namespace UrbanAir\Services;

use DateTimeImmutable;
use DateTimeZone;
use PDO;
use Throwable;

/**
 * Rebuilds all sample data from FlightPlanner. A MySQL named lock keeps two
 * concurrent triggers from reseeding at the same time.
 */
final class ReseedService
{
    public const LOCK_NAME = 'urbanair_reseed';
    public const MAX_AGE_SECONDS = 86400;
    private const CHUNK = 500;

    /** Tables in the order they must be cleared (children first). */
    private const CLEAR_ORDER = [
        'passengers_manifest', 'seats', 'flight_fares', 'flights', 'aircraft', 'aircraft_types',
        'routes', 'airports', 'rewards_tiers', 'partners', 'error_scenarios',
    ];

    public function __construct(
        private readonly PDO $pdo,
        private readonly string $xmlDir,
    ) {
    }

    /** Reseeds if the data is missing or older than 24 hours. Returns true if it reseeded. */
    public function ensureFresh(DateTimeImmutable $now): bool
    {
        $last = $this->lastSeededAt();
        if ($last !== null && $now->getTimestamp() - $last->getTimestamp() < self::MAX_AGE_SECONDS) {
            return false;
        }
        return $this->reseed($now);
    }

    /** Reseeds now. Returns false if another process holds the lock. */
    public function reseed(DateTimeImmutable $now): bool
    {
        $now = $now->setTimezone(new DateTimeZone('UTC'));
        $locked = (int) $this->pdo->query("SELECT GET_LOCK('" . self::LOCK_NAME . "', 5)")->fetchColumn();
        if ($locked !== 1) {
            return false;
        }

        try {
            $this->pdo->beginTransaction();
            $this->clear();
            $this->insertAll($this->plannerPlan($now), $now);
            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        } finally {
            $this->pdo->query("SELECT RELEASE_LOCK('" . self::LOCK_NAME . "')");
        }

        return true;
    }

    public function lastSeededAt(): ?DateTimeImmutable
    {
        $stmt = $this->pdo->prepare("SELECT meta_value FROM seed_meta WHERE meta_key = 'last_seeded_at'");
        $stmt->execute();
        $value = $stmt->fetchColumn();

        return $value === false ? null : new DateTimeImmutable((string) $value, new DateTimeZone('UTC'));
    }

    /** Seed value derives from the base date, so the same day always yields the same data. */
    private function plannerPlan(DateTimeImmutable $now): array
    {
        $base = new DateTimeImmutable($now->format('Y-m-d'), new DateTimeZone('UTC'));
        return (new FlightPlanner($this->xmlDir))->plan($base, crc32($base->format('Y-m-d')));
    }

    private function clear(): void
    {
        foreach (self::CLEAR_ORDER as $table) {
            $this->pdo->exec("DELETE FROM {$table}");
        }
    }

    private function insertAll(array $plan, DateTimeImmutable $now): void
    {
        $this->insertRows('airports', ['code', 'name', 'city', 'timezone'], $plan['airports']);
        $this->insertRows('routes', ['origin', 'destination', 'distance_mi', 'duration_min'], $plan['routes']);
        $this->insertRows('aircraft_types', ['code', 'manufacturer', 'model', 'seat_capacity', 'layout_key'], $plan['aircraft_types']);
        $this->insertRows('aircraft', ['id', 'tail_number', 'name', 'type_code'], $plan['aircraft']);
        $this->insertRows('rewards_tiers', ['code', 'name', 'min_points', 'benefits'], $plan['rewards_tiers']);
        $this->insertRows('partners', ['name', 'category', 'description', 'logo_key'], $plan['partners']);
        $scenarios = array_map(fn (array $s) => array_merge($s, ['retry_allowed' => (int) $s['retry_allowed']]), $plan['error_scenarios']);
        $this->insertRows('error_scenarios', ['code', 'title', 'message', 'probability', 'retry_allowed', 'endpoint_scope'], $scenarios);

        foreach ($plan['flights'] as $flight) {
            $this->insertRows('flights', ['id', 'flight_number', 'flight_date', 'depart_time', 'arrive_time', 'duration_min', 'aircraft_id', 'status'], [$flight]);

            foreach ($flight['fares'] as $class => $fare) {
                $this->insertRows('flight_fares', ['flight_id', 'class_code', 'price_cents', 'seats_total'], [
                    ['flight_id' => $flight['id'], 'class_code' => $class, 'price_cents' => $fare['price_cents'], 'seats_total' => $fare['seats_total']],
                ]);
            }

            $seatRows = array_map(fn (array $seat) => [
                'flight_id' => $flight['id'],
                'row_num' => $seat['row'],
                'col_letter' => $seat['col'],
                'class_code' => $seat['class'],
                'status' => $seat['status'],
                'feature_codes' => $seat['feature_codes'],
            ], $flight['seats']);
            $this->insertRows('seats', ['flight_id', 'row_num', 'col_letter', 'class_code', 'status', 'feature_codes'], $seatRows);

            $this->insertManifest($flight);
        }

        $this->pdo->prepare("REPLACE INTO seed_meta (meta_key, meta_value) VALUES ('last_seeded_at', ?), ('seed_version', '1')")
            ->execute([$now->format('Y-m-d H:i:s')]);
    }

    /** Looks up the seat IDs the database assigned, then links each manifest passenger to a seat. */
    private function insertManifest(array $flight): void
    {
        if ($flight['manifest'] === []) {
            return;
        }

        $stmt = $this->pdo->prepare('SELECT id, row_num, col_letter FROM seats WHERE flight_id = ?');
        $stmt->execute([$flight['id']]);
        $idByPosition = [];
        foreach ($stmt->fetchAll() as $row) {
            $idByPosition[$row['row_num'] . '-' . $row['col_letter']] = (int) $row['id'];
        }

        $rows = [];
        foreach ($flight['manifest'] as $passenger) {
            $seat = $flight['seats'][$passenger['seat_index']];
            $rows[] = [
                'flight_id' => $flight['id'],
                'first_name' => $passenger['first_name'],
                'last_name' => $passenger['last_name'],
                'seat_id' => $idByPosition[$seat['row'] . '-' . $seat['col']] ?? null,
                'class_code' => $passenger['class_code'],
                'ticket_ref' => $passenger['ticket_ref'],
            ];
        }

        $this->insertRows('passengers_manifest', ['flight_id', 'first_name', 'last_name', 'seat_id', 'class_code', 'ticket_ref'], $rows);
    }

    /**
     * Multi-row INSERT in chunks. Column names come from the fixed lists above, never from input.
     *
     * @param list<string> $columns
     * @param list<array<string, mixed>> $rows
     */
    private function insertRows(string $table, array $columns, array $rows): void
    {
        $quoted = implode(', ', array_map(fn (string $c) => "`{$c}`", $columns));
        $placeholder = '(' . implode(', ', array_fill(0, count($columns), '?')) . ')';

        foreach (array_chunk($rows, self::CHUNK) as $chunk) {
            $values = [];
            foreach ($chunk as $row) {
                foreach ($columns as $column) {
                    $values[] = $row[$column] ?? null;
                }
            }
            $sql = "INSERT INTO `{$table}` ({$quoted}) VALUES " . implode(', ', array_fill(0, count($chunk), $placeholder));
            $this->pdo->prepare($sql)->execute($values);
        }
    }
}
