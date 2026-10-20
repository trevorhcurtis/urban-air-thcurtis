<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use PHPUnit\Framework\TestCase;
use UrbanAir\Support\Router;

final class RouterTest extends TestCase
{
    public function testMatchesStaticRouteAndPassesParams(): void
    {
        $router = new Router();
        $router->add('GET', '/api/v1/flights/{id}', fn (array $p) => ['ok' => true, 'data' => $p]);

        $result = $router->dispatch('GET', '/api/v1/flights/42');

        self::assertSame(200, $result['status']);
        self::assertSame(['id' => '42'], $result['body']['data']);
    }

    public function testUnknownPathReturns404(): void
    {
        $router = new Router();
        self::assertSame(404, $router->dispatch('GET', '/nope')['status']);
    }

    public function testWrongMethodReturns405(): void
    {
        $router = new Router();
        $router->add('GET', '/api/v1/search', fn () => []);

        self::assertSame(405, $router->dispatch('POST', '/api/v1/search')['status']);
    }
}
