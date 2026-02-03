import React, { useEffect } from 'react';
import { onAIReportWsEvent } from './aiReportWsClient';
import { buildAIReportToast } from './aiReportNotifications';
import { useToast } from '../components/toast/ToastProvider';

export default function AIReportWsToastBridge() {
  const { addToast } = useToast();

  useEffect(() => {
    return onAIReportWsEvent((event) => {
      // DEBUG: Log breakdown for ALL messages if needed, currently set to only log errors explicitly requested by user
      if (event?.status === 'failure') {
        console.group('%c[AIReportWs] Generation Failed Details', 'color: red; font-weight: bold;');
        console.log('Reason/Message:', event.message);
        console.log('Raw Backend Payload:', event.payload);
        console.log('Full Event Context:', event);
        console.groupEnd();
      }

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
