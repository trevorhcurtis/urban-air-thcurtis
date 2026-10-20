<?php

declare(strict_types=1);

namespace UrbanAir\Support;

/**
 * Fixed-window, per-key request limiter backed by small files. Good enough for a single-host prototype.
 * A limit of 0 turns the limiter off.
 */
final class RateLimiter
{
    public function __construct(
        private readonly string $directory,
        private readonly int $limit,
        private readonly int $windowSeconds = 60,
    ) {
    }

    /** Records a hit and returns false once the key is over the limit for the current window. */
    public function hit(string $key, int $now): bool
    {
        if ($this->limit <= 0) {
            return true;
        }
        if (!is_dir($this->directory) && !mkdir($this->directory, 0700, true) && !is_dir($this->directory)) {
            return true;
        }

        $file = $this->directory . '/' . hash('sha256', $key) . '.json';
        $handle = fopen($file, 'c+');
        if ($handle === false) {
            return true;
        }

        try {
            flock($handle, LOCK_EX);
            $state = json_decode((string) stream_get_contents($handle), true);
            $windowStart = is_array($state) ? (int) ($state['start'] ?? 0) : 0;
            $count = is_array($state) ? (int) ($state['count'] ?? 0) : 0;

            if ($now - $windowStart >= $this->windowSeconds) {
                $windowStart = $now;
                $count = 0;
            }
            $count++;

            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, json_encode(['start' => $windowStart, 'count' => $count]));
            fflush($handle);
            flock($handle, LOCK_UN);

            return $count <= $this->limit;
        } finally {
            fclose($handle);
        }
    }
}
