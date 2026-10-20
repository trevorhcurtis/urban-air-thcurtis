<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use PHPUnit\Framework\TestCase;
use UrbanAir\Support\Json;

final class EnvelopeTest extends TestCase
{
    public function testOkEnvelopeHasRequiredKeys(): void
    {
        $body = Json::ok(['hello' => 'world']);

        self::assertTrue($body['ok']);
        self::assertSame(['hello' => 'world'], $body['data']);
        self::assertSame([], $body['errors']);
        self::assertArrayHasKey('request_id', $body['meta']);
        self::assertNull($body['simulated_issue']);
    }

    public function testErrorEnvelopeCarriesCodeAndMessage(): void
    {
        $body = Json::error('not_found', 'Missing.');

        self::assertFalse($body['ok']);
        self::assertNull($body['data']);
        self::assertSame('not_found', $body['errors'][0]['code']);
    }
}
