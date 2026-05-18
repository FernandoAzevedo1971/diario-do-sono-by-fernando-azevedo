import { initializeApp } from 'firebase-admin/app';
import { onCall } from 'firebase-functions/v2/https';

initializeApp();

export const requestSleepDiaryPdf = onCall(async () => {
  return {
    status: 'planned',
    message: 'PDF generation will be implemented in phase 9.',
  };
});
