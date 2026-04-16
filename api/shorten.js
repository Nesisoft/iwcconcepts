export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'url parameter required' })

  try {
    const response = await fetch(
      `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`
    )
    const data = await response.json()
    res.status(200).json(data)
  } catch {
    res.status(502).json({ error: 'Failed to reach is.gd' })
  }
}
