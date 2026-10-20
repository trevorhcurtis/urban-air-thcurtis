<?php

declare(strict_types=1);

namespace UrbanAir\Services;

use PDO;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Rolls for simulated system issues on eligible endpoints. Scenarios and probabilities
 * come from the error_scenarios table.
 *
 * When SIMULATE_ERRORS_SEED is set, results depend only on the seed and the request,
 * so tests and demos can reproduce them. Otherwise each request rolls independently.
 */
final class ErrorSimulator
{
    /** Scenarios that do not block the request. The response is 200 with the issue attached. */
    private const INFORMATIONAL = ['fare_changed'];

    /** @var array<string, list<array>> */
    private array $cache = [];

    public function __construct(
        private readonly PDO $pdo,
        private readonly bool $enabled,
        private readonly ?string $seed = null,
    ) {
    }

    /**
     * @return array{code: string, title: string, message: string, retry_allowed: bool, blocking: bool}|null
     */
    public function roll(string $scope, string $requestKey = ''): ?array
    {
        if (!$this->enabled) {
            return null;
        }

        foreach ($this->scenarios($scope) as $scenario) {
            if ($this->draw($scope . '|' . $requestKey) < (float) $scenario['probability']) {
                return [
                    'code' => $scenario['code'],
                    'title' => $scenario['title'],
                    'message' => $scenario['message'],
                    'retry_allowed' => (bool) $scenario['retry_allowed'],
                    'blocking' => !in_array($scenario['code'], self::INFORMATIONAL, true),
                ];
            }
        }

        return null;
    }

    /** @return list<array<string, mixed>> */
    private function scenarios(string $scope): array
    {
        if (!isset($this->cache[$scope])) {
            $stmt = $this->pdo->prepare(
                'SELECT code, title, message, probability, retry_allowed FROM error_scenarios WHERE endpoint_scope = ? ORDER BY code'
            );
            $stmt->execute([$scope]);
            $this->cache[$scope] = $stmt->fetchAll();
        }
        return $this->cache[$scope];
    }

    /** Returns a number in [0, 1). */
    private function draw(string $key): float
    {
        if ($this->seed !== null && $this->seed !== '') {
            $rng = new Randomizer(new Mt19937(crc32($this->seed . '|' . $key)));
            return $rng->getInt(0, 999999) / 1000000;
        }
        return random_int(0, 999999) / 1000000;
    }
}
