<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use PDO;
use PHPUnit\Framework\TestCase;
use UrbanAir\Services\ErrorSimulator;

final class ErrorSimulatorTest extends TestCase
{
    private function pdo(): PDO
    {
        $pdo = new PDO('sqlite::memory:');
        $pdo->exec('CREATE TABLE error_scenarios (code TEXT, title TEXT, message TEXT, probability REAL, retry_allowed INTEGER, endpoint_scope TEXT)');
        $pdo->exec("INSERT INTO error_scenarios VALUES ('always', 'Always', 'Always fails.', 1.0, 1, 'search')");
        $pdo->exec("INSERT INTO error_scenarios VALUES ('never', 'Never', 'Never fails.', 0.0, 1, 'other')");
        return $pdo;
    }

    public function testDisabledSimulatorNeverFires(): void
    {
        $sim = new ErrorSimulator($this->pdo(), false);
        self::assertNull($sim->roll('search', 'k'));
    }

    public function testCertainProbabilityAlwaysFiresForItsScope(): void
    {
        $sim = new ErrorSimulator($this->pdo(), true);
        $issue = $sim->roll('search', 'k');

        self::assertSame('always', $issue['code']);
        self::assertTrue($issue['retry_allowed']);
        self::assertTrue($issue['blocking']);
    }

    public function testZeroProbabilityScopeNeverFires(): void
    {
        $sim = new ErrorSimulator($this->pdo(), true);
        self::assertNull($sim->roll('other', 'k'));
    }

    public function testSeededSimulatorIsReproducible(): void
    {
        $pdo = new PDO('sqlite::memory:');
        $pdo->exec('CREATE TABLE error_scenarios (code TEXT, title TEXT, message TEXT, probability REAL, retry_allowed INTEGER, endpoint_scope TEXT)');
        $pdo->exec("INSERT INTO error_scenarios VALUES ('coin', 'Coin', 'Sometimes.', 0.5, 1, 'search')");

        $first = [];
        $second = [];
        $simA = new ErrorSimulator($pdo, true, 'seed-1');
        $simB = new ErrorSimulator($pdo, true, 'seed-1');
        for ($i = 0; $i < 50; $i++) {
            $first[] = $simA->roll('search', "req-{$i}") !== null;
            $second[] = $simB->roll('search', "req-{$i}") !== null;
        }

        self::assertSame($first, $second);
        self::assertContains(true, $first);
        self::assertContains(false, $first);
    }

    public function testFareChangeIsInformationalNotBlocking(): void
    {
        $pdo = new PDO('sqlite::memory:');
        $pdo->exec('CREATE TABLE error_scenarios (code TEXT, title TEXT, message TEXT, probability REAL, retry_allowed INTEGER, endpoint_scope TEXT)');
        $pdo->exec("INSERT INTO error_scenarios VALUES ('fare_changed', 'Fare', 'Changed.', 1.0, 0, 'flight_detail')");

        $issue = (new ErrorSimulator($pdo, true))->roll('flight_detail', 'k');
        self::assertFalse($issue['blocking']);
    }
}
