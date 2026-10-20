<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use PHPUnit\Framework\TestCase;
use UrbanAir\Support\RateLimiter;

final class RateLimiterTest extends TestCase
{
    private string $dir;

    protected function setUp(): void
    {
        $this->dir = sys_get_temp_dir() . '/ua-rl-' . bin2hex(random_bytes(4));
    }

    protected function tearDown(): void
    {
        array_map('unlink', glob($this->dir . '/*') ?: []);
        @rmdir($this->dir);
    }

    public function testBlocksAfterLimitWithinWindow(): void
    {
        $limiter = new RateLimiter($this->dir, 2, 60);

        self::assertTrue($limiter->hit('1.2.3.4', 1000));
        self::assertTrue($limiter->hit('1.2.3.4', 1001));
        self::assertFalse($limiter->hit('1.2.3.4', 1002));
    }

    public function testWindowResetsAfterItExpires(): void
    {
        $limiter = new RateLimiter($this->dir, 1, 60);

        self::assertTrue($limiter->hit('k', 1000));
        self::assertFalse($limiter->hit('k', 1030));
        self::assertTrue($limiter->hit('k', 1061));
    }

    public function testKeysAreIndependent(): void
    {
        $limiter = new RateLimiter($this->dir, 1, 60);

        self::assertTrue($limiter->hit('a', 1000));
        self::assertTrue($limiter->hit('b', 1000));
    }

    public function testZeroLimitDisablesTheLimiter(): void
    {
        $limiter = new RateLimiter($this->dir, 0, 60);

        for ($i = 0; $i < 5; $i++) {
            self::assertTrue($limiter->hit('k', 1000));
        }
    }
}
