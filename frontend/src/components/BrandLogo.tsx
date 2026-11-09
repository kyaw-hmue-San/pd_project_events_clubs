type BrandLogoProps = {
  compact?: boolean
  /** Background behind the image, independent of the OS color scheme. */
  tone?: 'light' | 'dark'
  height?: number
  decorative?: boolean
  className?: string
}

/** Official supplied SVGs. No tinting, stretching, cropping or recreated marks. */
export function BrandLogo({ compact = false, tone = 'light', height = compact ? 40 : 48, decorative = false, className = '' }: BrandLogoProps) {
  const filename = `logo-${compact ? 'mark' : 'horizontal'}${tone === 'dark' ? '-on-dark' : ''}.svg`
  return <img
    src={`${import.meta.env.BASE_URL}brand/${filename}`}
    alt={decorative ? '' : 'Campus Events & Clubs'}
    width={compact ? 180 : 740}
    height={compact ? 135 : 166}
    style={{ height, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
    className={className}
    draggable={false}
    decoding="async"
  />
}
