// SVG icon strings for each social media platform
// Used both for UI display (as data URIs) and canvas rendering (preloaded Image objects)

export const PLATFORM_SVG = {
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <defs>
      <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f09433"/>
        <stop offset="30%" stop-color="#e6683c"/>
        <stop offset="55%" stop-color="#dc2743"/>
        <stop offset="75%" stop-color="#cc2366"/>
        <stop offset="100%" stop-color="#bc1888"/>
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="9" fill="url(#ig)"/>
    <rect x="11" y="11" width="18" height="18" rx="5" fill="none" stroke="white" stroke-width="2.2"/>
    <circle cx="20" cy="20" r="5.5" fill="none" stroke="white" stroke-width="2.2"/>
    <circle cx="28.5" cy="11.5" r="1.5" fill="white"/>
  </svg>`,

  facebook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="9" fill="#1877F2"/>
    <path d="M22 38V25h4l.5-5H22v-3c0-1.4.4-2.4 2.4-2.4H27V9.2C26.5 9.1 25 9 23.2 9c-3.7 0-6.2 2.3-6.2 6.5V20h-4v5h4v13H22z" fill="white"/>
  </svg>`,

  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="9" fill="#FF0000"/>
    <path d="M32 20s0-5.3-.7-7.8c-.4-1.4-1.5-2.5-2.9-2.9C26 9 20 9 20 9s-6 0-8.4.3c-1.4.4-2.5 1.5-2.9 2.9C8 14.7 8 20 8 20s0 5.3.7 7.8c.4 1.4 1.5 2.5 2.9 2.9C14 31 20 31 20 31s6 0 8.4-.3c1.4-.4 2.5-1.5 2.9-2.9C32 25.3 32 20 32 20z" fill="#FF0000" stroke="white" stroke-width="0"/>
    <polygon points="17,14.5 17,25.5 26,20" fill="white"/>
  </svg>`,

  tiktok: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="9" fill="#010101"/>
    <path d="M28 10h-4v13.5a4.5 4.5 0 1 1-4.5-4.5c.4 0 .8 0 1.2.1V15c-.4-.05-.8-.08-1.2-.08a8.5 8.5 0 1 0 8.5 8.5V18c1.4 1 3.1 1.5 4.8 1.5v-4c-1.3 0-2.6-.5-3.5-1.4A4.8 4.8 0 0 1 28 10z" fill="#69C9D0"/>
    <path d="M26 8h-4v13.5a4.5 4.5 0 1 1-4.5-4.5c.4 0 .8 0 1.2.1V13c-.4-.05-.8-.08-1.2-.08a8.5 8.5 0 1 0 8.5 8.5V16c1.4 1 3.1 1.5 4.8 1.5v-4c-1.3 0-2.6-.5-3.5-1.4A4.8 4.8 0 0 1 26 8z" fill="#EE1D52"/>
    <path d="M27 9h-4v13.5a4.5 4.5 0 1 1-4.5-4.5c.4 0 .8 0 1.2.1V14c-.4-.05-.8-.08-1.2-.08a8.5 8.5 0 1 0 8.5 8.5V17c1.4 1 3.1 1.5 4.8 1.5v-4c-1.3 0-2.6-.5-3.5-1.4A4.8 4.8 0 0 1 27 9z" fill="white"/>
  </svg>`,

  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="9" fill="#0A66C2"/>
    <rect x="9" y="15" width="5" height="16" rx="1" fill="white"/>
    <circle cx="11.5" cy="10.5" r="3" fill="white"/>
    <path d="M19 15h5v2.2c.7-1.3 2.3-2.5 4.5-2.5 4.2 0 5.5 2.8 5.5 6.5V31h-5V22c0-2-.4-3.5-2.5-3.5-2 0-2.5 1.5-2.5 3.5v9h-5V15z" fill="white"/>
  </svg>`,

  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="9" fill="#000000"/>
    <path d="M9 9l8.5 11L9 31h3l7-8 5.5 8H31L22 19.5 30 9h-3l-6.5 7.5L15 9H9z" fill="white"/>
  </svg>`,

  spotify: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="20" fill="#1DB954"/>
    <path d="M10 16.5c5.8-3.3 16.2-2.5 22 1" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M11.5 22c4.8-2.7 13.5-2 18.5.8" stroke="white" stroke-width="2.3" stroke-linecap="round" fill="none"/>
    <path d="M13 27.5c3.8-2 10.5-1.5 14.5.8" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  </svg>`,

  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="20" fill="#25D366"/>
    <path d="M20 8a12 12 0 0 0-10.4 17.9L8 32l6.3-1.6A12 12 0 1 0 20 8z" fill="white"/>
    <path d="M15 15.5c.3-.7.7-.8 1-.8.3 0 .5 0 .8.1.3.1.5.3 1.2 1.8.4.9.7 1.5.7 1.8 0 .3-.1.6-.4.9l-.5.5c-.2.2-.3.4-.2.6.2.4.8 1.5 1.7 2.4.9.9 1.8 1.4 2.3 1.6.3.1.5 0 .7-.2l.5-.6c.3-.3.5-.4.8-.3.3.1 1.8.9 2.1 1 .3.2.5.3.6.4.1.2 0 .9-.3 1.6-.3.7-1.6 1.3-2.2 1.4-.6.1-1.2.1-1.8-.1-1-.3-2.2-.9-3.8-2.5-1.7-1.6-2.6-3.4-2.9-4.3-.3-.9-.2-1.7.1-2.3z" fill="#25D366"/>
  </svg>`,

  podcast: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="9" fill="#9B59B6"/>
    <rect x="16" y="7" width="8" height="15" rx="4" fill="white"/>
    <path d="M11 21a9 9 0 0 0 18 0" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <line x1="20" y1="30" x2="20" y2="35" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="14" y1="35" x2="26" y2="35" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`,

  none: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="9" fill="#333"/>
    <line x1="12" y1="12" x2="28" y2="28" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <line x1="28" y1="12" x2="12" y2="28" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  zoom: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="9" fill="#2D8CFF"/>
    <rect x="6" y="13" width="20" height="14" rx="3" fill="white"/>
    <polygon points="26,17 34,12 34,28 26,23" fill="white"/>
  </svg>`,
}

// Convert SVG string to data URI for use in <img> tags
export const svgToDataUri = (svg) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

// Platform definitions for UI
export const SOCIAL_PLATFORMS = [
  { id: 'none',      label: 'None' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook',  label: 'Facebook' },
  { id: 'youtube',   label: 'YouTube' },
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'linkedin',  label: 'LinkedIn' },
  { id: 'x',         label: 'X / Twitter' },
  { id: 'spotify',   label: 'Spotify' },
  { id: 'whatsapp',  label: 'WhatsApp' },
  { id: 'podcast',   label: 'Podcast' },
]

export const FLYER_PLATFORMS = [
  { id: 'zoom',      label: 'Zoom' },
  { id: 'youtube',   label: 'YouTube Live' },
  { id: 'instagram', label: 'Instagram Live' },
  { id: 'facebook',  label: 'Facebook Live' },
  { id: 'none',      label: 'None' },
]

// Preload all platform SVG images as Image objects (for canvas drawImage)
const imageCache = {}

export function preloadPlatformImages() {
  const promises = Object.entries(PLATFORM_SVG).map(([id, svg]) => {
    return new Promise((resolve) => {
      if (imageCache[id]) { resolve(); return }
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        imageCache[id] = img
        URL.revokeObjectURL(url)
        resolve()
      }
      img.onerror = () => { resolve() }
      img.src = url
    })
  })
  return Promise.all(promises)
}

export function getPlatformImage(id) {
  return imageCache[id] || null
}
