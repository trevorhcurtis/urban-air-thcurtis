<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use PHPUnit\Framework\TestCase;
use UrbanAir\Repositories\FlightRepository;

final class FlightRepositoryTest extends TestCase
{
    public function testEachFareClassHasAFixedBaggageAllowance(): void
    {
        $this->assertSame(
            ['carry_on' => 1, 'checked_included' => 0, 'checked_fee_available' => true],
            FlightRepository::classBaggage('ECONOMY'),
        );
        $this->assertSame(
            ['carry_on' => 1, 'checked_included' => 1, 'checked_fee_available' => true],
            FlightRepository::classBaggage('PREMIUM'),
        );
        $this->assertSame(
            ['carry_on' => 2, 'checked_included' => 2, 'checked_fee_available' => true],
            FlightRepository::classBaggage('BUSINESS'),
        );
    }

    public function testEachFareClassHasFixedRestrictions(): void
    {
        foreach (['ECONOMY', 'PREMIUM', 'BUSINESS'] as $code) {
            $restrictions = FlightRepository::classRestrictions($code);

            $this->assertSame(['Changes', 'Cancellation', 'Seat selection'], array_column($restrictions, 'label'));
            $this->assertNotEmpty(array_filter(array_column($restrictions, 'value')));
        }
    }

    public function testUnknownCodesFallBackToEconomy(): void
    {
        $this->assertSame(FlightRepository::classBaggage('ECONOMY'), FlightRepository::classBaggage('UNKNOWN'));
    }
}
