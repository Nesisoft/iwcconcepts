export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'url parameter required' })

  try {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    )
    const text = await response.text()
    const shorturl = text.trim()
    if (shorturl.startsWith('http')) {
      res.status(200).json({ shorturl })
    } else {
      res.status(502).json({ errormessage: shorturl || 'TinyURL could not shorten this URL' })
    }
  } catch {
    res.status(502).json({ errormessage: 'Failed to reach TinyURL' })
  }
}
