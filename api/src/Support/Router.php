<?php

declare(strict_types=1);

namespace UrbanAir\Support;

/**
 * Minimal router. Patterns use {name} placeholders, e.g. /api/v1/flights/{id}.
 * Handlers receive an associative array of route params and return an envelope array.
 */
final class Router
{
    /** @var list<array{method: string, regex: string, names: list<string>, handler: callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        preg_match_all('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', $pattern, $matches);
        $regex = preg_replace('/\{[a-zA-Z_][a-zA-Z0-9_]*\}/', '([^/]+)', $pattern);

        $this->routes[] = [
            'method' => strtoupper($method),
            'regex' => '#^' . $regex . '$#',
            'names' => $matches[1],
            'handler' => $handler,
        ];
    }

    /**
     * Handlers return an envelope array (HTTP 200) or a Response for other statuses.
     *
     * @return array{status: int, body: array}
     */
    public function dispatch(string $method, string $path): array
    {
        $pathMatched = false;

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }
            $pathMatched = true;
            if ($route['method'] !== strtoupper($method)) {
                continue;
            }

            array_shift($matches);
            $params = array_combine($route['names'], array_map('rawurldecode', $matches)) ?: [];

            $result = ($route['handler'])($params);
            if ($result instanceof Response) {
                return ['status' => $result->status, 'body' => $result->body];
            }
            return ['status' => 200, 'body' => $result];
        }

        if ($pathMatched) {
            return ['status' => 405, 'body' => Json::error('method_not_allowed', 'Method not allowed.')];
        }

        return ['status' => 404, 'body' => Json::error('not_found', 'No such endpoint.')];
    }
}
