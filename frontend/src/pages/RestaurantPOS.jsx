import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { useBusinessType } from '../config';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import { getErrorMessage } from '../lib/apiFeedback';
const formatCurrency = formatCurrencyNGN;

const initialTicketForm = {
  branch_id: '',
  table_id: '',
  waiter_shift_id: '',
  guest_name: '',
  order_channel: 'dine_in',
  split_count: 1,
  service_charge: '',
  delivery_fee: '',
  amount_paid: '',
};

function QueryErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-500"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function RestaurantPOS() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [tableForm, setTableForm] = useState({ name: '', zone: '', seats: 4 });
  const [shiftForm, setShiftForm] = useState({ staff_name: '', started_at: new Date().toISOString().slice(0, 16) });
  const [reservationForm, setReservationForm] = useState({ table_id: '', guest_name: '', guest_phone: '', reservation_for: '', party_size: 2, occasion: '' });
  const [recipeForm, setRecipeForm] = useState({ product_id: '', ingredient_product_id: '', quantity: 1, unit_cost: '', prep_station: 'hot-kitchen' });
  const [wasteForm, setWasteForm] = useState({ product_id: '', recipe_card_id: '', quantity: 1, cost_impact: '', waste_type: 'kitchen_loss', notes: '' });
  const [ticketForm, setTicketForm] = useState(initialTicketForm);
  const [selectedItems, setSelectedItems] = useState([]);
  const ticketDeskRef = useRef(null);

  const overviewQuery = useQuery({
    queryKey: ['restaurant-overview'],
    queryFn: () => api.get('/restaurant/overview').then((response) => response.data),
  });

  const tablesQuery = useQuery({
    queryKey: ['restaurant-tables'],
    queryFn: () => api.get('/restaurant/tables').then((response) => response.data),
  });

  const shiftsQuery = useQuery({
    queryKey: ['restaurant-shifts'],
    queryFn: () => api.get('/restaurant/shifts').then((response) => response.data),
  });

  const reservationsQuery = useQuery({
    queryKey: ['restaurant-reservations'],
    queryFn: () => api.get('/restaurant/reservations').then((response) => response.data),
  });

  const recipesQuery = useQuery({
    queryKey: ['restaurant-recipes'],
    queryFn: () => api.get('/restaurant/recipes').then((response) => response.data),
  });

  const ticketsQuery = useQuery({
    queryKey: ['restaurant-tickets'],
    queryFn: () => api.get('/restaurant/tickets').then((response) => response.data),
  });

  const kitchenBoardQuery = useQuery({
    queryKey: ['restaurant-kitchen-board'],
    queryFn: () => api.get('/restaurant/kitchen-board').then((response) => response.data),
  });

  const wasteLogsQuery = useQuery({
    queryKey: ['restaurant-waste-logs'],
    queryFn: () => api.get('/restaurant/waste-logs').then((response) => response.data),
  });

  const productsQuery = useQuery({
    queryKey: ['restaurant-products'],
    queryFn: () => api.get('/products').then((response) => response.data.data || response.data || []),
  });

  const overview = overviewQuery.data;
  const tables = tablesQuery.data || [];
  const shifts = shiftsQuery.data || [];
  const reservations = reservationsQuery.data || [];
  const recipes = recipesQuery.data || [];
  const tickets = ticketsQuery.data || [];
  const kitchenBoard = kitchenBoardQuery.data || [];
  const wasteLogs = wasteLogsQuery.data || [];
  const products = productsQuery.data || [];
  const restaurantQueries = [
    overviewQuery,
    tablesQuery,
    shiftsQuery,
    reservationsQuery,
    recipesQuery,
    ticketsQuery,
    kitchenBoardQuery,
    wasteLogsQuery,
    productsQuery,
  ];
  const loadError = getErrorMessage(
    restaurantQueries.find((query) => query.isError)?.error,
    'We could not load part of restaurant operations right now. Please try again.',
  );

  const refreshRestaurant = () => {
    [
      'restaurant-overview',
      'restaurant-tables',
      'restaurant-shifts',
      'restaurant-reservations',
      'restaurant-recipes',
      'restaurant-tickets',
      'restaurant-kitchen-board',
      'restaurant-waste-logs',
    ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const createTable = useMutation({
    mutationFn: (payload) => api.post('/restaurant/tables', payload).then((response) => response.data),
    onSuccess: () => {
      setTableForm({ name: '', zone: '', seats: 4 });
      refreshRestaurant();
    },
  });

  const createShift = useMutation({
    mutationFn: (payload) => api.post('/restaurant/shifts', payload).then((response) => response.data),
    onSuccess: () => {
      setShiftForm({ staff_name: '', started_at: new Date().toISOString().slice(0, 16) });
      refreshRestaurant();
    },
  });

  const createReservation = useMutation({
    mutationFn: (payload) => api.post('/restaurant/reservations', payload).then((response) => response.data),
    onSuccess: () => {
      setReservationForm({ table_id: '', guest_name: '', guest_phone: '', reservation_for: '', party_size: 2, occasion: '' });
      refreshRestaurant();
    },
  });

  const createRecipe = useMutation({
    mutationFn: (payload) => api.post('/restaurant/recipes', payload).then((response) => response.data),
    onSuccess: () => {
      setRecipeForm({ product_id: '', ingredient_product_id: '', quantity: 1, unit_cost: '', prep_station: 'hot-kitchen' });
      refreshRestaurant();
    },
  });

  const createTicket = useMutation({
    mutationFn: (payload) => api.post('/restaurant/tickets', payload).then((response) => response.data),
    onSuccess: () => {
      setTicketForm(initialTicketForm);
      setSelectedItems([]);
      refreshRestaurant();
    },
  });

  const updateKitchen = useMutation({
    mutationFn: ({ ticketId, payload }) => api.post(`/restaurant/tickets/${ticketId}/kitchen-status`, payload).then((response) => response.data),
    onSuccess: refreshRestaurant,
  });

  const closeTicket = useMutation({
    mutationFn: ({ ticketId, payload }) => api.post(`/restaurant/tickets/${ticketId}/close`, payload).then((response) => response.data),
    onSuccess: refreshRestaurant,
  });

  const createWasteLog = useMutation({
    mutationFn: (payload) => api.post('/restaurant/waste-logs', payload).then((response) => response.data),
    onSuccess: () => {
      setWasteForm({ product_id: '', recipe_card_id: '', quantity: 1, cost_impact: '', waste_type: 'kitchen_loss', notes: '' });
      refreshRestaurant();
    },
  });

  const menuProducts = useMemo(() => products.filter((product) => Number(product.selling_price || 0) > 0), [products]);
  const ingredientProducts = useMemo(() => products.filter((product) => Number(product.cost_price || 0) > 0), [products]);

  const addTicketItem = (product) => {
    setSelectedItems((current) => {
      const existing = current.find((item) => item.product_id === product.id);

      if (existing) {
        return current.map((item) => item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }

      return [
        ...current,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: Number(product.selling_price || 0),
        },
      ];
    });
  };

  const updateItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setSelectedItems((current) => current.filter((item) => item.product_id !== productId));
      return;
    }

    setSelectedItems((current) => current.map((item) => item.product_id === productId ? { ...item, quantity } : item));
  };

  const ticketSubtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + (Number(item.unit_price) * Number(item.quantity)), 0),
    [selectedItems],
  );

  useEffect(() => {
    if (searchParams.get('section') === 'tickets' && ticketDeskRef.current) {
      ticketDeskRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  return (
    <div className="space-y-5">
      {restaurantQueries.some((query) => query.isError) ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            restaurantQueries.forEach((query) => query.refetch());
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Restaurant Operations"
        title={`${labels.pos || 'Restaurant'} command centre`}
        description="Run dine-in, takeaway, and delivery from one place with table control, waiter shifts, kitchen firing, reservations, recipe costing, and food-waste visibility."
      />

      <ResponsiveCardGrid variant="metrics">
        {[
          ['Revenue Today', formatCurrency(overview?.summary?.revenue_today || 0), 'emerald'],
          ['Open Tickets', overview?.summary?.open_tickets || 0, 'violet'],
          ['Kitchen Queue', overview?.summary?.pending_kitchen_tickets || 0, 'amber'],
          ['Waste Cost', formatCurrency(overview?.summary?.waste_cost_today || 0), 'rose'],
        ].map(([label, value, tone]) => (
          <OpsMetricCard key={label} label={label} value={value} tone={tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div ref={ticketDeskRef} className="xl:col-span-2">
        <Card>
          <CardHeader title="New Restaurant Ticket" subtitle="Build dine-in, takeaway, or delivery orders and send them to the kitchen" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={ticketForm.table_id} onChange={(event) => setTicketForm({ ...ticketForm, table_id: event.target.value })}>
                  <option value="">Select table</option>
                  {tables.map((table) => <option key={table.id} value={table.id}>{table.name} | {table.status}</option>)}
                </select>
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={ticketForm.waiter_shift_id} onChange={(event) => setTicketForm({ ...ticketForm, waiter_shift_id: event.target.value })}>
                  <option value="">Assign waiter shift</option>
                  {shifts.filter((shift) => shift.status === 'open').map((shift) => <option key={shift.id} value={shift.id}>{shift.staff_name}</option>)}
                </select>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Guest name" value={ticketForm.guest_name} onChange={(event) => setTicketForm({ ...ticketForm, guest_name: event.target.value })} />
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={ticketForm.order_channel} onChange={(event) => setTicketForm({ ...ticketForm, order_channel: event.target.value })}>
                  <option value="dine_in">Dine-in</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="1" placeholder="Split bills" value={ticketForm.split_count} onChange={(event) => setTicketForm({ ...ticketForm, split_count: event.target.value })} />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="0" placeholder="Service charge" value={ticketForm.service_charge} onChange={(event) => setTicketForm({ ...ticketForm, service_charge: event.target.value })} />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="0" placeholder="Delivery fee" value={ticketForm.delivery_fee} onChange={(event) => setTicketForm({ ...ticketForm, delivery_fee: event.target.value })} />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="0" placeholder="Amount paid" value={ticketForm.amount_paid} onChange={(event) => setTicketForm({ ...ticketForm, amount_paid: event.target.value })} />
              </div>

              {ticketForm.order_channel === 'delivery' ? (
                <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Delivery address" value={ticketForm.delivery_address || ''} onChange={(event) => setTicketForm({ ...ticketForm, delivery_address: event.target.value })} />
              ) : null}

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {menuProducts.slice(0, 9).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addTicketItem(product)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white hover:shadow-md"
                  >
                    <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                    <p className="mt-2 text-sm text-violet-700">{formatCurrency(product.selling_price)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Current Ticket</p>
                  <p className="mt-1 text-2xl font-semibold">{formatCurrency(ticketSubtotal)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/80">{selectedItems.length} items</div>
              </div>

              <div className="mt-4 space-y-3">
                {selectedItems.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-white/65">Tap menu items to build a ticket.</p>
                ) : selectedItems.map((item) => (
                  <div key={item.product_id} className="rounded-2xl bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm">{formatCurrency(item.unit_price * item.quantity)}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <button type="button" className="h-8 w-8 rounded-xl bg-white/10" onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" className="h-8 w-8 rounded-xl bg-white/10" onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white shadow-lg shadow-slate-900/10"
                onClick={() => createTicket.mutate({
                  ...ticketForm,
                  split_count: Number(ticketForm.split_count || 1),
                  service_charge: Number(ticketForm.service_charge || 0),
                  delivery_fee: Number(ticketForm.delivery_fee || 0),
                  amount_paid: Number(ticketForm.amount_paid || 0),
                  table_id: ticketForm.table_id || null,
                  waiter_shift_id: ticketForm.waiter_shift_id || null,
                  items: selectedItems,
                })}
                disabled={selectedItems.length === 0 || createTicket.isPending}
              >
                {createTicket.isPending ? 'Saving kitchen ticket...' : 'Save kitchen ticket'}
              </button>
            </div>
          </div>
        </Card>
        </div>

        <Card>
          <CardHeader title="Floor Snapshot" subtitle="Tables, reservations, and live pressure points" />
          <div className="space-y-3">
            <ResponsiveCardGrid variant="default">
              <OpsMetricCard label="Active Tables" value={overview?.summary?.active_tables || 0} tone="violet" />
              <OpsMetricCard label="Upcoming Reservations" value={overview?.summary?.upcoming_reservations || 0} tone="amber" />
              <OpsMetricCard label="Gross Margin Today" value={formatCurrency(overview?.summary?.gross_margin_today || 0)} tone="emerald" />
            </ResponsiveCardGrid>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Channel mix today</p>
              <div className="mt-3 flex items-center justify-between"><span>Takeaway</span><span>{overview?.summary?.takeaway_today || 0}</span></div>
              <div className="mt-2 flex items-center justify-between"><span>Delivery</span><span>{overview?.summary?.delivery_today || 0}</span></div>
              <div className="mt-2 flex items-center justify-between"><span>Open waiter shifts</span><span>{overview?.summary?.open_waiter_shifts || 0}</span></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <Card>
          <CardHeader title="Table Setup" subtitle="Keep dine-in layout current" />
          <div className="space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Table name" value={tableForm.name} onChange={(event) => setTableForm({ ...tableForm, name: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Zone" value={tableForm.zone} onChange={(event) => setTableForm({ ...tableForm, zone: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="1" placeholder="Seats" value={tableForm.seats} onChange={(event) => setTableForm({ ...tableForm, seats: event.target.value })} />
            <button type="button" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white" onClick={() => createTable.mutate({ ...tableForm, seats: Number(tableForm.seats || 1) })}>
              Save table
            </button>
            <div className="space-y-2 text-sm text-slate-600">
              {tables.slice(0, 5).map((table) => <div key={table.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"><span>{table.name}</span><span>{table.status}</span></div>)}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Waiter Shifts" subtitle="Track floor ownership and cashier accountability" />
          <div className="space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Staff name" value={shiftForm.staff_name} onChange={(event) => setShiftForm({ ...shiftForm, staff_name: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="datetime-local" value={shiftForm.started_at} onChange={(event) => setShiftForm({ ...shiftForm, started_at: event.target.value })} />
            <button type="button" className="w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white" onClick={() => createShift.mutate(shiftForm)}>
              Save waiter shift
            </button>
            <div className="space-y-2 text-sm text-slate-600">
              {shifts.slice(0, 4).map((shift) => <div key={shift.id} className="rounded-2xl bg-slate-50 px-3 py-3"><p className="font-medium text-slate-800">{shift.staff_name}</p><p className="mt-1 text-xs">Orders handled: {shift.orders_handled} | {shift.status}</p></div>)}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Reservations" subtitle="Protect busy periods and special events" />
          <div className="space-y-3">
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={reservationForm.table_id} onChange={(event) => setReservationForm({ ...reservationForm, table_id: event.target.value })}>
              <option value="">Reserve any table</option>
              {tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
            </select>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Guest name" value={reservationForm.guest_name} onChange={(event) => setReservationForm({ ...reservationForm, guest_name: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone" value={reservationForm.guest_phone} onChange={(event) => setReservationForm({ ...reservationForm, guest_phone: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="datetime-local" value={reservationForm.reservation_for} onChange={(event) => setReservationForm({ ...reservationForm, reservation_for: event.target.value })} />
            <button type="button" className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white" onClick={() => createReservation.mutate({ ...reservationForm, table_id: reservationForm.table_id || null, party_size: Number(reservationForm.party_size || 2) })}>
              Save reservation
            </button>
            <div className="space-y-2 text-sm text-slate-600">
              {reservations.slice(0, 4).map((reservation) => <div key={reservation.id} className="rounded-2xl bg-slate-50 px-3 py-3"><p className="font-medium text-slate-800">{reservation.guest_name}</p><p className="mt-1 text-xs">{reservation.table?.name || 'Unassigned table'} | {reservation.status}</p></div>)}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recipe Costing" subtitle="Expose margin before the kitchen burns it" />
          <div className="space-y-3">
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={recipeForm.product_id} onChange={(event) => setRecipeForm({ ...recipeForm, product_id: event.target.value })}>
              <option value="">Menu item</option>
              {menuProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={recipeForm.ingredient_product_id} onChange={(event) => setRecipeForm({ ...recipeForm, ingredient_product_id: event.target.value })}>
              <option value="">Ingredient</option>
              {ingredientProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="0.001" step="0.001" placeholder="Ingredient quantity" value={recipeForm.quantity} onChange={(event) => setRecipeForm({ ...recipeForm, quantity: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="0" placeholder="Unit cost" value={recipeForm.unit_cost} onChange={(event) => setRecipeForm({ ...recipeForm, unit_cost: event.target.value })} />
            <button type="button" className="w-full rounded-2xl bg-fuchsia-600 px-4 py-3 font-semibold text-white" onClick={() => createRecipe.mutate({
              product_id: recipeForm.product_id,
              yield_quantity: 1,
              prep_station: recipeForm.prep_station,
              ingredients: [
                {
                  ingredient_product_id: recipeForm.ingredient_product_id,
                  quantity: Number(recipeForm.quantity || 1),
                  unit_cost: Number(recipeForm.unit_cost || 0),
                },
              ],
            })}>
              Save recipe card
            </button>
            <div className="space-y-2 text-sm text-slate-600">
              {recipes.slice(0, 4).map((recipe) => <div key={recipe.id} className="rounded-2xl bg-slate-50 px-3 py-3"><p className="font-medium text-slate-800">{recipe.product?.name}</p><p className="mt-1 text-xs">Estimated cost: {formatCurrency(recipe.estimated_cost)}</p></div>)}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Kitchen Display Board" subtitle="Fire, ready, serve, and close without losing floor context" />
          <div className="space-y-3">
            {kitchenBoard.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Kitchen queue is clear right now.</p>
            ) : kitchenBoard.slice(0, 8).map((kitchen) => (
              <div key={kitchen.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{kitchen.ticket?.ticket_number}</p>
                    <p className="mt-1 text-xs text-slate-500">{kitchen.ticket?.guest_name || 'Walk-in guest'} | {kitchen.ticket?.order_channel} | {kitchen.ticket?.table?.name || 'No table'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800" onClick={() => updateKitchen.mutate({ ticketId: kitchen.ticket.id, payload: { status: 'preparing' } })}>Preparing</button>
                    <button type="button" className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800" onClick={() => updateKitchen.mutate({ ticketId: kitchen.ticket.id, payload: { status: 'ready' } })}>Ready</button>
                    <button type="button" className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800" onClick={() => updateKitchen.mutate({ ticketId: kitchen.ticket.id, payload: { status: 'served' } })}>Served</button>
                    <button type="button" className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800" onClick={() => closeTicket.mutate({ ticketId: kitchen.ticket.id, payload: { amount_paid: kitchen.ticket.total, waste_cost_total: kitchen.ticket.waste_cost_total || 0 } })}>Close</button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  {(kitchen.ticket?.items || []).map((item) => <span key={item.id} className="rounded-full bg-slate-100 px-3 py-1">{item.product?.name} x {item.quantity}</span>)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Food Waste Log" subtitle="Catch the quiet margin leaks" />
          <div className="space-y-3">
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={wasteForm.product_id} onChange={(event) => setWasteForm({ ...wasteForm, product_id: event.target.value })}>
              <option value="">Affected item</option>
              {menuProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={wasteForm.recipe_card_id} onChange={(event) => setWasteForm({ ...wasteForm, recipe_card_id: event.target.value })}>
              <option value="">Recipe card</option>
              {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.product?.name}</option>)}
            </select>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="0.001" step="0.001" placeholder="Quantity lost" value={wasteForm.quantity} onChange={(event) => setWasteForm({ ...wasteForm, quantity: event.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="0" placeholder="Cost impact" value={wasteForm.cost_impact} onChange={(event) => setWasteForm({ ...wasteForm, cost_impact: event.target.value })} />
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={wasteForm.waste_type} onChange={(event) => setWasteForm({ ...wasteForm, waste_type: event.target.value })}>
              <option value="kitchen_loss">Kitchen loss</option>
              <option value="plate_return">Plate return</option>
              <option value="spoiled_stock">Spoiled stock</option>
              <option value="burnt_food">Burnt food</option>
              <option value="delivery_return">Delivery return</option>
            </select>
            <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="What happened?" value={wasteForm.notes} onChange={(event) => setWasteForm({ ...wasteForm, notes: event.target.value })} />
            <button type="button" className="w-full rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white" onClick={() => createWasteLog.mutate({
              ...wasteForm,
              product_id: wasteForm.product_id || null,
              recipe_card_id: wasteForm.recipe_card_id || null,
              quantity: Number(wasteForm.quantity || 0),
              cost_impact: Number(wasteForm.cost_impact || 0),
            })}>
              Log food waste
            </button>

            <div className="space-y-2 text-sm text-slate-600">
              {wasteLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="font-medium text-slate-800">{log.product?.name || log.recipe_card?.product?.name || 'Waste item'}</p>
                  <p className="mt-1 text-xs">{log.waste_type} | {formatCurrency(log.cost_impact)}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Recent Tickets" subtitle="Split bills, channel mix, and payment closure" />
          <div className="space-y-3">
            {tickets.slice(0, 6).map((ticket) => (
              <div key={ticket.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{ticket.ticket_number}</p>
                    <p className="mt-1 text-xs text-slate-500">{ticket.order_channel} | split {ticket.split_count} | {ticket.service_status}</p>
                  </div>
                  <p className="font-semibold text-slate-900">{formatCurrency(ticket.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Profit Pressure" subtitle="What silently kills restaurant profit" />
          <div className="space-y-3 text-sm text-slate-600">
            <ResponsiveCardGrid variant="default">
              <OpsMetricCard label="Silent margin killers" value="Margin leaks" helper="Recipe drift, free extras, kitchen waste, undercharged split bills, and delayed ticket closure." tone="rose" />
              <OpsMetricCard label="Daily decisions" value="Watch the queue" helper="Watch table turn time, kitchen queue pressure, waiter shift accountability, and waste before close of business." tone="amber" />
            </ResponsiveCardGrid>
          </div>
        </Card>
      </div>
    </div>
  );
}
