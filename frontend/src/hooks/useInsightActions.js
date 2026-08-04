import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  buildInsightBatchSuccessMessage,
  INSIGHT_ERROR_MESSAGES,
  INSIGHT_SUCCESS_MESSAGES,
} from '../lib/insightActionGuidance';
import { useToast } from './useToast';

export function useInsightActions() {
  const queryClient = useQueryClient();
  const { toast, setToast } = useToast();

  const invalidateInsightQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const restoreMutation = useMutation({
    mutationFn: (id) => api.post(`/ai/insights/${id}/restore`),
    onSuccess: () => {
      invalidateInsightQueries();
      setToast({
        tone: 'success',
        message: INSIGHT_SUCCESS_MESSAGES.restore,
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, INSIGHT_ERROR_MESSAGES.restore),
      });
    },
  });

  const restoreGroupMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map((id) => api.post(`/ai/insights/${id}/restore`))),
    onSuccess: (_, ids) => {
      invalidateInsightQueries();
      setToast({
        tone: 'success',
        message: buildInsightBatchSuccessMessage('restore', ids.length),
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, INSIGHT_ERROR_MESSAGES.groupRestore),
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.post(`/ai/insights/${id}/read`),
    onSuccess: () => {
      invalidateInsightQueries();
      setToast({
        tone: 'success',
        message: INSIGHT_SUCCESS_MESSAGES.read,
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, INSIGHT_ERROR_MESSAGES.read),
      });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => api.post(`/ai/insights/${id}/dismiss`),
    onSuccess: (_, id) => {
      invalidateInsightQueries();
      setToast({
        tone: 'success',
        message: INSIGHT_SUCCESS_MESSAGES.dismiss,
        actionLabel: 'Undo',
        onAction: () => restoreMutation.mutate(id),
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, INSIGHT_ERROR_MESSAGES.dismiss),
      });
    },
  });

  const markGroupReadMutation = useMutation({
    mutationFn: async (ids) => Promise.all(ids.map((id) => api.post(`/ai/insights/${id}/read`))),
    onSuccess: (_, ids) => {
      invalidateInsightQueries();
      setToast({
        tone: 'success',
        message: buildInsightBatchSuccessMessage('read', ids.length),
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, INSIGHT_ERROR_MESSAGES.groupRead),
      });
    },
  });

  const dismissGroupMutation = useMutation({
    mutationFn: async (ids) => Promise.all(ids.map((id) => api.post(`/ai/insights/${id}/dismiss`))),
    onSuccess: (_, ids) => {
      invalidateInsightQueries();
      setToast({
        tone: 'success',
        message: buildInsightBatchSuccessMessage('dismiss', ids.length),
        actionLabel: 'Undo',
        onAction: () => restoreGroupMutation.mutate(ids),
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, INSIGHT_ERROR_MESSAGES.groupDismiss),
      });
    },
  });

  return {
    toast,
    markReadMutation,
    dismissMutation,
    restoreMutation,
    restoreGroupMutation,
    markGroupReadMutation,
    dismissGroupMutation,
  };
}

export function getInsightActionState(insightId, {
  markReadMutation,
  dismissMutation,
  restoreMutation,
}) {
  const isMarkingRead = markReadMutation.isPending && markReadMutation.variables === insightId;
  const isDismissing = dismissMutation.isPending && dismissMutation.variables === insightId;
  const isRestoring = restoreMutation.isPending && restoreMutation.variables === insightId;

  return {
    isMarkingRead,
    isDismissing,
    isRestoring,
    isBusy: isMarkingRead || isDismissing || isRestoring,
  };
}

export function getInsightReadState(isRead, unreadClasses) {
  return isRead ? '' : unreadClasses;
}

export function getInsightCardUnreadClasses(insight, unreadClasses) {
  return getInsightReadState(insight.is_read, unreadClasses);
}

export function getInsightCardActionButtons(insight, {
  markReadMutation,
  dismissMutation,
  restoreMutation,
}) {
  const { isMarkingRead, isDismissing, isBusy } = getInsightActionState(insight.id, {
    markReadMutation,
    dismissMutation,
    restoreMutation,
  });

  return {
    isRead: insight.is_read,
    isBusy,
    isMarkingRead,
    isDismissing,
    onMarkRead: () => markReadMutation.mutate(insight.id),
    onDismiss: () => dismissMutation.mutate(insight.id),
  };
}

export function getInsightCardPresentationProps(insight, {
  markReadMutation,
  dismissMutation,
  restoreMutation,
  unreadClasses,
}) {
  return {
    unreadClasses: getInsightCardUnreadClasses(insight, unreadClasses),
    actionButtons: getInsightCardActionButtons(insight, {
      markReadMutation,
      dismissMutation,
      restoreMutation,
    }),
  };
}
