import Stripe from 'stripe';

const allowedDurations = new Set(['30min', '60min']);

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

function getBaseUrl(req) {
  const origin = req.headers.get('origin');
  return origin || process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';
}

function getPriceId(duration) {
  const configuredPrice = duration === '60min'
    ? process.env.STRIPE_PRICE_60MIN
    : process.env.STRIPE_PRICE_30MIN;

  if (configuredPrice) return configuredPrice;

  return duration === '60min'
    ? 'price_1TbmJm7wX0qlzTEtihfigQy9'
    : 'price_1TbMOa7wX0qlzTEt6UrxcwsP';
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonResponse({ error: 'Stripe checkout is not configured yet.' }, 500);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const duration = allowedDurations.has(body.duration) ? body.duration : '30min';
    const customerEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const baseUrl = getBaseUrl(req);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      phone_number_collection: {
        enabled: true,
      },
      line_items: [
        {
          price: getPriceId(duration),
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success.html`,
      cancel_url: `${baseUrl}/dashboard.html`,
      customer_email: customerEmail || undefined,
      metadata: {
        duration,
        customerEmail,
        smsConsent: 'Phone number entered at checkout and purchase completed for paid peer support session texts.',
      },
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error('Checkout session creation failed:', error.message);
    return jsonResponse({ error: 'Unable to create Stripe checkout. Check the Stripe price and key configuration.' }, 500);
  }
}
