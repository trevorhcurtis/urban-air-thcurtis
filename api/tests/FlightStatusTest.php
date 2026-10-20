<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use PHPUnit\Framework\TestCase;
use UrbanAir\Domain\FlightStatus;

final class FlightStatusTest extends TestCase
{
    public function testTheNineStatusesAreDefinedWithLabels(): void
    {
        $expected = [
            'on_time' => 'On Time',
            'delayed' => 'Delayed',
            'boarding' => 'Boarding',
            'cancelled' => 'Cancelled',
            'scheduled' => 'Scheduled',
            'departed' => 'Departed',
            'diverted' => 'Diverted',
            'landed' => 'Landed',
            'arrived' => 'Arrived',
        ];

        $this->assertSame(array_keys($expected), FlightStatus::codes());
        foreach ($expected as $code => $label) {
            $this->assertTrue(FlightStatus::isValid($code));
            $this->assertSame($label, FlightStatus::label($code));
        }
    }

    public function testUnknownCodesAreNotValidAndFallBackToScheduled(): void
    {
        $this->assertFalse(FlightStatus::isValid('Boarding'));
        $this->assertFalse(FlightStatus::isValid('gate_change'));
        $this->assertSame('Scheduled', FlightStatus::label('gate_change'));
    }
}
