<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use DOMDocument;
use PHPUnit\Framework\TestCase;

final class XmlSchemaTest extends TestCase
{
    public function testSeatFeaturesMatchSchema(): void
    {
        self::assertValidXml('seat_features.xml', 'seat_features.xsd');
    }

    public function testAircraftLayoutsMatchSchema(): void
    {
        self::assertValidXml('aircraft_layouts.xml', 'aircraft_layouts.xsd');
    }

    private static function assertValidXml(string $xml, string $xsd): void
    {
        $dir = __DIR__ . '/../data/xml';
        $doc = new DOMDocument();
        $doc->load("{$dir}/{$xml}");

        self::assertTrue($doc->schemaValidate("{$dir}/{$xsd}"), "{$xml} failed {$xsd}");
    }
}
