// Upload a File to Cloudinary using a server-signed request.
// Falls back to a canvas-compressed base64 data URL when the server
// endpoint is not configured (local / no env vars).

export async function uploadToCloudinary(file, { maxPx = 1200, quality = 0.82 } = {}) {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const folder    = 'iwcconcepts'

    const signRes = await fetch('/api/cloudinary-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, timestamp }),
    })

    if (!signRes.ok) throw new Error('sign-endpoint-unavailable')
    const { signature, apiKey, cloudName } = await signRes.json()
    if (!signature) throw new Error('sign-endpoint-unavailable')

    const body = new FormData()
    body.append('file',      file)
    body.append('api_key',   apiKey)
    body.append('timestamp', timestamp)
    body.append('signature', signature)
    body.append('folder',    folder)

    const upRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body }
    )

    if (!upRes.ok) throw new Error('cloudinary-upload-failed')
    const data = await upRes.json()
    if (data.error) throw new Error(data.error.message)
    return data.secure_url
  } catch {
    // Serverless endpoint not configured — fall back to canvas resize
    return canvasResize(file, maxPx, quality)
  }
}

function canvasResize(file, maxPx, quality) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}
