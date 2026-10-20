<?php

declare(strict_types=1);

namespace UrbanAir\Repositories;

use PDO;

final class ReferenceRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array{code: string, name: string, city: string, timezone: string}> */
    public function airports(): array
    {
        return $this->pdo->query('SELECT code, name, city, timezone FROM airports ORDER BY code')->fetchAll();
    }

    /** @return list<array{origin: string, destination: string, distance_mi: int, duration_min: int}> */
    public function routes(): array
    {
        $rows = $this->pdo->query('SELECT origin, destination, distance_mi, duration_min FROM routes ORDER BY id')->fetchAll();
        return array_map(fn (array $r) => $r + [
            'distance_mi' => (int) $r['distance_mi'],
            'duration_min' => (int) $r['duration_min'],
        ], $rows);
    }

    /** @return list<array{code: string, name: string, min_points: int, benefits: string}> */
    public function rewardsTiers(): array
    {
        $rows = $this->pdo->query('SELECT code, name, min_points, benefits FROM rewards_tiers ORDER BY min_points')->fetchAll();
        return array_map(fn (array $r) => $r + ['min_points' => (int) $r['min_points']], $rows);
    }

    /** @return list<array{id: int, name: string, category: string, description: string, logo_key: string}> */
    public function partners(): array
    {
        $rows = $this->pdo->query('SELECT id, name, category, description, logo_key FROM partners ORDER BY name')->fetchAll();
        return array_map(fn (array $r) => $r + ['id' => (int) $r['id']], $rows);
    }

    /** @return list<array{origin: string, destination: string}> */
    public function routePairs(): array
    {
        return $this->routes();
    }

    /** @return list<string> */
    public function airportCodes(): array
    {
        return array_column($this->airports(), 'code');
    }
}
