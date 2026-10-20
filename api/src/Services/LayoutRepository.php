<?php

declare(strict_types=1);

namespace UrbanAir\Services;

use RuntimeException;
use SimpleXMLElement;

/**
 * Reads seat layouts and the feature matrix from api/data/xml.
 * Results are cached per process.
 */
final class LayoutRepository
{
    private const LAYOUT_NS = 'urn:urbanair:aircraft-layouts:1';
    private const FEATURE_NS = 'urn:urbanair:seat-features:1';

    /** @var array<string, array>|null */
    private static ?array $layouts = null;

    /** @var array<string, array>|null */
    private static ?array $features = null;

    public function __construct(private readonly string $xmlDir)
    {
    }

    /**
     * @return array<string, array{key: string, typeCode: string, cabins: list<array>, exitRows: list<int>, bulkheadRows: list<int>, blockedRows: list<array{number: int, label: string}>}>
     */
    public function layouts(): array
    {
        if (self::$layouts !== null) {
            return self::$layouts;
        }

        $xml = $this->load('aircraft_layouts.xml');
        $xml->registerXPathNamespace('u', self::LAYOUT_NS);
        $out = [];

        foreach ($xml->xpath('//u:layout') ?: [] as $layout) {
            $typeCode = (string) $layout['typeCode'];

            $cabins = [];
            foreach ($layout->cabin as $cabin) {
                $cabins[] = [
                    'class' => (string) $cabin['class'],
                    'firstRow' => (int) $cabin['firstRow'],
                    'lastRow' => (int) $cabin['lastRow'],
                    'pattern' => (string) $cabin['pattern'],
                ];
            }

            $blocked = [];
            foreach ($layout->blockedRows->row ?? [] as $row) {
                $blocked[] = ['number' => (int) $row['number'], 'label' => (string) $row['label']];
            }

            $out[$typeCode] = [
                'key' => (string) $layout['key'],
                'typeCode' => $typeCode,
                'cabins' => $cabins,
                'exitRows' => $this->intList($layout->exitRows->row ?? []),
                'bulkheadRows' => $this->intList($layout->bulkheadRows->row ?? []),
                'blockedRows' => $blocked,
            ];
        }

        return self::$layouts = $out;
    }

    /**
     * @return array<string, array{code: string, label: string, description: string}>
     */
    public function features(): array
    {
        if (self::$features !== null) {
            return self::$features;
        }

        $xml = $this->load('seat_features.xml');
        $xml->registerXPathNamespace('f', self::FEATURE_NS);
        $out = [];

        foreach ($xml->xpath('//f:feature') ?: [] as $feature) {
            $code = (string) $feature['code'];
            $out[$code] = [
                'code' => $code,
                'label' => (string) $feature['label'],
                'description' => (string) $feature['description'],
            ];
        }

        return self::$features = $out;
    }

    /** Clears the per-process cache. Used by tests. */
    public static function resetCache(): void
    {
        self::$layouts = null;
        self::$features = null;
    }

    private function load(string $file): SimpleXMLElement
    {
        $path = $this->xmlDir . '/' . $file;
        $xml = simplexml_load_file($path);
        if ($xml === false) {
            throw new RuntimeException("Cannot parse XML: {$path}");
        }
        return $xml;
    }

    /** @param iterable<SimpleXMLElement> $rows */
    private function intList(iterable $rows): array
    {
        $list = [];
        foreach ($rows as $row) {
            $list[] = (int) $row;
        }
        return $list;
    }
}
