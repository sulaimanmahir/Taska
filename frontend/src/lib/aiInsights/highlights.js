import { formatInsightMetricValue } from './presentation.js';

export function extractInsightHighlights(insight) {
  const data = insight?.data || {};

  if (insight.type === 'stockout_forecast' || insight.type === 'reorder_window_forecast') {
    return (data.items || []).slice(0, 2).map((item) => ({
      label: item.name,
      value: `${item.days_of_cover ?? item.days_of_safe_cover}d cover`,
    }));
  }

  if (insight.type === 'pharmacy_demand_forecast') {
    return (data.items || []).slice(0, 2).map((item) => ({
      label: item.name,
      value: `${item.days_of_safe_cover}d safe cover`,
    }));
  }

  if (insight.type === 'debtor_followup_priority' || insight.type === 'credit_default_forecast') {
    return (data.accounts || []).slice(0, 2).map((account) => ({
      label: account.customer_name || `Customer #${account.customer_id}`,
      value: `NGN ${formatInsightMetricValue(account.balance)}`,
    }));
  }

  if (insight.type === 'hotel_occupancy_pacing') {
    return [
      { label: 'Upcoming', value: `${formatInsightMetricValue(data.upcoming_arrivals || 0)} arrivals` },
      { label: 'Forward occ.', value: `${formatInsightMetricValue(data.future_occupancy_rate || 0)}%` },
    ];
  }

  if (insight.type === 'production_cost_spike_forecast') {
    return [
      { label: 'Unit cost', value: `${formatInsightMetricValue(data.unit_cost_change_percent || 0)}%` },
      { label: 'Energy + packaging', value: `${formatInsightMetricValue(data.energy_packaging_change_percent || 0)}%` },
    ];
  }

  if (insight.type === 'delivery_cod_exposure_forecast') {
    return [
      { label: 'Outstanding COD', value: `NGN ${formatInsightMetricValue(data.outstanding_cod || 0)}` },
      { label: 'Exposure', value: `${formatInsightMetricValue(data.exposure_ratio_percent || 0)}%` },
    ];
  }

  if (insight.type === 'fuel_shrinkage_risk_score') {
    return [
      { label: 'Risk score', value: `${formatInsightMetricValue(data.risk_score || 0)}` },
      { label: 'Open alerts', value: `${formatInsightMetricValue(data.open_alerts || 0)}` },
    ];
  }

  if (insight.type === 'school_fee_default_warning') {
    return [
      { label: 'Outstanding', value: `NGN ${formatInsightMetricValue(data.outstanding_total || 0)}` },
      { label: 'Default ratio', value: `${formatInsightMetricValue(data.default_ratio_percent || 0)}%` },
    ];
  }

  if (insight.type === 'construction_margin_pressure') {
    return (data.items || []).slice(0, 2).map((item) => ({
      label: item.item_name,
      value: `${formatInsightMetricValue(item.margin_percent)}% margin`,
    }));
  }

  if (insight.type === 'agro_seasonal_stock_planning') {
    return (data.forecasts || []).slice(0, 2).map((forecast) => ({
      label: `${forecast.region_name} ${forecast.season_name}`,
      value: `${formatInsightMetricValue(forecast.coverage_percent)}% cover`,
    }));
  }

  if (insight.type === 'livestock_health_productivity_warning') {
    return [
      { label: 'Affected animals', value: `${formatInsightMetricValue(data.affected_animals || 0)}` },
      { label: 'Milk/weight', value: `${data.milk_decline || data.weight_decline ? 'declining' : 'stable'}` },
    ];
  }

  if (insight.type === 'restaurant_margin_waste_forecast') {
    return [
      { label: 'At-risk tickets', value: `${formatInsightMetricValue(data.tickets_at_risk || 0)}` },
      { label: 'Avg waste', value: `${formatInsightMetricValue(data.average_waste_ratio_percent || 0)}%` },
    ];
  }

  if (insight.type === 'wholesale_route_profitability_forecast') {
    return [
      { label: 'Weak routes', value: `${formatInsightMetricValue(data.route_runs_below_target || 0)}` },
      { label: 'Weak stops', value: `${formatInsightMetricValue(data.weak_stops || 0)}` },
    ];
  }

  return [];
}
