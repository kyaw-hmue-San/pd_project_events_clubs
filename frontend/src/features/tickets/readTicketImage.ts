type ImageIssue = 'size' | 'format' | 'open' | 'dimensions' | 'unreadable' | 'wrong-qr'

const issues: Record<ImageIssue, { title: string; description: string }> = {
  size: { title: 'This image is too large', description: 'Choose an image under 5 MB, or enter the ticket code below.' },
  format: { title: 'Choose a supported image', description: 'Use the PNG from Download QR, or a PNG, JPEG or WebP screenshot. PDF and HEIC files are not supported.' },
  open: { title: 'This image could not be opened', description: 'Download the QR again and choose the new PNG, or enter the ticket code below.' },
  dimensions: { title: 'This image is too large to read', description: 'Crop the image around the complete QR, keeping its white border, and try again.' },
  unreadable: { title: 'The QR could not be read', description: 'Try the original Download QR PNG. For screenshots, crop around the full QR and keep its white border.' },
  'wrong-qr': { title: 'This is not a Campus Events & Clubs ticket', description: 'Use the QR from My registrations → View ticket. Other QR codes cannot be used for check-in.' },
}

export class TicketImageError extends Error {
  readonly title: string
  constructor(readonly issue: ImageIssue) {
    super(issues[issue].description)
    this.title = issues[issue].title
  }
}

// File providers may omit MIME metadata or report application/octet-stream.
// Identify supported raster bytes, then give the browser a correctly typed Blob.
async function imageType(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new TicketImageError('size')
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => header[index] === value)) return 'image/png'
  if (header[0] === 255 && header[1] === 216 && header[2] === 255) return 'image/jpeg'
  if (String.fromCharCode(...header.slice(0, 4)) === 'RIFF' && String.fromCharCode(...header.slice(8, 12)) === 'WEBP') return 'image/webp'
  throw new TicketImageError('format')
}

export function isTicketQr(value: string) {
  return value.length <= 128 && /^[A-F0-9]{32}$/.test(value.trim().toUpperCase().replace(/^CP1:/, '').replace(/[\s-]/gu, ''))
}

async function loadImage(url: string) {
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => { finish(); reject(new TicketImageError('open')) }, 10000)
    const finish = () => { window.clearTimeout(timer); image.onload = null; image.onerror = null }
    image.onload = () => { finish(); resolve() }
    image.onerror = () => { finish(); reject(new TicketImageError('open')) }
    image.src = url
  })
  return image
}

export async function readTicketImage(file: File, isCurrent: () => boolean): Promise<string | null> {
  const type = await imageType(file)
  if (!isCurrent()) return null
  const url = URL.createObjectURL(new Blob([file], { type }))
  let image: HTMLImageElement | undefined
  try {
    image = await loadImage(url)
    if (!isCurrent()) return null
    const width = image.naturalWidth, height = image.naturalHeight
    if (!width || !height) throw new TicketImageError('open')
    if (width * height > 32_000_000 || Math.max(width, height) > 16384) throw new TicketImageError('dimensions')
    let BrowserQRCodeReader
    try { ({ BrowserQRCodeReader } = await import('@zxing/browser')) }
    catch { throw new Error('The QR reader could not load. Check your connection and try again, or enter the ticket code.') }
    if (!isCurrent()) return null
    const reader = new BrowserQRCodeReader()
    const canvas = document.createElement('canvas')
    let otherQrFound = false
    // Bounded full-image passes plus overlapping sections for tall/wide ticket
    // screenshots. Compositing onto white also handles transparent PNG exports.
    const regions = [{ x: 0, y: 0, width, height }]
    if (height > width * 1.7) {
      const length = Math.min(height, width * 1.6)
      for (const y of [0, (height - length) / 2, height - length]) regions.push({ x: 0, y, width, height: length })
    } else if (width > height * 1.7) {
      const length = Math.min(width, height * 1.6)
      for (const x of [0, (width - length) / 2, width - length]) regions.push({ x, y: 0, width: length, height })
    }
    try {
      for (const region of regions) {
        const longest = Math.max(region.width, region.height)
        for (const target of new Set([Math.min(longest, 1600), Math.min(longest, 900)])) {
          // Yield before CPU decoding so the busy notice can paint and route
          // changes/cancellation can interrupt between bounded attempts.
          await new Promise<void>(resolve => window.setTimeout(resolve, 0))
          if (!isCurrent()) return null
          const scale = target / longest
          const scaledWidth = Math.round(region.width * scale), scaledHeight = Math.round(region.height * scale)
          canvas.width = scaledWidth + 32; canvas.height = scaledHeight + 32
          const context = canvas.getContext('2d', { willReadFrequently: true })
          if (!context) throw new Error('This browser could not read the image. Try another browser or enter the ticket code.')
          context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
          context.drawImage(image, region.x, region.y, region.width, region.height, 16, 16, scaledWidth, scaledHeight)
          try {
            const code = reader.decodeFromCanvas(canvas).getText()
            if (isTicketQr(code)) return code
            otherQrFound = true
          } catch { /* Another bounded size/section may reveal the QR. */ }
        }
      }
    } finally { canvas.width = 0; canvas.height = 0 }
    throw new TicketImageError(otherQrFound ? 'wrong-qr' : 'unreadable')
  } finally { image?.removeAttribute('src'); URL.revokeObjectURL(url) }
}
