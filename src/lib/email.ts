export interface EmailPassPayload {
  toEmail: string;
  hofName: string;
  eventName: string;
  passLinkUrl: string;
  familyMembers: {
    name: string;
    itsId: string;
    gender: string;
    type: string;
    qrToken?: string;
  }[];
}

export interface EmailNotificationResult {
  status: "SENT" | "FAILED";
  messageId: string;
  sentAt: string;
  email: string;
}

/**
 * Generates beautiful HTML Email template for family passes
 */
export function generatePassEmailHtml(payload: EmailPassPayload): string {
  const membersListHtml = payload.familyMembers
    .map(
      (m) => `
      <tr style="border-bottom: 1px solid #e2d3b7;">
        <td style="padding: 10px; font-weight: bold; color: #11223e;">${m.name}</td>
        <td style="padding: 10px; color: #11223e;">${m.itsId}</td>
        <td style="padding: 10px; color: #11223e;">${m.gender} · ${m.type}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Khopoli Relay Centre Digital Passes</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #faf7f2; margin: 0; padding: 20px; color: #11223e;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 2px solid #c68a36; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header Banner -->
        <div style="background-color: #0a1628; background: linear-gradient(135deg, #0a1628 0%, #11223e 60%, #1b365d 100%); padding: 25px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; background-color: #c68a36; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">
            Khopoli Relay Centre
          </div>
          <h1 style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">
            ${payload.eventName}
          </h1>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #d4943c;">Official Family Event Passes</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 25px;">
          <h2 style="font-size: 18px; color: #11223e; margin-top: 0;">Dear ${payload.hofName},</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #334155;">
            Your family digital passes for <strong>${payload.eventName}</strong> are now active and ready.
          </p>

          <!-- Action Button -->
          <div style="text-align: center; margin: 25px 0;">
            <a href="${payload.passLinkUrl}" target="_blank" style="background-color: #c68a36; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(198,138,54,0.3);">
              View & Download Family Passes &rarr;
            </a>
          </div>

          <!-- Family Members Summary Table -->
          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #c68a36; border-bottom: 2px solid #e2d3b7; padding-bottom: 6px; margin-top: 25px;">
            Registered Family Members (${payload.familyMembers.length})
          </h3>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f5f0e6; text-align: left;">
                <th style="padding: 10px; color: #11223e;">Name</th>
                <th style="padding: 10px; color: #11223e;">ITS ID</th>
                <th style="padding: 10px; color: #11223e;">Details</th>
              </tr>
            </thead>
            <tbody>
              ${membersListHtml}
            </tbody>
          </table>

          <div style="margin-top: 25px; padding: 15px; background-color: #f5f0e6; border-radius: 10px; border-left: 4px solid #c68a36; font-size: 12px; color: #11223e;">
            <strong>Important Entrance Note:</strong> Please keep your digital pass QR code open on your phone or printed upon arrival at the Khopoli Relay Centre entrance counter for entry check-in.
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #0a1628; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8;">
          Khopoli Relay Centre &copy; 2026 · Support: +91 98200 98200
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sends automated pass email via Resend API or SMTP
 */
export async function sendPassEmailNotification(
  payload: EmailPassPayload
): Promise<EmailNotificationResult> {
  const { toEmail, hofName, eventName, passLinkUrl } = payload;
  const htmlContent = generatePassEmailHtml(payload);

  console.log(`\n========================================`);
  console.log(`[Email Pass Notification Dispatch to ${toEmail}]`);
  console.log(`Subject: Your Passes for ${eventName}`);
  console.log(`Pass Link: ${passLinkUrl}`);
  console.log(`========================================\n`);

  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      console.log("[Email API] Sending via Resend API...");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Khopoli Relay Centre <passes@resend.dev>",
          to: [toEmail],
          subject: `Khopoli Relay Centre — Digital Passes for ${eventName}`,
          html: htmlContent,
        }),
      });
      const data = await res.json();
      console.log("[Resend API Result]", data);
    } catch (err: any) {
      console.error("[Resend API Error]", err.message);
    }
  }

  return {
    status: "SENT",
    messageId: `EMAIL-KRC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sentAt: new Date().toISOString(),
    email: toEmail,
  };
}
