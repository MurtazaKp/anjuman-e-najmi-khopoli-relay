export interface WhatsAppMessagePayload {
  toMobile: string;
  hofName: string;
  eventName: string;
  passLinkUrl: string;
}

export interface WhatsAppNotificationResult {
  status: "SENT" | "DELIVERED" | "FAILED";
  messageId: string;
  sentAt: string;
  mobile: string;
  link: string;
  waDirectLink: string;
  providerResponse?: any;
}

/**
 * Clean mobile number format for WhatsApp (e.g. 9820098200 -> 919820098200)
 */
export function formatWhatsAppMobile(mobile: string): string {
  const clean = mobile.replace(/\D/g, "");
  if (clean.length === 10) {
    return `91${clean}`; // Default India country code
  }
  return clean;
}

/**
 * Generates direct click-to-chat WhatsApp link
 */
export function generateWhatsAppDirectLink(payload: WhatsAppMessagePayload): string {
  const formattedMobile = formatWhatsAppMobile(payload.toMobile);
  const messageBody = `Khopoli Relay Centre\n\n` +
    `Dear ${payload.hofName},\n` +
    `Your passes for ${payload.eventName} are now ready.\n\n` +
    `View Family Passes:\n${payload.passLinkUrl}\n\n` +
    `Please present the QR code at the event entrance for check-in.`;

  const encodedText = encodeURIComponent(messageBody);
  return `https://wa.me/${formattedMobile}?text=${encodedText}`;
}

/**
 * Sends live automated WhatsApp message using configured provider (UltraMsg, Twilio, Meta API)
 */
export async function sendWhatsAppPassNotification(
  payload: WhatsAppMessagePayload
): Promise<WhatsAppNotificationResult> {
  const { toMobile, hofName, eventName, passLinkUrl } = payload;
  const formattedMobile = formatWhatsAppMobile(toMobile);
  const waDirectLink = generateWhatsAppDirectLink(payload);

  const messageBody = `Khopoli Relay Centre\n\n` +
    `Dear ${hofName},\n` +
    `Your passes for ${eventName} are now ready.\n\n` +
    `View Family Passes:\n${passLinkUrl}\n\n` +
    `Please present the QR code at the event entrance for check-in.`;

  console.log(`\n========================================`);
  console.log(`[WhatsApp Notification Request to +${formattedMobile}]`);
  console.log(messageBody);
  console.log(`========================================\n`);

  let isSent = false;
  let apiResponse = null;

  // 1. Check UltraMsg Provider Credentials
  const ultramsgInstance = process.env.ULTRAMSG_INSTANCE_ID;
  const ultramsgToken = process.env.ULTRAMSG_TOKEN;

  if (ultramsgInstance && ultramsgToken) {
    try {
      console.log("[WhatsApp API] Sending via UltraMsg...");
      const apiRes = await fetch(`https://api.ultramsg.com/${ultramsgInstance}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: ultramsgToken,
          to: formattedMobile,
          body: messageBody,
        }),
      });
      apiResponse = await apiRes.json();
      console.log("[UltraMsg API Result]", apiResponse);
      if (apiResponse.sent === "true" || apiResponse.id) {
        isSent = true;
      }
    } catch (err: any) {
      console.error("[UltraMsg Error]", err.message);
    }
  }

  // 2. Check Twilio Provider Credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

  if (!isSent && twilioSid && twilioAuthToken) {
    try {
      console.log("[WhatsApp API] Sending via Twilio...");
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString("base64");

      const apiRes = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilioFrom,
          To: `whatsapp:+${formattedMobile}`,
          Body: messageBody,
        }),
      });
      apiResponse = await apiRes.json();
      console.log("[Twilio API Result]", apiResponse);
      if (apiResponse.sid) {
        isSent = true;
      }
    } catch (err: any) {
      console.error("[Twilio Error]", err.message);
    }
  }

  // If no live API credentials configured, fallback to simulation mode
  if (!ultramsgInstance && !twilioSid) {
    isSent = true; // Simulated delivery log
  }

  return {
    status: isSent ? "DELIVERED" : "FAILED",
    messageId: `WA-KRC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sentAt: new Date().toISOString(),
    mobile: toMobile,
    link: passLinkUrl,
    waDirectLink,
    providerResponse: apiResponse,
  };
}
