<?php

declare(strict_types=1);

namespace UrbanAir\Controllers;

use DateTimeImmutable;
use UrbanAir\Repositories\ReferenceRepository;
use UrbanAir\Services\LayoutRepository;
use UrbanAir\Services\ReseedService;
use UrbanAir\Support\Json;

/** Read-only reference content: airports, routes, partners, rewards, seat features, status. */
final class ReferenceController
{
    public function __construct(
        private readonly ReferenceRepository $reference,
        private readonly LayoutRepository $layouts,
        private readonly ReseedService $reseed,
    ) {
    }

    public function airports(): array
    {
        return Json::ok(['airports' => $this->reference->airports()]);
    }

    public function routes(): array
    {
        return Json::ok(['routes' => $this->reference->routes()]);
    }

    public function partners(): array
    {
        return Json::ok(['partners' => $this->reference->partners()]);
    }

    public function rewardsTiers(): array
    {
        return Json::ok(['tiers' => $this->reference->rewardsTiers()]);
    }

    public function seatFeatures(): array
    {
        return Json::ok(['features' => array_values($this->layouts->features())]);
    }

    public function status(): array
    {
        $last = $this->reseed->lastSeededAt();
        $nextReseed = $last?->modify('+' . ReseedService::MAX_AGE_SECONDS . ' seconds');

        return Json::ok([
            'service' => 'urbanair-api',
            'last_seeded_at' => $last?->format(DATE_ATOM),
            'next_reseed_at' => $nextReseed?->format(DATE_ATOM),
            'server_time' => (new DateTimeImmutable('now'))->format(DATE_ATOM),
        ]);
    }
}
