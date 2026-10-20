<?php

declare(strict_types=1);

namespace UrbanAir\Controllers;

use DateTimeImmutable;
use UrbanAir\Repositories\FlightRepository;
use UrbanAir\Repositories\ReferenceRepository;
use UrbanAir\Services\ErrorSimulator;
use UrbanAir\Services\LayoutRepository;
use UrbanAir\Services\Validator;
use UrbanAir\Support\Json;
use UrbanAir\Support\Request;
use UrbanAir\Support\Response;

final class FlightController
{
    public function __construct(
        private readonly ReferenceRepository $reference,
        private readonly FlightRepository $flights,
        private readonly LayoutRepository $layouts,
        private readonly ErrorSimulator $simulator,
        private readonly DateTimeImmutable $now,
    ) {
    }

    /**
     * Every search returns the same 40 flights. The searched route labels each flight.
     */
    public function search(): array|Response
    {
        $input = Request::body();
        $passengers = (int) ($input['passengers'] ?? 0);

        $errors = Validator::search($input, $this->reference->airportCodes(), $this->reference->routePairs(), $this->now);
        if ($errors !== []) {
            return Response::json(422, Json::envelope(false, null, $errors));
        }

        $issue = $this->simulator->roll('search', Request::fingerprint());
        if ($issue !== null && $issue['blocking']) {
            return $this->blocked($issue);
        }

        $origin = strtoupper((string) $input['origin']);
        $destination = strtoupper((string) $input['destination']);
        $roundTrip = $input['trip_type'] === 'round_trip';

        $outbound = $this->leg($origin, $destination, $passengers);
        $return = $roundTrip ? $this->leg($destination, $origin, $passengers) : null;

        return Json::ok([
            'search' => [
                'origin' => $origin,
                'destination' => $destination,
                'trip_type' => $input['trip_type'],
                'depart_date' => $input['depart_date'],
                'return_date' => $roundTrip ? $input['return_date'] : null,
                'passengers' => $passengers,
            ],
            'outbound' => $outbound,
            'return' => $return,
        ], [], $issue);
    }

    public function detail(array $params): array|Response
    {
        $flight = $this->flights->find((int) $params['id']);
        if ($flight === null) {
            return Response::json(404, Json::error('flight_not_found', 'That flight is no longer available.'));
        }

        $issue = $this->simulator->roll('flight_detail', Request::fingerprint());
        if ($issue !== null && $issue['blocking']) {
            return $this->blocked($issue);
        }

        // Informational fare change: the price moves up 5 percent and the issue explains why.
        if ($issue !== null && $issue['code'] === 'fare_changed') {
            foreach ($flight['classes'] as &$class) {
                $class['price_cents'] = (int) round($class['price_cents'] * 1.05 / 100) * 100;
            }
            unset($class);
        }

        return Json::ok(['flight' => $flight], [], $issue);
    }

    public function seatMap(array $params): array|Response
    {
        $flight = $this->flights->find((int) $params['id']);
        if ($flight === null) {
            return Response::json(404, Json::error('flight_not_found', 'That flight is no longer available.'));
        }

        $issue = $this->simulator->roll('seatmap', Request::fingerprint());
        if ($issue !== null && $issue['blocking']) {
            return $this->blocked($issue);
        }

        $layout = $this->layouts->layouts()[$flight['aircraft']['type_code']];

        return Json::ok([
            'flight_id' => $flight['id'],
            'aircraft' => $flight['aircraft'],
            'layout' => [
                'key' => $layout['key'],
                'cabins' => $layout['cabins'],
                'exit_rows' => $layout['exitRows'],
                'bulkhead_rows' => $layout['bulkheadRows'],
                'blocked_rows' => $layout['blockedRows'],
            ],
            'seats' => $this->flights->seats($flight['id']),
            'features' => $this->layouts->features(),
        ], [], $issue);
    }

    /** @return list<array<string, mixed>> */
    private function leg(string $origin, string $destination, int $passengers): array
    {
        return array_map(function (array $flight) use ($origin, $destination, $passengers): array {
            $flight['route'] = ['origin' => $origin, 'destination' => $destination];
            $flight['classes'] = array_map(fn (array $c) => $c + [
                'available' => $c['seats_open'] >= $passengers,
            ], $flight['classes']);
            return $flight;
        }, $this->flights->all());
    }

    /** @param array{code: string, title: string, message: string, retry_allowed: bool} $issue */
    private function blocked(array $issue): Response
    {
        return Response::json(503, Json::envelope(false, null, [
            ['code' => $issue['code'], 'message' => $issue['message']],
        ], [], $issue));
    }
}
