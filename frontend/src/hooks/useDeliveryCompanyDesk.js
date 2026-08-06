import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import {
  buildDeliveryManifestPayload,
  buildManifestCandidateCards,
  buildComplaintQueueCards,
  buildDeliveryOverviewMetrics,
  buildInvestorPayoutCards,
  buildDeliveryRequestPayload,
  buildRiderScorecardCards,
  buildRouteEfficiencyCards,
  buildDeliveryVehiclePayload,
  buildWalletActivityCards,
  createDeliveryActionState,
  createDeliveryManifestForm,
  createDeliveryRequestForm,
  createDeliveryVehicleForm,
} from '../lib/deliveries';
import { useOfflineStore } from '../stores/offlineStore';
import { formatCurrencyNGN } from '../lib/financeFormatters';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

export function useDeliveryCompanyDesk() {
  const { color = '#7C3AED' } = useBusinessType();
  const accentColor = color || '#7C3AED';
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const queueAction = useOfflineStore((state) => state.queueAction);
  const isOnline = useOfflineStore((state) => state.isOnline);
  const [deliveryForm, setDeliveryForm] = useState(createDeliveryRequestForm);
  const [vehicleForm, setVehicleForm] = useState(createDeliveryVehicleForm);
  const [manifestForm, setManifestForm] = useState(createDeliveryManifestForm);
  const [actionForms, setActionForms] = useState({});
  const [selectedManifestOrders, setSelectedManifestOrders] = useState([]);
  const dispatchDeskRef = useRef(null);

  const overviewQuery = useQuery({
    queryKey: ['deliveries-overview'],
    queryFn: () => api.get('/deliveries/overview').then((response) => response.data),
  });

  const deliveriesQuery = useQuery({
    queryKey: ['deliveries-list'],
    queryFn: () => api.get('/deliveries').then((response) => response.data.data ?? []),
  });

  const vehiclesQuery = useQuery({
    queryKey: ['delivery-vehicles'],
    queryFn: () => api.get('/delivery-vehicles').then((response) => response.data ?? []),
  });

  const operationsQuery = useQuery({
    queryKey: ['deliveries-operations'],
    queryFn: () => api.get('/deliveries/operations').then((response) => response.data),
  });

  const overview = overviewQuery.data;
  const deliveries = deliveriesQuery.data;
  const vehicles = vehiclesQuery.data;
  const operations = operationsQuery.data;
  const deliveryQueries = [overviewQuery, deliveriesQuery, vehiclesQuery, operationsQuery];
  const deliveryError = deliveryQueries.find((query) => query.isError)?.error;

  const refreshCourierQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['deliveries-overview'] });
    queryClient.invalidateQueries({ queryKey: ['deliveries-list'] });
    queryClient.invalidateQueries({ queryKey: ['delivery-vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['deliveries-operations'] });
  };

  const enqueueOrPost = async ({ endpoint, payload, method = 'POST', resourceType = 'delivery' }) => {
    if (!isOnline) {
      queueAction({
        endpoint,
        method,
        resourceType,
        payload,
      });

      return { queued: true };
    }

    const response = await api.request({
      url: endpoint,
      method,
      data: payload,
    });

      return response.data;
  };

  const handleRetry = () => {
    deliveryQueries.forEach((query) => {
      void query.refetch();
    });
  };

  const createDelivery = useMutation({
    mutationFn: (payload) => enqueueOrPost({
      endpoint: '/deliveries',
      payload,
      resourceType: 'delivery',
    }),
    onSuccess: () => {
      refreshCourierQueries();
      setDeliveryForm(createDeliveryRequestForm());
    },
  });

  const createVehicle = useMutation({
    mutationFn: (payload) => enqueueOrPost({
      endpoint: '/delivery-vehicles',
      payload,
      resourceType: 'fleet',
    }),
    onSuccess: () => {
      refreshCourierQueries();
      setVehicleForm(createDeliveryVehicleForm());
    },
  });

  const deliveryAction = useMutation({
    mutationFn: ({ endpoint, payload }) => enqueueOrPost({
      endpoint,
      payload,
      resourceType: 'delivery',
    }),
    onSuccess: () => {
      refreshCourierQueries();
    },
  });

  const createManifest = useMutation({
    mutationFn: (payload) => enqueueOrPost({
      endpoint: '/deliveries/manifests',
      payload,
      resourceType: 'delivery',
    }),
    onSuccess: () => {
      refreshCourierQueries();
      setManifestForm(createDeliveryManifestForm());
      setSelectedManifestOrders([]);
    },
  });

  const summary = overview?.summary ?? {};
  const riderScorecards = overview?.rider_scorecards ?? EMPTY_ARRAY;
  const investorPayouts = overview?.investor_payouts ?? EMPTY_ARRAY;
  const manifests = operations?.manifests ?? EMPTY_ARRAY;
  const disputes = operations?.disputes ?? EMPTY_ARRAY;
  const complaints = operations?.complaints ?? EMPTY_ARRAY;
  const remittanceHistory = operations?.remittance_history ?? EMPTY_ARRAY;
  const walletActivity = operations?.wallet_activity ?? EMPTY_ARRAY;
  const manifestCandidates = operations?.manifest_candidates ?? EMPTY_ARRAY;
  const routeEfficiency = overview?.route_efficiency ?? EMPTY_OBJECT;
  const walletBalances = overview?.wallet_balances ?? EMPTY_ARRAY;

  useEffect(() => {
    if (searchParams.get('section') === 'dispatch' && dispatchDeskRef.current) {
      dispatchDeskRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  const activeFleet = useMemo(
    () => (vehicles ?? []).filter((vehicle) => vehicle.is_active).length,
    [vehicles]
  );
  const overviewMetrics = buildDeliveryOverviewMetrics(summary, {
    activeFleet,
    routeEfficiency,
    walletBalances,
  }, formatCurrencyNGN);
  const riderCards = useMemo(
    () => buildRiderScorecardCards(riderScorecards, formatCurrencyNGN),
    [riderScorecards]
  );
  const investorCards = useMemo(
    () => buildInvestorPayoutCards(investorPayouts, formatCurrencyNGN),
    [investorPayouts]
  );
  const walletCards = useMemo(
    () => buildWalletActivityCards(walletActivity, formatCurrencyNGN),
    [walletActivity]
  );
  const complaintCards = useMemo(
    () => buildComplaintQueueCards(complaints),
    [complaints]
  );
  const routeEfficiencyCards = useMemo(
    () => buildRouteEfficiencyCards(routeEfficiency),
    [routeEfficiency]
  );
  const manifestCandidateCards = useMemo(
    () => buildManifestCandidateCards(manifestCandidates, selectedManifestOrders),
    [manifestCandidates, selectedManifestOrders]
  );

  const getActionState = (deliveryId) => actionForms[deliveryId] ?? createDeliveryActionState();

  const updateActionState = (deliveryId, patch) => {
    setActionForms((current) => ({
      ...current,
      [deliveryId]: {
        ...(current[deliveryId] ?? createDeliveryActionState()),
        ...patch,
      },
    }));
  };

  const handleDeliverySubmit = (event) => {
    event.preventDefault();

    createDelivery.mutate(buildDeliveryRequestPayload(deliveryForm, isOnline));
  };

  const handleVehicleSubmit = (event) => {
    event.preventDefault();

    createVehicle.mutate(buildDeliveryVehiclePayload(vehicleForm));
  };

  const submitAction = (delivery, endpoint, payload = {}) => {
    deliveryAction.mutate({
      endpoint,
      payload: {
        ...payload,
        offline: {
          created_offline: !isOnline,
        },
      },
    });
  };

  const toggleManifestOrder = (orderId) => {
    setSelectedManifestOrders((current) => (
      current.includes(orderId)
        ? current.filter((item) => item !== orderId)
        : [...current, orderId]
    ));
  };

  const handleManifestSubmit = (event) => {
    event.preventDefault();

    if (selectedManifestOrders.length === 0) {
      return;
    }

    createManifest.mutate(buildDeliveryManifestPayload(manifestForm, selectedManifestOrders));
  };

  return {
    accentColor,
    isOnline,
    summary,
    activeFleet,
    deliveryForm,
    setDeliveryForm,
    vehicleForm,
    setVehicleForm,
    manifestForm,
    setManifestForm,
    dispatchDeskRef,
    overviewQuery,
    deliveriesQuery,
    vehiclesQuery,
    operationsQuery,
    deliveries,
    vehicles,
    deliveryQueries,
    deliveryError,
    handleRetry,
    createDelivery,
    createVehicle,
    deliveryAction,
    createManifest,
    manifests,
    disputes,
    remittanceHistory,
    manifestCandidates,
    selectedManifestOrders,
    overviewMetrics,
    riderCards,
    investorCards,
    walletCards,
    complaintCards,
    routeEfficiencyCards,
    manifestCandidateCards,
    getActionState,
    updateActionState,
    handleDeliverySubmit,
    handleVehicleSubmit,
    submitAction,
    toggleManifestOrder,
    handleManifestSubmit,
  };
}
