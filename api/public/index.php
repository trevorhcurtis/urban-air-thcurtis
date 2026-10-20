<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use UrbanAir\Controllers\BookingController;
use UrbanAir\Controllers\FlightController;
use UrbanAir\Controllers\ReferenceController;
use UrbanAir\Repositories\FlightRepository;
use UrbanAir\Repositories\ReferenceRepository;
use UrbanAir\Services\ErrorSimulator;
use UrbanAir\Services\LayoutRepository;
use UrbanAir\Services\ReseedService;
use UrbanAir\Support\Db;
use UrbanAir\Support\Env;
use UrbanAir\Support\Json;
use UrbanAir\Support\RateLimiter;
use UrbanAir\Support\RequestContext;
use UrbanAir\Support\Router;

Env::load(__DIR__ . '/../.env');

// Errors go to the PHP error log, never to the visitor.
ini_set('display_errors', '0');

$xmlDir = __DIR__ . '/../data/xml';

$startedAt = microtime(true);
$logRequest = static function (int $status) use ($startedAt): void {
    // One line per request: no bodies, no card data, no IPs.
    $line = sprintf("%s %s %s %d %dms\n", gmdate('c'), RequestContext::id(), $_SERVER['REQUEST_METHOD'] ?? 'GET', $status, (int) ((microtime(true) - $startedAt) * 1000));
    @file_put_contents(__DIR__ . '/../storage/requests.log', $line, FILE_APPEND | LOCK_EX);
};
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    // When API_PROXY_SECRET is set, only the Next.js server (which sends the same value) may call the API.
    // Without this, anyone who finds the API host could send their own X-Client-IP and skip the rate limit.
    $proxySecret = Env::get('API_PROXY_SECRET');
    if ($proxySecret !== '' && !hash_equals($proxySecret, (string) ($_SERVER['HTTP_X_PROXY_SECRET'] ?? ''))) {
        Json::send(403, Json::error('forbidden', 'Forbidden.'));
        $logRequest(403);
        exit;
    }

    // Per-IP limit on the API. Limits come from RATE_LIMIT_PER_MINUTE (0 disables).
    $limiter = new RateLimiter(__DIR__ . '/../storage/ratelimit', (int) Env::get('RATE_LIMIT_PER_MINUTE', '120'));
    // The web proxy sets X-Client-IP to the visitor's address. Server-side renders send no visitor address,
    // so with the secret set they are not counted against one shared bucket. The Next.js server is the gate there.
    $visitorIp = $_SERVER['HTTP_X_CLIENT_IP'] ?? null;
    $limitKey = $visitorIp ?? ($proxySecret === '' ? (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown') : null);
    if (str_starts_with($path, '/api/') && $limitKey !== null && !$limiter->hit($limitKey, time())) {
        Json::send(429, Json::error('rate_limited', 'Too many requests. Please wait a minute and try again.'));
        $logRequest(429);
        exit;
    }

    $pdo = Db::pdo();
    $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));

    // Lazy 24-hour reseed: the first request after expiry rebuilds the sample data.
    $reseed = new ReseedService($pdo, $xmlDir);
    $reseed->ensureFresh($now);

    $reference = new ReferenceRepository($pdo);
    $flights = new FlightRepository($pdo);
    $layouts = new LayoutRepository($xmlDir);
    $simulator = new ErrorSimulator($pdo, Env::bool('SIMULATE_ERRORS'), Env::get('SIMULATE_ERRORS_SEED') ?: null);

    $referenceCtl = new ReferenceController($reference, $layouts, $reseed);
    $flightCtl = new FlightController($reference, $flights, $layouts, $simulator, $now);
    $bookingCtl = new BookingController($flights, $simulator, $now);

    $router = new Router();
    $router->add('GET', '/api/v1/meta/status', [$referenceCtl, 'status']);
    $router->add('GET', '/api/v1/airports', [$referenceCtl, 'airports']);
    $router->add('GET', '/api/v1/routes', [$referenceCtl, 'routes']);
    $router->add('GET', '/api/v1/partners', [$referenceCtl, 'partners']);
    $router->add('GET', '/api/v1/rewards/tiers', [$referenceCtl, 'rewardsTiers']);
    $router->add('GET', '/api/v1/seat-features', [$referenceCtl, 'seatFeatures']);
    $router->add('POST', '/api/v1/search', [$flightCtl, 'search']);
    $router->add('GET', '/api/v1/flights/{id}', [$flightCtl, 'detail']);
    $router->add('GET', '/api/v1/flights/{id}/seatmap', [$flightCtl, 'seatMap']);
    $router->add('POST', '/api/v1/bookings/validate-passengers', [$bookingCtl, 'validatePassengers']);
    $router->add('POST', '/api/v1/bookings/validate-payment', [$bookingCtl, 'validatePayment']);
    $router->add('POST', '/api/v1/bookings/confirm', [$bookingCtl, 'confirm']);

    $result = $router->dispatch($method, rtrim($path, '/') ?: '/');
    $status = $result['status'];
    Json::send($status, $result['body']);
} catch (\Throwable $e) {
    error_log('[urbanair] ' . $e::class . ': ' . $e->getMessage());
    $status = 500;
    Json::send(500, Json::error('server_error', 'Something went wrong on our side. Please try again.'));
}
$logRequest($status);
