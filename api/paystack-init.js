/**
 * api/paystack-init.js — initialise a Paystack transaction server-side
 *
 * Called by the frontend before redirecting the user to Paystack's hosted
 * checkout page. Using the server (not the browser) to initialise means the
 * secret key is never exposed to the client.
 *
 * Required env var: PAYSTACK_SECRET_KEY (sk_live_… or sk_test_…)
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, amount, currency = 'GHS', channels, callback_url, metadata } = req.body || {}

  if (!email || !amount) {
    return res.status(400).json({ error: 'email and amount are required' })
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    return res.status(500).json({
      error: 'Paystack is not configured on the server. Add PAYSTACK_SECRET_KEY to your environment variables.',
    })
  }

  try {
    const body = { email, amount: Math.round(amount * 100), currency, callback_url, metadata }
    if (channels?.length) body.channels = channels

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await paystackRes.json()

    if (!data.status || !data.data?.authorization_url) {
      return res.status(400).json({ error: data.message || 'Paystack initialisation failed' })
    }

    res.json({
      authorization_url: data.data.authorization_url,
      reference:         data.data.reference,
      access_code:       data.data.access_code,
    })
  } catch (err) {
    console.error('[paystack-init]', err.message)
    res.status(500).json({ error: err.message || 'Payment initialisation error' })
  }
}
