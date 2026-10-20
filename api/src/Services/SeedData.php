<?php

declare(strict_types=1);

namespace UrbanAir\Services;

/**
 * Static reference data for the prototype. Names are real airports and aircraft models;
 * flight numbers, tail numbers, and passenger names are synthetic.
 */
final class SeedData
{
    /** @return list<array{code: string, name: string, city: string, timezone: string}> */
    public static function airports(): array
    {
        return [
            ['code' => 'DFW', 'name' => 'Dallas/Fort Worth International', 'city' => 'Dallas', 'timezone' => 'America/Chicago'],
            ['code' => 'LAX', 'name' => 'Los Angeles International', 'city' => 'Los Angeles', 'timezone' => 'America/Los_Angeles'],
            ['code' => 'ATL', 'name' => 'Hartsfield-Jackson Atlanta International', 'city' => 'Atlanta', 'timezone' => 'America/New_York'],
            ['code' => 'ORD', 'name' => "O'Hare International", 'city' => 'Chicago', 'timezone' => 'America/Chicago'],
            ['code' => 'SFO', 'name' => 'San Francisco International', 'city' => 'San Francisco', 'timezone' => 'America/Los_Angeles'],
            ['code' => 'MIA', 'name' => 'Miami International', 'city' => 'Miami', 'timezone' => 'America/New_York'],
            ['code' => 'SEA', 'name' => 'Seattle-Tacoma International', 'city' => 'Seattle', 'timezone' => 'America/Los_Angeles'],
            ['code' => 'PHX', 'name' => 'Phoenix Sky Harbor International', 'city' => 'Phoenix', 'timezone' => 'America/Phoenix'],
            ['code' => 'DEN', 'name' => 'Denver International', 'city' => 'Denver', 'timezone' => 'America/Denver'],
            ['code' => 'JFK', 'name' => 'John F. Kennedy International', 'city' => 'New York', 'timezone' => 'America/New_York'],
            ['code' => 'SLC', 'name' => 'Salt Lake City International', 'city' => 'Salt Lake City', 'timezone' => 'America/Denver'],
            ['code' => 'SAN', 'name' => 'San Diego International', 'city' => 'San Diego', 'timezone' => 'America/Los_Angeles'],
        ];
    }

    /**
     * The six bookable route pairs. Each pair works in either direction for round trips.
     *
     * @return list<array{origin: string, destination: string, distance_mi: int, duration_min: int}>
     */
    public static function routes(): array
    {
        return [
            ['origin' => 'DFW', 'destination' => 'LAX', 'distance_mi' => 1235, 'duration_min' => 210],
            ['origin' => 'ATL', 'destination' => 'ORD', 'distance_mi' => 606, 'duration_min' => 120],
            ['origin' => 'SFO', 'destination' => 'MIA', 'distance_mi' => 2586, 'duration_min' => 330],
            ['origin' => 'SEA', 'destination' => 'PHX', 'distance_mi' => 1107, 'duration_min' => 170],
            ['origin' => 'DEN', 'destination' => 'JFK', 'distance_mi' => 1769, 'duration_min' => 240],
            ['origin' => 'SLC', 'destination' => 'SAN', 'distance_mi' => 589, 'duration_min' => 115],
        ];
    }

    /**
     * Base one-way fares in cents per class, before the per-flight price factor.
     *
     * Seat capacity comes from the layout XML, so it is not stored here.
     *
     * @return array<string, array{manufacturer: string, model: string, layout_key: string, fares: array<string, int>}>
     */
    public static function aircraftTypes(): array
    {
        return [
            '757-200' => [
                'manufacturer' => 'Boeing', 'model' => '757-200', 'layout_key' => '757-200',
                'fares' => ['BUSINESS' => 189900, 'PREMIUM' => 74900, 'ECONOMY' => 24900],
            ],
            'A220-100' => [
                'manufacturer' => 'Airbus', 'model' => 'A220-100', 'layout_key' => 'A220-100',
                'fares' => ['BUSINESS' => 109900, 'ECONOMY' => 17900],
            ],
            'A220-300' => [
                'manufacturer' => 'Airbus', 'model' => 'A220-300', 'layout_key' => 'A220-300',
                'fares' => ['BUSINESS' => 119900, 'ECONOMY' => 19900],
            ],
            'PRAETOR-500' => [
                'manufacturer' => 'Embraer', 'model' => 'Praetor 500', 'layout_key' => 'PRAETOR-500',
                'fares' => ['BUSINESS' => 349900],
            ],
        ];
    }

    /**
     * Eight aircraft: two of each type. Order here sets the aircraft IDs.
     *
     * @return list<array{id: int, tail_number: string, name: string, type_code: string}>
     */
    public static function fleet(): array
    {
        return [
            ['id' => 1, 'tail_number' => 'N201UA', 'name' => 'Spirit of Dallas', 'type_code' => '757-200'],
            ['id' => 2, 'tail_number' => 'N202UA', 'name' => 'Spirit of Chicago', 'type_code' => '757-200'],
            ['id' => 3, 'tail_number' => 'N301UA', 'name' => 'Spirit of Seattle', 'type_code' => 'A220-100'],
            ['id' => 4, 'tail_number' => 'N302UA', 'name' => 'Spirit of Denver', 'type_code' => 'A220-100'],
            ['id' => 5, 'tail_number' => 'N401UA', 'name' => 'Spirit of Miami', 'type_code' => 'A220-300'],
            ['id' => 6, 'tail_number' => 'N402UA', 'name' => 'Spirit of Atlanta', 'type_code' => 'A220-300'],
            ['id' => 7, 'tail_number' => 'N501UA', 'name' => 'Spirit of Phoenix', 'type_code' => 'PRAETOR-500'],
            ['id' => 8, 'tail_number' => 'N502UA', 'name' => 'Spirit of San Diego', 'type_code' => 'PRAETOR-500'],
        ];
    }

    /** @return list<string> */
    public static function firstNames(): array
    {
        return ['Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Avery', 'Quinn', 'Harper', 'Rowan',
            'Dana', 'Eli', 'Frankie', 'Gray', 'Hayden', 'Indira', 'Jules', 'Kai', 'Lane', 'Milo',
            'Nora', 'Owen', 'Priya', 'Reese', 'Sage', 'Tomas', 'Uma', 'Vera', 'Wren', 'Yara'];
    }

    /** @return list<string> */
    public static function lastNames(): array
    {
        return ['Almeida', 'Brooks', 'Chen', 'Dawson', 'Ellis', 'Foster', 'Garcia', 'Holloway', 'Ibarra', 'Jensen',
            'Kowalski', 'Lindqvist', 'Mercer', 'Nakamura', 'Okafor', 'Patel', 'Quintero', 'Reyes', 'Sato', 'Turner',
            'Underwood', 'Vance', 'Whitfield', 'Xu', 'Yamamoto', 'Zamora', 'Bennett', 'Carver', 'Dunn', 'Ferreira'];
    }

    /** @return list<array{code: string, name: string, min_points: int, benefits: string}> */
    public static function rewardsTiers(): array
    {
        return [
            ['code' => 'EXPLORER', 'name' => 'Explorer', 'min_points' => 0,
                'benefits' => 'Earn points on every flight. Priority phone support. Free seat selection at booking.'],
            ['code' => 'VOYAGER', 'name' => 'Voyager', 'min_points' => 15000,
                'benefits' => 'Two free checked bags. Priority boarding group 3. Extra 10 percent points on fares.'],
            ['code' => 'HORIZON', 'name' => 'Horizon', 'min_points' => 40000,
                'benefits' => 'Priority security lanes. Complimentary upgrade requests. Extra 25 percent points on fares.'],
            ['code' => 'SUMMIT', 'name' => 'Summit', 'min_points' => 75000,
                'benefits' => 'Lounge access for you and a guest. Guaranteed seat assignment. Extra 50 percent points on fares.'],
        ];
    }

    /** @return list<array{name: string, category: string, description: string, logo_key: string}> */
    public static function partners(): array
    {
        return [
            ['name' => 'Cascade Hotels', 'category' => 'Hotels', 'description' => 'Earn points on stays at participating hotels across North America.', 'logo_key' => 'cascade'],
            ['name' => 'Meridian Car Rental', 'category' => 'Car rental', 'description' => 'Collect points on weekly and weekend rentals at major airports.', 'logo_key' => 'meridian'],
            ['name' => 'Northwind Card', 'category' => 'Credit card', 'description' => 'Earn bonus points on everyday purchases with no annual fee the first year.', 'logo_key' => 'northwind'],
            ['name' => 'Harbor Dining', 'category' => 'Dining', 'description' => 'Earn points at partner restaurants and reserve tables with Urban Air members.', 'logo_key' => 'harbor'],
            ['name' => 'Summit Outdoors', 'category' => 'Retail', 'description' => 'Earn points on outdoor gear and apparel from partner shops.', 'logo_key' => 'summit'],
            ['name' => 'Lumen Vacations', 'category' => 'Vacation packages', 'description' => 'Bundle flights and stays and earn bonus points on the total package.', 'logo_key' => 'lumen'],
        ];
    }

    /**
     * Simulated issues. Probability is per eligible request.
     *
     * @return list<array{code: string, title: string, message: string, probability: float, retry_allowed: bool, endpoint_scope: string}>
     */
    public static function errorScenarios(): array
    {
        return [
            ['code' => 'search_timeout', 'title' => 'Search is taking longer than usual',
                'message' => 'Our flight search is running slowly right now. Please try again in a moment.',
                'probability' => 0.040, 'retry_allowed' => true, 'endpoint_scope' => 'search'],
            ['code' => 'fare_changed', 'title' => 'Fare updated',
                'message' => 'The fare for this flight changed while you were booking. Review the new price before you continue.',
                'probability' => 0.030, 'retry_allowed' => false, 'endpoint_scope' => 'flight_detail'],
            ['code' => 'seat_map_unavailable', 'title' => 'Seat map temporarily unavailable',
                'message' => 'We could not load the seat map. You can retry, or continue and we will assign a seat for you.',
                'probability' => 0.040, 'retry_allowed' => true, 'endpoint_scope' => 'seatmap'],
            ['code' => 'manifest_sync_delay', 'title' => 'Passenger details still syncing',
                'message' => 'Our passenger system is catching up. Your details are saved, so please check them again in a moment.',
                'probability' => 0.030, 'retry_allowed' => true, 'endpoint_scope' => 'validate_passengers'],
            ['code' => 'payment_gateway_busy', 'title' => 'Payment gateway busy',
                'message' => 'The payment service is busy. No charge was made. Please try again.',
                'probability' => 0.050, 'retry_allowed' => true, 'endpoint_scope' => 'confirm'],
            ['code' => 'maintenance_window', 'title' => 'Scheduled maintenance',
                'message' => 'Urban Air is performing scheduled maintenance. Your progress is saved. Please try again shortly.',
                'probability' => 0.010, 'retry_allowed' => false, 'endpoint_scope' => 'confirm'],
        ];
    }
}
