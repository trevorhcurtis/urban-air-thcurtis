<?php

declare(strict_types=1);

namespace UrbanAir\Support;

/**
 * Builds the standard response envelope described in the implementation plan (section 4.4).
 */
final class Json
{
    public static function envelope(
        bool $ok,
        mixed $data = null,
        array $errors = [],
        array $meta = [],
        ?array $simulatedIssue = null,
    ): array {
        return [
            'ok' => $ok,
            'data' => $data,
            'errors' => $errors,
            'meta' => array_merge(['request_id' => RequestContext::id()], $meta),
            'simulated_issue' => $simulatedIssue,
        ];
    }

    /** Emit a JSON response and end the request. */
    public static function send(int $status, array $body): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        echo json_encode($body, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
    }

    public static function ok(mixed $data = null, array $meta = [], ?array $simulatedIssue = null): array
    {
        return self::envelope(true, $data, [], $meta, $simulatedIssue);
    }

    public static function error(string $code, string $message): array
    {
        return self::envelope(false, null, [['code' => $code, 'message' => $message]]);
    }
}
