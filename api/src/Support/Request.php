<?php

declare(strict_types=1);

namespace UrbanAir\Support;

/**
 * Reads the JSON request body. Returns an empty array for missing or invalid JSON.
 */
final class Request
{
    public static function body(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    /** Stable key for the request, used to make simulated errors reproducible in tests. */
    public static function fingerprint(): string
    {
        return sha1((string) ($_SERVER['REQUEST_URI'] ?? '') . file_get_contents('php://input'));
    }
}
