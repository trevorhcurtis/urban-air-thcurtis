<?php

declare(strict_types=1);

namespace UrbanAir\Support;

/**
 * Loads simple KEY=VALUE pairs from api/.env into the process environment.
 * Existing environment variables win, so production can inject real values.
 */
final class Env
{
    private static bool $loaded = false;

    public static function load(string $file): void
    {
        if (self::$loaded || !is_file($file)) {
            self::$loaded = true;
            return;
        }

        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = array_map('trim', explode('=', $line, 2));
            if (getenv($key) === false) {
                putenv("{$key}={$value}");
            }
        }

        self::$loaded = true;
    }

    public static function get(string $key, string $default = ''): string
    {
        $value = getenv($key);
        return $value === false ? $default : $value;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $value = getenv($key);
        if ($value === false || $value === '') {
            return $default;
        }
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
