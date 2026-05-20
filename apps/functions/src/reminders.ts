import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Resend } from 'resend';

const resendKey = defineSecret('RESEND_API_KEY');

// Ajustar para o domínio verificado no Resend antes do deploy
const FROM_EMAIL = 'noreply@diariodosono.com.br';

// Fuso horário do Brasil: BRT = UTC-3
const BRT_OFFSET_MINUTES = -3 * 60;

function toBrt(date: Date): Date {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utcMs + BRT_OFFSET_MINUTES * 60 * 1000);
}

export const sendDiaryReminders = onSchedule(
  { schedule: 'every 60 minutes', secrets: [resendKey] },
  async () => {
    const brtNow = toBrt(new Date());
    const todayBrt = brtNow.toISOString().slice(0, 10);
    const currentMinutes = brtNow.getHours() * 60 + brtNow.getMinutes();

    const db = getFirestore();
    const usersSnap = await db.collection('users').get();

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;

      const profileSnap = await db.doc(`users/${uid}/profile/main`).get();
      if (!profileSnap.exists) continue;

      const profile = profileSnap.data()!;
      const email: string | undefined = profile.email;
      if (!email) continue;

      // Já enviou lembrete hoje?
      if (profile.lastReminderEmailSentAt === todayBrt) continue;

      // Ainda não chegou a hora do lembrete (usualOutOfBedTime + 1h)?
      const usualOutOfBedTime: string = profile.usualOutOfBedTime ?? '07:00';
      const [wakeH, wakeM] = usualOutOfBedTime.split(':').map(Number);
      const reminderMinutes = ((wakeH + 1) % 24) * 60 + wakeM;
      if (currentMinutes < reminderMinutes) continue;

      // Já preencheu o diário hoje?
      const entriesSnap = await db
        .collection(`users/${uid}/sleepDiaryEntries`)
        .where('input.entryDate', '==', todayBrt)
        .limit(1)
        .get();
      if (!entriesSnap.empty) continue;

      // Envia email
      const resend = new Resend(resendKey.value());
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Lembrete: preencha seu Diário do Sono de hoje',
        html: buildEmailHtml(profile.name ?? 'paciente'),
      });

      // Marca como enviado hoje para não reenviar na próxima hora
      await db.doc(`users/${uid}/profile/main`).update({ lastReminderEmailSentAt: todayBrt });
    }
  },
);

function buildEmailHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:sans-serif;color:#222;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="color:#1a1a2e">Diário do Sono</h2>
  <p>Olá, <strong>${name}</strong>.</p>
  <p>Você ainda não preencheu o <strong>Diário do Sono</strong> de hoje.</p>
  <p>Leva menos de 2 minutos. Abra o aplicativo agora e registre como foi a sua noite.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#888;font-size:11px">
    Lembrete automático do Diário do Sono — Dr. Fernando Azevedo.<br>
    Para parar de receber estes emails, desative os lembretes nas configurações do aplicativo.
  </p>
</body>
</html>`;
}
