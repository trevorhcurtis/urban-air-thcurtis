<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use PHPUnit\Framework\TestCase;
use UrbanAir\Services\LayoutRepository;
use UrbanAir\Services\SeatGenerator;

final class SeatGeneratorTest extends TestCase
{
    private string $xmlDir = __DIR__ . '/../data/xml';

    public function testEveryAircraftTypeHasALayoutWithSeats(): void
    {
        $layouts = (new LayoutRepository($this->xmlDir))->layouts();

        self::assertSame(['757-200', 'A220-100', 'A220-300', 'PRAETOR-500'], array_keys($layouts));
        foreach ($layouts as $code => $layout) {
            self::assertNotEmpty(SeatGenerator::generate($layout), "No seats for {$code}");
        }
    }

    public function testSeatCountMatchesPatternAndRows(): void
    {
        $layout = [
            'exitRows' => [],
            'bulkheadRows' => [],
            'cabins' => [['class' => 'ECONOMY', 'firstRow' => 1, 'lastRow' => 2, 'pattern' => 'AB_CD']],
        ];

        self::assertCount(8, SeatGenerator::generate($layout));
    }

    public function testWindowAisleAndExitFeaturesAreApplied(): void
    {
        $layout = [
            'exitRows' => [5],
            'bulkheadRows' => [],
            'cabins' => [['class' => 'ECONOMY', 'firstRow' => 5, 'lastRow' => 5, 'pattern' => 'AB_CD']],
        ];

        $seats = [];
        foreach (SeatGenerator::generate($layout) as $seat) {
            $seats[$seat['col']] = $seat['features'];
        }

        self::assertContains('WINDOW', $seats['A']);
        self::assertContains('AISLE', $seats['B']);
        self::assertContains('AISLE', $seats['C']);
        self::assertContains('WINDOW', $seats['D']);
        self::assertContains('EXIT_ROW', $seats['B']);
        self::assertContains('NO_RECLINE', $seats['A']);
    }

    public function testBusinessSeatsHavePower(): void
    {
        $layout = [
            'exitRows' => [],
            'bulkheadRows' => [],
            'cabins' => [['class' => 'BUSINESS', 'firstRow' => 1, 'lastRow' => 1, 'pattern' => 'AB']],
        ];

        foreach (SeatGenerator::generate($layout) as $seat) {
            self::assertContains('POWER', $seat['features']);
        }
    }
}
