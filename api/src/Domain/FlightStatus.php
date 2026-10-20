<?php

declare(strict_types=1);

namespace UrbanAir\Domain;

/**
 * The status a flight can have. Stored in flights.status as the code. Labels are shown to visitors.
 */
final class FlightStatus
{
    public const ON_TIME = 'on_time';
    public const DELAYED = 'delayed';
    public const BOARDING = 'boarding';
    public const CANCELLED = 'cancelled';
    public const SCHEDULED = 'scheduled';
    public const DEPARTED = 'departed';
    public const DIVERTED = 'diverted';
    public const LANDED = 'landed';
    public const ARRIVED = 'arrived';

    /** @var array<string, string> code => label, in display order */
    private const LABELS = [
        self::ON_TIME => 'On Time',
        self::DELAYED => 'Delayed',
        self::BOARDING => 'Boarding',
        self::CANCELLED => 'Cancelled',
        self::SCHEDULED => 'Scheduled',
        self::DEPARTED => 'Departed',
        self::DIVERTED => 'Diverted',
        self::LANDED => 'Landed',
        self::ARRIVED => 'Arrived',
    ];

    /** @return list<string> */
    public static function codes(): array
    {
        return array_keys(self::LABELS);
    }

    public static function isValid(string $code): bool
    {
        return array_key_exists($code, self::LABELS);
    }

    /** Unknown codes fall back to Scheduled, the planner's default. */
    public static function label(string $code): string
    {
        return self::LABELS[$code] ?? self::LABELS[self::SCHEDULED];
    }
}
