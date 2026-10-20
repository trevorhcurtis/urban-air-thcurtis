<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use DateTimeImmutable;
use PHPUnit\Framework\TestCase;
use UrbanAir\Services\FlightPlanner;

final class FlightPlannerTest extends TestCase
{
    private static ?array $plan = null;

    private function plan(): array
    {
        return self::$plan ??= (new FlightPlanner(__DIR__ . '/../data/xml'))
            ->plan(new DateTimeImmutable('2026-10-15'), 12345);
    }

    public function testProducesFortyFlightsAcrossEightAircraft(): void
    {
        $plan = $this->plan();

        self::assertCount(40, $plan['flights']);
        self::assertCount(8, $plan['aircraft']);
    }

    public function testEachAircraftFliesFiveFlightsOnDistinctDays(): void
    {
        $byAircraft = [];
        foreach ($this->plan()['flights'] as $flight) {
            $byAircraft[$flight['aircraft_id']][] = $flight['flight_date'];
        }

        self::assertCount(8, $byAircraft);
        foreach ($byAircraft as $dates) {
            self::assertCount(5, $dates);
            self::assertCount(5, array_unique($dates), 'Aircraft has two flights on one day');
        }
    }

    public function testFlightsFallInsideTheThirtyDayWindow(): void
    {
        foreach ($this->plan()['flights'] as $flight) {
            self::assertGreaterThanOrEqual('2026-10-16', $flight['flight_date']);
            self::assertLessThanOrEqual('2026-11-14', $flight['flight_date']);
        }
    }

    public function testSameSeedProducesIdenticalPlan(): void
    {
        $again = (new FlightPlanner(__DIR__ . '/../data/xml'))->plan(new DateTimeImmutable('2026-10-15'), 12345);

        self::assertSame($this->plan(), $again);
    }

    public function testOpenSeatShareStaysInTargetRange(): void
    {
        foreach ($this->plan()['flights'] as $flight) {
            $total = count($flight['seats']);
            $open = count(array_filter($flight['seats'], fn (array $s) => $s['status'] === 'open'));

            // Whole-seat rounding means small cabins can land just outside the exact percentage.
            self::assertGreaterThanOrEqual((int) floor($total * 0.35), $open, "Flight {$flight['flight_number']} too full");
            self::assertLessThanOrEqual((int) ceil($total * 0.50), $open, "Flight {$flight['flight_number']} too empty");
        }
    }

    public function testEveryTakenSeatHasExactlyOnePassengerAndNoOpenSeatDoes(): void
    {
        foreach ($this->plan()['flights'] as $flight) {
            $taken = array_keys(array_filter($flight['seats'], fn (array $s) => $s['status'] === 'taken'));
            $manifestSeats = array_column($flight['manifest'], 'seat_index');

            sort($taken);
            sort($manifestSeats);
            self::assertSame($taken, $manifestSeats, "Manifest mismatch on {$flight['flight_number']}");
        }
    }

    public function testFareClassesMatchSeatClasses(): void
    {
        foreach ($this->plan()['flights'] as $flight) {
            foreach ($flight['fares'] as $class => $fare) {
                $seatsInClass = count(array_filter($flight['seats'], fn (array $s) => $s['class'] === $class));
                self::assertSame($seatsInClass, $fare['seats_total']);
                self::assertGreaterThan(0, $fare['price_cents']);
            }
        }
    }
}
