<?php

declare(strict_types=1);

namespace UrbanAir\Support;

/**
 * Holds a per-request id used for logs and the front-end support footnote.
 */
final class RequestContext
{
    private static ?string $id = null;

    public static function id(): string
    {
        return self::$id ??= bin2hex(random_bytes(8));
    }

    public static function reset(): void
    {
        self::$id = null;
    }
}
