import React, { useEffect } from 'react';
import { onAIReportWsEvent } from './aiReportWsClient';
import { buildAIReportToast } from './aiReportNotifications';
import { useToast } from '../components/toast/ToastProvider';

export default function AIReportWsToastBridge() {
  const { addToast } = useToast();

  useEffect(() => {
    return onAIReportWsEvent((event) => {
      if (event?.type !== 'message') return;
      if (!event?.terminal) return;

      const toast = buildAIReportToast({
        status: event.status,
        assessmentId: event.assessmentId,
        assessmentType: event.assessmentType,
        title: event.title,
        message: event.message,
        payload: event.payload
      });

      if (toast) addToast(toast);
    });
  }, [addToast]);

  return null;
}
