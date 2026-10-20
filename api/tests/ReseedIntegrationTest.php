<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use DateInterval;
use DateTimeImmutable;
use DateTimeZone;
use PDO;
use PHPUnit\Framework\TestCase;
use UrbanAir\Services\ReseedService;
use UrbanAir\Support\Db;
use UrbanAir\Support\Env;

/**
 * Runs against the database named in UA_TEST_DB_NAME (never the dev database).
 * Skipped when that variable or the database is unavailable.
 */
final class ReseedIntegrationTest extends TestCase
{
    private static ?PDO $pdo = null;

    protected function setUp(): void
    {
        parent::setUp();

        Env::load(__DIR__ . '/../.env');
        $name = Env::get('UA_TEST_DB_NAME');
        if ($name === '') {
            self::markTestSkipped('UA_TEST_DB_NAME is not set.');
        }

        try {
            self::$pdo ??= new PDO(
                sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', Env::get('DB_HOST', '127.0.0.1'), Env::get('DB_PORT', '3306'), $name),
                Env::get('DB_USER'),
                Env::get('DB_PASS'),
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
            );
        } catch (\PDOException $e) {
            self::markTestSkipped('Test database unavailable: ' . $e->getMessage());
        }

        Db::setPdo(self::$pdo);
        (function (): void {
            $sql = preg_replace('/^--.*$/m', '', (string) file_get_contents(__DIR__ . '/../database/schema.sql'));
            foreach (array_filter(array_map('trim', explode(';', (string) $sql))) as $statement) {
                self::$pdo->exec($statement);
            }
        })();
    }

    protected function tearDown(): void
    {
        Db::setPdo(null);
        parent::tearDown();
    }

    public function testReseedPopulatesFortyFlightsAndCountsAreConsistent(): void
    {
        $service = new ReseedService(self::$pdo, __DIR__ . '/../data/xml');
        self::assertTrue($service->reseed(new DateTimeImmutable('now', new DateTimeZone('UTC'))));

        self::assertSame(40, (int) self::$pdo->query('SELECT COUNT(*) FROM flights')->fetchColumn());
        self::assertSame(8, (int) self::$pdo->query('SELECT COUNT(*) FROM aircraft')->fetchColumn());
        self::assertSame(0, (int) self::$pdo->query(
            "SELECT COUNT(*) FROM passengers_manifest WHERE seat_id IS NULL"
        )->fetchColumn(), 'Manifest passengers must link to a seat');
    }

    public function testEnsureFreshOnlyReseedsWhenDataIsOlderThanTwentyFourHours(): void
    {
        $service = new ReseedService(self::$pdo, __DIR__ . '/../data/xml');
        $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));

        $service->reseed($now);
        self::assertFalse($service->ensureFresh($now->add(new DateInterval('PT23H'))), 'Should be fresh at 23h');
        self::assertTrue($service->ensureFresh($now->add(new DateInterval('PT25H'))), 'Should reseed after 24h');
    }
}
