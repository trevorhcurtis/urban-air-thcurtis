<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use PHPUnit\Framework\TestCase;
use UrbanAir\Support\Env;

final class EnvTest extends TestCase
{
    public function testBoolParsesCommonValuesAndDefaults(): void
    {
        putenv('UA_TEST_FLAG=true');
        self::assertTrue(Env::bool('UA_TEST_FLAG'));

        putenv('UA_TEST_FLAG=0');
        self::assertFalse(Env::bool('UA_TEST_FLAG', true));

        putenv('UA_TEST_FLAG');
        self::assertTrue(Env::bool('UA_TEST_FLAG', true));
    }
}
