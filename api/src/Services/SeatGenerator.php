<?php

declare(strict_types=1);

namespace UrbanAir\Services;

/**
 * Expands a layout into concrete seats with class and feature codes.
 * Pure function: no database or randomness here.
 */
final class SeatGenerator
{
    /**
     * @param array $layout One entry from LayoutRepository::layouts()
     * @return list<array{row: int, col: string, class: string, features: list<string>}>
     */
    public static function generate(array $layout): array
    {
        $exitRows = $layout['exitRows'];
        $bulkheadRows = $layout['bulkheadRows'];
        $seats = [];

        foreach ($layout['cabins'] as $cabin) {
            for ($row = $cabin['firstRow']; $row <= $cabin['lastRow']; $row++) {
                $isExit = in_array($row, $exitRows, true);
                $isBulkhead = in_array($row, $bulkheadRows, true);

                foreach (self::columns($cabin['pattern']) as $col => $position) {
                    $features = self::positionFeatures($cabin['pattern'], $position);

                    if ($cabin['class'] === 'BUSINESS') {
                        $features[] = 'POWER';
                    }
                    if ($isBulkhead) {
                        $features[] = 'BULKHEAD';
                    }
                    if ($isExit) {
                        array_push($features, 'EXIT_ROW', 'EXTRA_LEGROOM', 'NO_RECLINE');
                    }

                    $seats[] = [
                        'row' => $row,
                        'col' => $col,
                        'class' => $cabin['class'],
                        'features' => array_values(array_unique($features)),
                    ];
                }
            }
        }

        return $seats;
    }

    /**
     * Maps each seat letter to its index in the pattern string (skipping aisles).
     *
     * @return array<string, int>
     */
    public static function columns(string $pattern): array
    {
        $columns = [];
        foreach (str_split($pattern) as $index => $char) {
            if ($char !== '_') {
                $columns[$char] = $index;
            }
        }
        return $columns;
    }

    /** @return list<string> */
    private static function positionFeatures(string $pattern, int $index): array
    {
        $features = [];
        $length = strlen($pattern);

        if ($index === 0 || $index === $length - 1) {
            $features[] = 'WINDOW';
        }
        $left = $index > 0 ? $pattern[$index - 1] : null;
        $right = $index < $length - 1 ? $pattern[$index + 1] : null;
        if ($left === '_' || $right === '_') {
            $features[] = 'AISLE';
        }

        return $features;
    }
}
