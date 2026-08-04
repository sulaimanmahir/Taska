<?php

namespace App\Services;

use Carbon\CarbonImmutable;

class OfflineSyncService
{
    public function stampRecordMetadata(array $payload, array $deviceContext = []): array
    {
        return array_merge($payload, [
            'created_offline' => (bool) ($deviceContext['created_offline'] ?? false),
            'device_id' => $deviceContext['device_id'] ?? null,
            'local_timestamp' => $deviceContext['local_timestamp'] ?? CarbonImmutable::now()->toDateTimeString(),
            'synced_at' => $deviceContext['created_offline'] ?? false ? null : CarbonImmutable::now()->toDateTimeString(),
        ]);
    }

    public function resolveConflict(string $resourceType, array $localPayload, array $remotePayload): array
    {
        $strategy = $this->determineConflictStrategy($resourceType);

        if ($strategy === 'manual_review') {
            return [
                'strategy' => $strategy,
                'winner' => 'manual_review',
                'payload' => null,
            ];
        }

        if ($strategy === 'review_queue') {
            return [
                'strategy' => $strategy,
                'winner' => 'review_queue',
                'payload' => null,
            ];
        }

        $localTime = strtotime((string) ($localPayload['local_timestamp'] ?? $localPayload['updated_at'] ?? now()));
        $remoteTime = strtotime((string) ($remotePayload['local_timestamp'] ?? $remotePayload['updated_at'] ?? now()));
        $winner = $localTime >= $remoteTime ? 'local' : 'remote';

        return [
            'strategy' => $strategy,
            'winner' => $winner,
            'payload' => $winner === 'local' ? $localPayload : $remotePayload,
        ];
    }

    public function determineConflictStrategy(string $resourceType): string
    {
        return match ($resourceType) {
            'inventory', 'stock_transfer', 'stock_count' => 'review_queue',
            'finance', 'cashbook', 'settlement' => 'manual_review',
            default => 'last_write_wins',
        };
    }

    public function summarizeSyncResult(int $synced, int $failed, int $conflicts): array
    {
        return [
            'synced' => $synced,
            'failed' => $failed,
            'conflicts' => $conflicts,
            'status' => $failed > 0 ? 'sync_failed' : ($conflicts > 0 ? 'review_required' : 'synced'),
            'synced_at' => CarbonImmutable::now()->toDateTimeString(),
        ];
    }
}
