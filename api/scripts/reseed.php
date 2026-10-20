<?php

/**
 * Rebuilds all sample data now. Schedule this from cron every 24 hours, e.g.:
 *   0 3 * * *  cd /path/to/api && php scripts/reseed.php >> storage/reseed.log 2>&1
 * Also runs lazily through the API when the data is older than 24 hours.
 * Usage: php scripts/reseed.php [--if-stale]
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use UrbanAir\Services\ReseedService;
use UrbanAir\Support\Db;
use UrbanAir\Support\Env;

Env::load(__DIR__ . '/../.env');

$service = new ReseedService(Db::pdo(), __DIR__ . '/../data/xml');
$now = new DateTimeImmutable('now', new DateTimeZone('UTC'));

if (in_array('--if-stale', $argv, true)) {
    $ran = $service->ensureFresh($now);
    echo $ran ? "Reseeded (data was stale).\n" : "Data is fresh. Nothing to do.\n";
    exit(0);
}

$ran = $service->reseed($now);
echo $ran ? "Reseeded at {$now->format('c')}.\n" : "Another reseed is running. Skipped.\n";
exit($ran ? 0 : 1);
