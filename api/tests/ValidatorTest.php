<?php

declare(strict_types=1);

namespace UrbanAir\Tests;

use DateTimeImmutable;
use PHPUnit\Framework\TestCase;
use UrbanAir\Services\Validator;

final class ValidatorTest extends TestCase
{
    private DateTimeImmutable $today;

    protected function setUp(): void
    {
        $this->today = new DateTimeImmutable('2026-10-15', new \DateTimeZone('UTC'));
    }

    private function codes(array $errors): array
    {
        return array_column($errors, 'code', 'field');
    }

    private function search(array $overrides = []): array
    {
        $input = $overrides + [
            'origin' => 'DFW', 'destination' => 'LAX', 'trip_type' => 'round_trip',
            'depart_date' => '2026-10-20', 'return_date' => '2026-10-25', 'passengers' => 2,
        ];
        $airports = ['DFW', 'LAX', 'ATL', 'ORD'];
        $routes = [['origin' => 'DFW', 'destination' => 'LAX'], ['origin' => 'ATL', 'destination' => 'ORD']];
        return Validator::search($input, $airports, $routes, $this->today);
    }

    public function testValidRoundTripSearchPasses(): void
    {
        self::assertSame([], $this->search());
    }

    public function testReversedRouteIsAcceptedBecauseRoutesAreBidirectional(): void
    {
        self::assertSame([], $this->search(['origin' => 'LAX', 'destination' => 'DFW']));
    }

    public function testUnofferedRouteIsRejected(): void
    {
        self::assertSame('route_not_offered', $this->codes($this->search(['origin' => 'DFW', 'destination' => 'ORD']))['destination']);
    }

    public function testSameAirportIsRejected(): void
    {
        self::assertSame('same_airport', $this->codes($this->search(['destination' => 'DFW']))['destination']);
    }

    public function testRoundTripNeedsReturnAfterDeparture(): void
    {
        self::assertSame('required', $this->codes($this->search(['return_date' => null]))['return_date']);
        self::assertSame('before_depart', $this->codes($this->search(['return_date' => '2026-10-19']))['return_date']);
    }

    public function testOneWayIgnoresReturnDate(): void
    {
        self::assertSame([], $this->search(['trip_type' => 'one_way', 'return_date' => null]));
    }

    public function testDateOutsideThirtyDayWindowIsRejected(): void
    {
        self::assertSame('out_of_range', $this->codes($this->search(['depart_date' => '2026-10-15']))['depart_date']);
        self::assertSame('out_of_range', $this->codes($this->search(['depart_date' => '2026-12-01']))['depart_date']);
    }

    public function testPassengerCountIsBounded(): void
    {
        self::assertSame('out_of_range', $this->codes($this->search(['passengers' => 10]))['passengers']);
        self::assertSame('invalid', $this->codes($this->search(['passengers' => 'two']))['passengers']);
    }

    public function testPassengerFieldRulesPassAndFail(): void
    {
        $good = $this->passenger();
        self::assertSame([], Validator::passengers([$good], 1, $this->today));

        $bad = $this->passenger(['first_name' => '', 'last_name' => 'R2D2!', 'date_of_birth' => '2030-01-01']);
        $errors = Validator::passengers([$bad], 1, $this->today);
        $codes = $this->codes($errors);

        self::assertSame('required', $codes['passengers.0.first_name']);
        self::assertSame('invalid_characters', $codes['passengers.0.last_name']);
        self::assertSame('future', $codes['passengers.0.date_of_birth']);
    }

    public function testPrimaryPassengerNeedsEmailAndTerms(): void
    {
        $errors = Validator::passengers([$this->passenger(['email' => 'nope', 'terms_accepted' => false])], 1, $this->today);
        $codes = $this->codes($errors);

        self::assertSame('invalid_email', $codes['passengers.0.email']);
        self::assertSame('required', $codes['passengers.0.terms_accepted']);
    }

    public function testSecondaryPassengerDoesNotNeedContact(): void
    {
        $passengers = [$this->passenger(), $this->passenger(['email' => null, 'terms_accepted' => null])];
        self::assertSame([], Validator::passengers($passengers, 2, $this->today));
    }

    public function testPassengerCountMustMatch(): void
    {
        self::assertSame('count_mismatch', $this->codes(Validator::passengers([$this->passenger()], 2, $this->today))['passengers']);
        self::assertSame('out_of_range', $this->codes(Validator::passengers([], 0, $this->today))['passengers']);
    }

    public function testValidPaymentPasses(): void
    {
        // 4111 1111 1111 1111 is a standard Luhn-valid test number.
        self::assertSame([], Validator::payment($this->payment(), $this->today));
    }

    public function testPaymentRulesFail(): void
    {
        $codes = $this->codes(Validator::payment($this->payment([
            'card_number' => '4111 1111 1111 1112',
            'expiry' => '13/30',
            'cvv' => '12',
            'postal_code' => '7500',
        ]), $this->today));

        self::assertSame('invalid_card_number', $codes['card_number']);
        self::assertSame('invalid_expiry', $codes['expiry']);
        self::assertSame('invalid_cvv', $codes['cvv']);
        self::assertSame('invalid_postal_code', $codes['postal_code']);
    }

    public function testExpiredCardIsRejected(): void
    {
        self::assertSame('expired', $this->codes(Validator::payment($this->payment(['expiry' => '09/26']), $this->today))['expiry']);
    }

    private function passenger(array $overrides = []): array
    {
        return $overrides + [
            'first_name' => 'Alex', 'last_name' => "O'Brien-Smith", 'date_of_birth' => '1990-05-04',
            'gender' => 'X', 'special_assistance' => 'NONE', 'email' => 'alex@example.com',
            'phone' => '+1 (555) 010-2030', 'terms_accepted' => true,
        ];
    }

    private function payment(array $overrides = []): array
    {
        return $overrides + [
            'cardholder_name' => 'Alex Traveler', 'card_number' => '4111 1111 1111 1111',
            'expiry' => '12/30', 'cvv' => '123', 'postal_code' => '75001',
        ];
    }
}
