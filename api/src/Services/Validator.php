<?php

declare(strict_types=1);

namespace UrbanAir\Services;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Server-side validation. Rules mirror web/lib/validation so the browser and server agree.
 * Returns field errors shaped as {field, code, message}. An empty list means valid.
 * Card data is checked for format only and is never stored or logged.
 */
final class Validator
{
    private const NAME_PATTERN = "/^[A-Za-z][A-Za-z '\\-.]{0,39}$/";
    private const PHONE_PATTERN = '/^\+?[0-9 ()\-]{7,20}$/';
    private const EXPIRY_PATTERN = '/^(0[1-9]|1[0-2])\/(\d{2})$/';
    private const POSTAL_PATTERN = '/^\d{5}(-\d{4})?$/';
    private const GENDERS = ['F', 'M', 'X', 'U'];
    private const ASSISTANCE = ['NONE', 'WHEELCHAIR', 'VISUAL', 'HEARING'];

    /** @return list<array{field: string, code: string, message: string}> */
    public static function search(array $input, array $airportCodes, array $routePairs, DateTimeImmutable $today): array
    {
        $errors = [];
        $origin = strtoupper(trim((string) ($input['origin'] ?? '')));
        $destination = strtoupper(trim((string) ($input['destination'] ?? '')));
        $tripType = (string) ($input['trip_type'] ?? '');
        $passengers = $input['passengers'] ?? null;

        if (!in_array($origin, $airportCodes, true)) {
            $errors[] = self::error('origin', 'unknown_airport', 'Choose a departure airport from the list.');
        }
        if (!in_array($destination, $airportCodes, true)) {
            $errors[] = self::error('destination', 'unknown_airport', 'Choose an arrival airport from the list.');
        }
        if ($origin !== '' && $origin === $destination) {
            $errors[] = self::error('destination', 'same_airport', 'Departure and arrival must be different.');
        }
        if ($errors === [] && !self::routeOffered($origin, $destination, $routePairs)) {
            $errors[] = self::error('destination', 'route_not_offered', 'Urban Air does not fly this route yet.');
        }

        if (!in_array($tripType, ['round_trip', 'one_way'], true)) {
            $errors[] = self::error('trip_type', 'invalid', 'Choose round-trip or one-way.');
        }

        $window = self::window($today);
        $departDate = self::date($input['depart_date'] ?? null);
        if ($departDate === null || $departDate < $window['min'] || $departDate > $window['max']) {
            $errors[] = self::error('depart_date', 'out_of_range', 'Choose a departure date within the next 30 days.');
        }

        if ($tripType === 'round_trip') {
            $returnDate = self::date($input['return_date'] ?? null);
            if ($returnDate === null) {
                $errors[] = self::error('return_date', 'required', 'Choose a return date.');
            } elseif ($departDate !== null && $returnDate <= $departDate) {
                $errors[] = self::error('return_date', 'before_depart', 'Return must be after departure.');
            } elseif ($returnDate > $window['max']) {
                $errors[] = self::error('return_date', 'out_of_range', 'Choose a return date within the next 30 days.');
            }
        }

        if (!is_int($passengers) && !(is_string($passengers) && ctype_digit($passengers))) {
            $errors[] = self::error('passengers', 'invalid', 'Choose between 1 and 9 passengers.');
        } elseif ((int) $passengers < 1 || (int) $passengers > 9) {
            $errors[] = self::error('passengers', 'out_of_range', 'Choose between 1 and 9 passengers.');
        }

        return $errors;
    }

    /**
     * @param list<array<string, mixed>> $passengers
     * @return list<array{field: string, code: string, message: string}>
     */
    public static function passengers(array $passengers, int $expectedCount, DateTimeImmutable $today): array
    {
        $errors = [];
        if ($expectedCount < 1 || $expectedCount > 9) {
            $errors[] = self::error('passengers', 'out_of_range', 'Choose between 1 and 9 passengers.');
            return $errors;
        }
        if (count($passengers) !== $expectedCount) {
            $errors[] = self::error('passengers', 'count_mismatch', "Enter details for {$expectedCount} passenger(s).");
            return $errors;
        }

        foreach ($passengers as $index => $passenger) {
            $prefix = "passengers.{$index}.";

            foreach (['first_name' => 'First name', 'last_name' => 'Last name'] as $field => $label) {
                $value = trim((string) ($passenger[$field] ?? ''));
                if ($value === '') {
                    $errors[] = self::error($prefix . $field, 'required', "{$label} is required.");
                } elseif (!preg_match(self::NAME_PATTERN, $value)) {
                    $errors[] = self::error($prefix . $field, 'invalid_characters', "{$label} can only use letters, spaces, apostrophes, hyphens, and periods.");
                }
            }

            $dob = self::date($passenger['date_of_birth'] ?? null);
            if ($dob === null) {
                $errors[] = self::error($prefix . 'date_of_birth', 'required', 'Enter a valid date of birth.');
            } elseif ($dob > $today->format('Y-m-d')) {
                $errors[] = self::error($prefix . 'date_of_birth', 'future', 'Date of birth cannot be in the future.');
            } elseif ((int) $today->diff(new DateTimeImmutable($dob))->y > 120) {
                $errors[] = self::error($prefix . 'date_of_birth', 'out_of_range', 'Enter a date of birth within the last 120 years.');
            }

            $gender = (string) ($passenger['gender'] ?? '');
            if ($gender !== '' && !in_array($gender, self::GENDERS, true)) {
                $errors[] = self::error($prefix . 'gender', 'invalid', 'Choose a gender option from the list.');
            }

            $assistance = (string) ($passenger['special_assistance'] ?? 'NONE');
            if (!in_array($assistance, self::ASSISTANCE, true)) {
                $errors[] = self::error($prefix . 'special_assistance', 'invalid', 'Choose an assistance option from the list.');
            }

            if ($index === 0) {
                $errors = array_merge($errors, self::primaryContact($passenger));
            }
        }

        return $errors;
    }

    /**
     * Format checks only. Card data is not stored, logged, or verified.
     *
     * @return list<array{field: string, code: string, message: string}>
     */
    public static function payment(array $payment, DateTimeImmutable $today): array
    {
        $errors = [];

        $name = trim((string) ($payment['cardholder_name'] ?? ''));
        if ($name === '') {
            $errors[] = self::error('cardholder_name', 'required', 'Enter the name on the card.');
        } elseif (!preg_match(self::NAME_PATTERN, $name)) {
            $errors[] = self::error('cardholder_name', 'invalid_characters', 'Name can only use letters, spaces, apostrophes, hyphens, and periods.');
        }

        $number = preg_replace('/[\s-]/', '', (string) ($payment['card_number'] ?? '')) ?? '';
        if (!preg_match('/^\d{13,19}$/', $number) || !self::luhn($number)) {
            $errors[] = self::error('card_number', 'invalid_card_number', 'Enter a valid card number.');
        }

        $expiry = (string) ($payment['expiry'] ?? '');
        if (!preg_match(self::EXPIRY_PATTERN, $expiry)) {
            $errors[] = self::error('expiry', 'invalid_expiry', 'Use the MM/YY format.');
        } else {
            [$month, $year] = array_map('intval', explode('/', $expiry));
            $lastDay = (new DateTimeImmutable(sprintf('20%02d-%02d-01', $year, $month)))->format('Y-m-t');
            if ($lastDay < $today->format('Y-m-d')) {
                $errors[] = self::error('expiry', 'expired', 'This card has expired.');
            }
        }

        if (!preg_match('/^\d{3,4}$/', (string) ($payment['cvv'] ?? ''))) {
            $errors[] = self::error('cvv', 'invalid_cvv', 'Enter the 3 or 4 digit security code.');
        }

        if (!preg_match(self::POSTAL_PATTERN, trim((string) ($payment['postal_code'] ?? '')))) {
            $errors[] = self::error('postal_code', 'invalid_postal_code', 'Enter a 5 digit ZIP code.');
        }

        return $errors;
    }

    /** @return list<array{field: string, code: string, message: string}> */
    private static function primaryContact(array $passenger): array
    {
        $errors = [];
        $email = trim((string) ($passenger['email'] ?? ''));

        if ($email === '') {
            $errors[] = self::error('passengers.0.email', 'required', 'Enter an email address for confirmations.');
        } elseif (strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errors[] = self::error('passengers.0.email', 'invalid_email', 'Enter a valid email address.');
        }

        $phone = trim((string) ($passenger['phone'] ?? ''));
        if ($phone !== '' && !preg_match(self::PHONE_PATTERN, $phone)) {
            $errors[] = self::error('passengers.0.phone', 'invalid_phone', 'Enter a valid phone number.');
        }

        if (($passenger['terms_accepted'] ?? false) !== true) {
            $errors[] = self::error('passengers.0.terms_accepted', 'required', 'Accept the terms to continue.');
        }

        return $errors;
    }

    /** @param list<array{origin: string, destination: string}> $routePairs */
    private static function routeOffered(string $origin, string $destination, array $routePairs): bool
    {
        foreach ($routePairs as $route) {
            if (($route['origin'] === $origin && $route['destination'] === $destination)
                || ($route['origin'] === $destination && $route['destination'] === $origin)) {
                return true;
            }
        }
        return false;
    }

    /** @return array{min: string, max: string} */
    public static function window(DateTimeImmutable $today): array
    {
        $utc = new DateTimeZone('UTC');
        $base = $today->setTimezone($utc);
        return [
            'min' => $base->modify('+1 day')->format('Y-m-d'),
            'max' => $base->modify('+30 days')->format('Y-m-d'),
        ];
    }

    /** Returns a Y-m-d string for a real calendar date, or null. */
    private static function date(mixed $value): ?string
    {
        if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return null;
        }
        $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $value, new DateTimeZone('UTC'));
        return ($parsed !== false && $parsed->format('Y-m-d') === $value) ? $value : null;
    }

    private static function luhn(string $number): bool
    {
        $sum = 0;
        $double = false;
        for ($i = strlen($number) - 1; $i >= 0; $i--) {
            $digit = (int) $number[$i];
            if ($double) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit -= 9;
                }
            }
            $sum += $digit;
            $double = !$double;
        }
        return $sum % 10 === 0;
    }

    /** @return array{field: string, code: string, message: string} */
    private static function error(string $field, string $code, string $message): array
    {
        return ['field' => $field, 'code' => $code, 'message' => $message];
    }
}
