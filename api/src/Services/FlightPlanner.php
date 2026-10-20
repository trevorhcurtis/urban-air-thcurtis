<?php

declare(strict_types=1);

namespace UrbanAir\Services;

use DateInterval;
use DateTimeImmutable;
use Random\Engine\Mt19937;
use Random\Randomizer;
use UrbanAir\Domain\FlightStatus;

/**
 * Builds the complete sample dataset for one reseed cycle as plain arrays.
 * Pure and deterministic: the same base date and seed always produce the same plan.
 * No database access here, so the invariants can be tested directly.
 */
final class FlightPlanner
{
    public const FLIGHT_COUNT = 40;
    private const DEPARTURE_TIMES = ['06:00', '07:30', '09:15', '11:45', '13:20', '15:40', '17:55', '19:30', '21:10'];
    private const WINDOW_DAYS = 30;

    public function __construct(private readonly string $xmlDir)
    {
    }

    /**
     * @return array{
     *   airports: list<array>, routes: list<array>, aircraft_types: list<array>,
     *   aircraft: list<array>, flights: list<array>, rewards_tiers: list<array>,
     *   partners: list<array>, error_scenarios: list<array>
     * }
     */
    public function plan(DateTimeImmutable $baseDate, int $seed): array
    {
        $rng = new Randomizer(new Mt19937($seed));
        $layouts = (new LayoutRepository($this->xmlDir))->layouts();
        $types = SeedData::aircraftTypes();
        $fleet = SeedData::fleet();

        $aircraftTypes = [];
        foreach ($types as $code => $type) {
            $aircraftTypes[] = [
                'code' => $code,
                'manufacturer' => $type['manufacturer'],
                'model' => $type['model'],
                'seat_capacity' => count(SeatGenerator::generate($layouts[$type['layout_key']])),
                'layout_key' => $type['layout_key'],
            ];
        }

        $schedule = $this->schedule($rng, $fleet, $baseDate);
        $flights = [];
        foreach ($schedule as $index => $slot) {
            $flightId = $index + 1;
            $aircraft = $slot['aircraft'];
            $typeCode = $aircraft['type_code'];
            $layout = $layouts[$types[$typeCode]['layout_key']];

            $departMinutes = $this->minutes($slot['depart']);
            $duration = $rng->getInt(120, 330);

            $seats = SeatGenerator::generate($layout);
            $seats = $this->applyOccupancy($rng, $seats);

            $flights[] = [
                'id' => $flightId,
                'flight_number' => sprintf('UA%03d', 100 + $flightId),
                'flight_date' => $slot['date']->format('Y-m-d'),
                'depart_time' => $slot['depart'],
                'arrive_time' => $this->clock(($departMinutes + $duration) % 1440),
                'duration_min' => $duration,
                'aircraft_id' => $aircraft['id'],
                'status' => FlightStatus::SCHEDULED,
                'fares' => $this->fares($rng, $types[$typeCode]['fares'], $seats),
                'seats' => $seats,
                'manifest' => $this->manifest($rng, $seats),
            ];
        }

        return [
            'airports' => SeedData::airports(),
            'routes' => SeedData::routes(),
            'aircraft_types' => $aircraftTypes,
            'aircraft' => $fleet,
            'flights' => $flights,
            'rewards_tiers' => SeedData::rewardsTiers(),
            'partners' => SeedData::partners(),
            'error_scenarios' => SeedData::errorScenarios(),
        ];
    }

    /**
     * Five flights per aircraft on distinct days, so no aircraft ever has overlapping flights.
     *
     * @param list<array> $fleet
     * @return list<array{aircraft: array, date: DateTimeImmutable, depart: string}>
     */
    private function schedule(Randomizer $rng, array $fleet, DateTimeImmutable $baseDate): array
    {
        $slots = [];
        $days = range(1, self::WINDOW_DAYS);
        $perAircraft = self::FLIGHT_COUNT / count($fleet);

        foreach ($fleet as $aircraft) {
            $chosen = array_slice($rng->shuffleArray($days), 0, $perAircraft);
            foreach ($chosen as $offset) {
                $slots[] = [
                    'aircraft' => $aircraft,
                    'offset' => $offset,
                    'depart' => self::DEPARTURE_TIMES[$rng->getInt(0, count(self::DEPARTURE_TIMES) - 1)],
                ];
            }
        }

        usort($slots, fn (array $a, array $b) => [$a['offset'], $a['depart']] <=> [$b['offset'], $b['depart']]);

        return array_map(fn (array $slot) => [
            'aircraft' => $slot['aircraft'],
            'date' => $baseDate->add(new DateInterval('P' . $slot['offset'] . 'D')),
            'depart' => $slot['depart'] . ':00',
        ], $slots);
    }

    /** Marks a moderate share of seats open (35 to 50 percent), the rest taken. */
    private function applyOccupancy(Randomizer $rng, array $seats): array
    {
        $total = count($seats);
        $openCount = (int) round($total * $rng->getInt(35, 50) / 100);
        $openIndexes = array_flip(array_slice($rng->shuffleArray(range(0, $total - 1)), 0, $openCount));

        foreach ($seats as $index => &$seat) {
            $seat['status'] = isset($openIndexes[$index]) ? 'open' : 'taken';
            $seat['feature_codes'] = implode(',', $seat['features']);
            unset($seat['features']);
        }
        unset($seat);

        return $seats;
    }

    /**
     * Price per class with a per-flight factor of 90 to 115 percent, rounded to whole dollars.
     *
     * @param array<string, int> $baseFares
     * @param list<array> $seats
     * @return array<string, array{price_cents: int, seats_total: int}>
     */
    private function fares(Randomizer $rng, array $baseFares, array $seats): array
    {
        $factor = $rng->getInt(90, 115);
        $fares = [];

        foreach ($baseFares as $class => $baseCents) {
            $seatsInClass = count(array_filter($seats, fn (array $s) => $s['class'] === $class));
            $fares[$class] = [
                'price_cents' => (int) round($baseCents * $factor / 100 / 100) * 100,
                'seats_total' => $seatsInClass,
            ];
        }

        return $fares;
    }

    /**
     * One manifest passenger per taken seat. seat_index points into the flight's seats array.
     *
     * @param list<array> $seats
     * @return list<array{seat_index: int, first_name: string, last_name: string, class_code: string, ticket_ref: string}>
     */
    private function manifest(Randomizer $rng, array $seats): array
    {
        $firsts = SeedData::firstNames();
        $lasts = SeedData::lastNames();
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $manifest = [];

        foreach ($seats as $index => $seat) {
            if ($seat['status'] !== 'taken') {
                continue;
            }
            $ticket = '';
            for ($i = 0; $i < 6; $i++) {
                $ticket .= $alphabet[$rng->getInt(0, strlen($alphabet) - 1)];
            }
            $manifest[] = [
                'seat_index' => $index,
                'first_name' => $firsts[$rng->getInt(0, count($firsts) - 1)],
                'last_name' => $lasts[$rng->getInt(0, count($lasts) - 1)],
                'class_code' => $seat['class'],
                'ticket_ref' => $ticket,
            ];
        }

        return $manifest;
    }

    private function minutes(string $time): int
    {
        [$h, $m] = array_map('intval', explode(':', $time));
        return $h * 60 + $m;
    }

    private function clock(int $minutes): string
    {
        return sprintf('%02d:%02d:00', intdiv($minutes, 60), $minutes % 60);
    }
}
