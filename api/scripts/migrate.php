<?php

/**
 * Applies database/schema.sql. Safe to run repeatedly.
 * Usage: php scripts/migrate.php
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use UrbanAir\Support\Db;
use UrbanAir\Support\Env;

Env::load(__DIR__ . '/../.env');

$sql = file_get_contents(__DIR__ . '/../database/schema.sql');
if ($sql === false) {
    fwrite(STDERR, "Cannot read schema.sql\n");
    exit(1);
}

// Strip comment lines, then run each statement separately.
$sql = preg_replace('/^--.*$/m', '', $sql);
$pdo = Db::pdo();
$count = 0;
foreach (array_filter(array_map('trim', explode(';', $sql ?? ''))) as $statement) {
    $pdo->exec($statement);
    $count++;
}

echo "Applied {$count} statements.\n";
