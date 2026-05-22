import crypto from 'node:crypto'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const secret    = process.env.CLOUDINARY_API_SECRET
  const apiKey    = process.env.CLOUDINARY_API_KEY
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME

  if (!secret || !apiKey || !cloudName) {
    return res.status(500).json({ error: 'Cloudinary env vars not set on server' })
  }

  const { folder = 'iwcconcepts', timestamp = Math.floor(Date.now() / 1000) } = req.body || {}

  // Build the string-to-sign: sorted key=value pairs + secret
  const paramStr = `folder=${folder}&timestamp=${timestamp}${secret}`
  const signature = crypto.createHash('sha256').update(paramStr).digest('hex')

  res.status(200).json({ signature, apiKey, cloudName, timestamp, folder })
}
