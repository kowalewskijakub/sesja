import { Resend } from "resend";

interface BoardInfo {
  subject: string;
  lecturer: string;
}

/**
 * Wysyła kod logowania admina.
 * Gdy RESEND_API_KEY nie jest ustawiony — wypisuje kod w logach (tryb dev).
 */
export async function sendAdminCode(
  to: string,
  code: string,
  board: BoardInfo,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[DEV] Kod logowania admina dla ${to}: ${code}\n`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "Sesja <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to,
    subject: `Kod logowania prowadzącego — ${board.subject}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <p style="font-size:14px;color:#555">Tablica: <b>${board.subject}</b> (${board.lecturer})</p>
        <p style="font-size:15px">Twój kod logowania do panelu prowadzącego:</p>
        <p style="font-size:34px;font-weight:800;letter-spacing:6px;margin:16px 0">${code}</p>
        <p style="font-size:13px;color:#888">Kod jest ważny 15 minut. Jeśli to nie Ty — zignoruj tę wiadomość.</p>
      </div>
    `,
  });
}
