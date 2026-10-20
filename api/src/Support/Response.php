<?php

declare(strict_types=1);

namespace UrbanAir\Support;

/**
 * Lets a handler choose the HTTP status (for example 422 or 503) while still returning an envelope.
 */
final class Response
{
    public function __construct(
        public readonly int $status,
        public readonly array $body,
    ) {
    }

    public static function json(int $status, array $body): self
    {
        return new self($status, $body);
    }
}
