/**
 * api/shorten.js — shorten a URL via TinyURL's modern REST API
 *
 * NOTE: the old `https://tinyurl.com/api-create.php` endpoint is DEPRECATED.
 * Links created with it are forced through TinyURL's "deprecated" interstitial
 * preview page (with a countdown) before redirecting — which is why short links
 * were no longer redirecting cleanly. We now use the supported API instead:
 *   POST https://api.tinyurl.com/create   (Bearer-token auth)
 *
 * Required env var: TINYURL_API_TOKEN
 *   Get it from: tinyurl.com → log in → Settings → API  (create an API token)
 *
 * Frontend contract is unchanged: GET /api/shorten?url=<encoded url>
 *   → 200 { shorturl }   on success
 *   → 4xx/5xx { errormessage }   on failure
 */

export default async function handler(req, res) {
  const url = req.query?.url || req.body?.url
  if (!url) return res.status(400).json({ errormessage: 'url parameter required' })

  const token = process.env.TINYURL_API_TOKEN
  if (!token) {
    return res.status(500).json({
      errormessage:
        'TinyURL is not configured on the server. Add TINYURL_API_TOKEN to your environment variables.',
    })
  }

  try {
    const response = await fetch('https://api.tinyurl.com/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ url, domain: 'tinyurl.com' }),
    })

    const data = await response.json().catch(() => null)
    const shorturl = data?.data?.tiny_url

    if (response.ok && shorturl) {
      return res.status(200).json({ shorturl })
    }

    // Surface TinyURL's own error message when it provides one.
    const errormessage =
      (Array.isArray(data?.errors) && data.errors.join(', ')) ||
      data?.message ||
      'TinyURL could not shorten this URL'
    return res.status(response.status === 200 ? 502 : response.status).json({ errormessage })
  } catch {
    res.status(502).json({ errormessage: 'Failed to reach TinyURL' })
  }
}
