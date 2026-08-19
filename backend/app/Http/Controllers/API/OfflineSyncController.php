<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\OfflineSyncService;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfflineSyncController extends Controller
{
    /**
     * Replay a batch of actions that were queued while the client was
     * offline. Each action is dispatched through the real internal
     * routing/middleware/controller stack (not re-implemented here), so it
     * gets the exact same validation, authorization, and tenant scoping as
     * a normal live request. Before replaying a write whose resource type
     * carries a conflict-sensitive strategy, the current server state is
     * checked against the client's `base_updated_at` snapshot.
     */
    public function replay(Request $request, OfflineSyncService $offlineSyncService): JsonResponse
    {
        $validated = $request->validate([
            'actions' => ['required', 'array', 'min:1'],
            'actions.*.id' => ['required', 'string'],
            'actions.*.endpoint' => ['required', 'string'],
            'actions.*.method' => ['required', 'string'],
            'actions.*.resource_type' => ['nullable', 'string'],
            'actions.*.payload' => ['nullable', 'array'],
            'actions.*.base_updated_at' => ['nullable', 'string'],
            'actions.*.force' => ['nullable', 'boolean'],
        ]);

        $bearerToken = $request->bearerToken();

        $results = array_map(
            fn (array $action) => $this->replayAction($action, $bearerToken, $offlineSyncService),
            $validated['actions'],
        );

        return response()->json(['results' => $results]);
    }

    private function replayAction(array $action, ?string $bearerToken, OfflineSyncService $offlineSyncService): array
    {
        $resourceType = $action['resource_type'] ?? 'general';
        $strategy = $offlineSyncService->determineConflictStrategy($resourceType);
        $method = strtoupper($action['method']);
        $force = (bool) ($action['force'] ?? false);
        $baseUpdatedAt = $action['base_updated_at'] ?? null;

        $needsConflictCheck = ! $force
            && $strategy !== 'last_write_wins'
            && $baseUpdatedAt
            && in_array($method, ['PATCH', 'PUT'], true);

        if ($needsConflictCheck) {
            $current = $this->dispatchInternal('GET', $action['endpoint'], [], $bearerToken);
            $currentUpdatedAt = $current['body']['updated_at'] ?? null;

            if ($current['status'] < 300 && $currentUpdatedAt && strtotime($currentUpdatedAt) > strtotime($baseUpdatedAt)) {
                return [
                    'id' => $action['id'],
                    'status' => 'conflict',
                    'strategy' => $strategy,
                    'resource_type' => $resourceType,
                    'current' => $current['body'],
                ];
            }
        }

        $response = $this->dispatchInternal($method, $action['endpoint'], $action['payload'] ?? [], $bearerToken);

        if ($response['status'] >= 200 && $response['status'] < 300) {
            return [
                'id' => $action['id'],
                'status' => 'synced',
                'strategy' => $strategy,
                'response' => $response['body'],
            ];
        }

        return [
            'id' => $action['id'],
            'status' => 'failed',
            'strategy' => $strategy,
            'http_status' => $response['status'],
            'message' => $response['body']['message'] ?? 'Sync failed',
        ];
    }

    private function dispatchInternal(string $method, string $endpoint, array $payload, ?string $bearerToken): array
    {
        $uri = '/api'.(str_starts_with($endpoint, '/') ? $endpoint : '/'.$endpoint);

        $subRequest = $method === 'GET'
            ? Request::create($uri, $method, $payload)
            : Request::create($uri, $method, [], [], [], [], json_encode($payload));

        $subRequest->headers->set('Accept', 'application/json');
        $subRequest->headers->set('Content-Type', 'application/json');

        if ($bearerToken) {
            $subRequest->headers->set('Authorization', 'Bearer '.$bearerToken);
        }

        $response = app(Kernel::class)->handle($subRequest);

        return [
            'status' => $response->getStatusCode(),
            'body' => json_decode($response->getContent(), true) ?? [],
        ];
    }
}
