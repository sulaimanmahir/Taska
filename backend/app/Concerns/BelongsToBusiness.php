<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Auto-scopes queries on the model to the authenticated user's current
 * business. This is a safety net on top of the manual `where('business_id', ...)`
 * filtering already applied in controllers/services - it does not replace that
 * filtering, since it only constrains reads (not writes), and it deliberately
 * no-ops when there is no authenticated sanctum user (console commands,
 * seeders, unit tests operating outside an HTTP request) so it never masks a
 * missing filter in code paths that manage business_id explicitly.
 *
 * Route-model-binding is deliberately excluded from the scope (see
 * resolveRouteBinding() below): several routes rely on the model being
 * resolved first and a Policy then returning 403 for cross-tenant access
 * (e.g. PATCH /products/{product}). Scoping the binding query would turn
 * that into a 404 before the Policy ever runs, silently changing an
 * already-tested API contract. The scope still applies to every other
 * query - list/index endpoints, relation loads, ad-hoc lookups - which is
 * where the actual gap this trait closes lives.
 */
trait BelongsToBusiness
{
    protected static function bootBelongsToBusiness(): void
    {
        static::addGlobalScope('business', function (Builder $builder) {
            $user = auth('sanctum')->user();

            if ($user && $user->current_business_id) {
                $builder->where($builder->getModel()->getTable() . '.business_id', $user->current_business_id);
            }
        });
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->resolveRouteBindingQuery(
            static::query()->withoutGlobalScope('business'),
            $value,
            $field
        )->first();
    }
}
