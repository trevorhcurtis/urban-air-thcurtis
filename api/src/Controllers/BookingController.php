<?php

declare(strict_types=1);

namespace UrbanAir\Controllers;

use DateTimeImmutable;
use UrbanAir\Repositories\FlightRepository;
use UrbanAir\Services\ErrorSimulator;
use UrbanAir\Services\Validator;
use UrbanAir\Support\Json;
use UrbanAir\Support\Request;
use UrbanAir\Support\Response;

/**
 * Booking endpoints. Nothing is stored. Card data is format-checked and discarded.
 */
final class BookingController
{
    private const CONFIRMATION_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public function __construct(
        private readonly FlightRepository $flights,
        private readonly ErrorSimulator $simulator,
        private readonly DateTimeImmutable $now,
    ) {
    }

    public function validatePassengers(): array|Response
    {
        $input = Request::body();
        $count = (int) ($input['passenger_count'] ?? 0);
        $errors = Validator::passengers($input['passengers'] ?? [], $count, $this->now);

        if ($errors !== []) {
            return Response::json(422, Json::envelope(false, null, $errors));
        }

        $issue = $this->simulator->roll('validate_passengers', Request::fingerprint());
        if ($issue !== null && $issue['blocking']) {
            return Response::json(503, Json::envelope(false, null, [['code' => $issue['code'], 'message' => $issue['message']]], [], $issue));
        }

        return Json::ok(['valid' => true, 'passenger_count' => $count], [], $issue);
    }

    public function validatePayment(): array|Response
    {
        $errors = Validator::payment(Request::body(), $this->now);

        if ($errors !== []) {
            return Response::json(422, Json::envelope(false, null, $errors));
        }

        return Json::ok(['valid' => true]);
    }

    /**
     * Simulated confirmation. Checks flights, classes, seat availability, and passengers, then
     * returns a confirmation code. Nothing is persisted and no payment data is accepted here.
     */
    public function confirm(): array|Response
    {
        $input = Request::body();
        $legs = array_values(array_filter([$input['outbound'] ?? null, $input['return'] ?? null]));
        $passengers = $input['passengers'] ?? [];
        $count = count($passengers);

        $errors = Validator::passengers($passengers, $count, $this->now);
        $total = 0;
        $resolved = [];

        foreach ($legs as $leg) {
            $flight = $this->flights->find((int) ($leg['flight_id'] ?? 0));
            if ($flight === null) {
                $errors[] = ['field' => 'flight_id', 'code' => 'not_found', 'message' => 'That flight is no longer available.'];
                continue;
            }

            $class = null;
            foreach ($flight['classes'] as $candidate) {
                if ($candidate['code'] === ($leg['class'] ?? '')) {
                    $class = $candidate;
                }
            }
            if ($class === null || $class['seats_open'] < $count) {
                $errors[] = ['field' => 'class', 'code' => 'unavailable', 'message' => 'Not enough seats remain in that class.'];
                continue;
            }

            $total += $class['price_cents'] * $count;
            $resolved[] = ['flight_id' => $flight['id'], 'flight_number' => $flight['flight_number'], 'class' => $class['code']];
        }

        if ($errors !== []) {
            return Response::json(422, Json::envelope(false, null, $errors));
        }

        $issue = $this->simulator->roll('confirm', Request::fingerprint());
        if ($issue !== null && $issue['blocking']) {
            return Response::json(503, Json::envelope(false, null, [['code' => $issue['code'], 'message' => $issue['message']]], [], $issue));
        }

        return Json::ok([
            'confirmation_code' => 'UA' . $this->code(6),
            'legs' => $resolved,
            'passenger_count' => $count,
            'base_fare_cents' => $total,
        ], [], $issue);
    }

    private function code(int $length): string
    {
        $out = '';
        for ($i = 0; $i < $length; $i++) {
            $out .= self::CONFIRMATION_ALPHABET[random_int(0, strlen(self::CONFIRMATION_ALPHABET) - 1)];
        }
        return $out;
    }
}
