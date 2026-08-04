<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RegexIterator;

class BrandCopyTest extends TestCase
{
    public function test_backend_runtime_copy_avoids_legacy_taska_branding_variants(): void
    {
        $matches = [];

        foreach ($this->runtimePaths() as $path) {
            foreach ($this->collectPhpFiles($path) as $filePath) {
                $contents = file_get_contents($filePath);

                if ($contents === false) {
                    $this->fail(sprintf('Unable to read runtime file [%s].', $filePath));
                }

                if (preg_match('/\bTASKA\b|\bTASKa\b/', $contents) === 1) {
                    $matches[] = $filePath;
                }
            }
        }

        $this->assertSame([], $matches, 'Legacy TASKA/TASKa branding remains in backend runtime code.');
    }

    /**
     * @return list<string>
     */
    private function runtimePaths(): array
    {
        return [
            dirname(__DIR__, 2) . '/app',
            dirname(__DIR__, 2) . '/routes',
            dirname(__DIR__) . '/Feature',
        ];
    }

    /**
     * @return list<string>
     */
    private function collectPhpFiles(string $path): array
    {
        if (is_file($path)) {
            return [$path];
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($path)
        );

        $phpFiles = new RegexIterator($iterator, '/^.+\.php$/i');
        $files = [];

        foreach ($phpFiles as $file) {
            $files[] = $file->getPathname();
        }

        sort($files);

        return $files;
    }
}
