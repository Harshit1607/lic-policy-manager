import { Linking } from 'react-native';

/** Strip everything but digits and a leading +. */
function sanitizePhone(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/[^\d]/g, '');
}

export async function callClient(phone: string): Promise<void> {
  const number = sanitizePhone(phone);
  if (!number) return;
  await Linking.openURL(`tel:${number}`);
}

export async function smsClient(phone: string, body?: string): Promise<void> {
  const number = sanitizePhone(phone);
  if (!number) return;
  const query = body ? `?body=${encodeURIComponent(body)}` : '';
  await Linking.openURL(`sms:${number}${query}`);
}

/**
 * WhatsApp needs the full international number without '+' or spaces. Indian
 * mobile numbers are usually saved as 10 digits (optionally with a leading 0),
 * so those get the 91 country code prefixed.
 */
export function whatsAppNumber(phone: string): string {
  const sanitized = sanitizePhone(phone);
  if (sanitized.startsWith('+')) return sanitized.slice(1);
  const digits = sanitized.replace(/^0+/, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * Open a WhatsApp chat with the client. Falls back to the wa.me web link if
 * the app scheme cannot be opened.
 */
export async function whatsAppClient(phone: string, message?: string): Promise<void> {
  const number = whatsAppNumber(phone);
  if (!number) return;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  const appUrl = `whatsapp://send?phone=${number}${message ? `&text=${encodeURIComponent(message)}` : ''}`;
  const webUrl = `https://wa.me/${number}${text}`;
  const canOpen = await Linking.canOpenURL(appUrl).catch(() => false);
  await Linking.openURL(canOpen ? appUrl : webUrl);
}

/** Default reminder message an agent can send to a client about a due premium. */
export function premiumReminderMessage(params: {
  clientName: string;
  policyNumber: string;
  amount: string;
  dueDate: string;
}): string {
  return (
    `Dear ${params.clientName}, this is a reminder that the premium of ${params.amount} ` +
    `for your LIC policy ${params.policyNumber} is due on ${params.dueDate}. ` +
    `Kindly pay before the grace period ends to keep the policy in force. Thank you.`
  );
}
