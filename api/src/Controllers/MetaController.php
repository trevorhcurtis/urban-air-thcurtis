<?php

declare(strict_types=1);

namespace UrbanAir\Controllers;

use UrbanAir\Support\Json;

final class MetaController
{
    public static function status(): array
    {
        return Json::ok([
            'service' => 'urbanair-api',
            'version' => '0.1.0',
            'time' => gmdate('c'),
        ]);
    }
}
