import Stripe from 'stripe';

function jsonResponse(body, status = 200) {
  return Response.json(body, { status });
}

function getTwilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromPhone: process.env.TWILIO_FROM_PHONE,
    ownerPhone: process.env.TWILIO_OWNER_PHONE,
    notifyRecipients: process.env.TWILIO_NOTIFY_RECIPIENTS || 'owner',
  };
}

function getClientPhone(session) {
  return session.customer_details?.phone || session.metadata?.clientPhone || '';
}

function getMessage(session, recipientType) {
  const duration = session.metadata?.duration === '60min' ? '1-hour' : '30-minute';
  const email = session.customer_details?.email || session.customer_email || session.metadata?.customerEmail || 'No email provided';
  const clientPhone = getClientPhone(session) || 'No phone provided';

  if (recipientType === 'client') {
    return process.env.TWILIO_CLIENT_MESSAGE
      || `Thanks for booking your ${duration} Bitty text session. Reply here when you are ready to start.`;
  }

  return process.env.TWILIO_OWNER_MESSAGE
    || `New paid Bitty session: ${duration}. Client email: ${email}. Client phone: ${clientPhone}.`;
}

async function sendText(to, body) {
  const { accountSid, authToken, fromPhone } = getTwilioConfig();

  if (!accountSid || !authToken || !fromPhone || !to) {
    console.log('Twilio text skipped because configuration or recipient is missing.');
    return;
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const params = new URLSearchParams({
    From: fromPhone,
    To: to,
    Body: body,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio send failed: ${response.status} ${errorText}`);
  }
}

async function notifyPaidSession(session) {
  const { ownerPhone, notifyRecipients } = getTwilioConfig();
  const clientPhone = getClientPhone(session);
  const recipients = notifyRecipients.toLowerCase();

  if (recipients === 'owner' || recipients === 'both') {
    await sendText(ownerPhone, getMessage(session, 'owner'));
  }

  if (recipients === 'client' || recipients === 'both') {
    await sendText(clientPhone, getMessage(session, 'client'));
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return jsonResponse({ error: 'Stripe webhook is not configured yet.' }, 500);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover',
  });
  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error.message);
    return jsonResponse({ error: 'Invalid webhook signature.' }, 400);
  }

  try {
    if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
      await notifyPaidSession(event.data.object);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('Stripe webhook handling failed:', error.message);
    return jsonResponse({ error: 'Webhook handler failed.' }, 500);
  }
}
