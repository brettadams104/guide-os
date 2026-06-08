// GuideStride GS lettermark
// G: white on dark backgrounds
// S: always red (#DC2626)

interface LogoMarkProps {
  size?: number
  variant?: 'on-dark' | 'on-light'
}

export function LogoMark({ size = 40, variant = 'on-dark' }: LogoMarkProps) {
  const gColor = variant === 'on-dark' ? '#ffffff' : '#0f1f35'
  const sColor = '#DC2626'

  return (
    <svg
      width={size * 1.35}
      height={size}
      viewBox="0 0 54 40"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <text
        y="36"
        fontSize="42"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Arial, sans-serif"
        fontWeight="800"
        fill={gColor}
        letterSpacing="-1"
      >
        G
      </text>
      <text
        x="27"
        y="36"
        fontSize="42"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Arial, sans-serif"
        fontWeight="800"
        fill={sColor}
        letterSpacing="-1"
      >
        S
      </text>
    </svg>
  )
}

export function LogoLockup({ variant = 'on-dark' }: { variant?: 'on-dark' | 'on-light' }) {
  const textColor = variant === 'on-dark' ? '#ffffff' : '#0f1f35'
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={28} variant={variant} />
      <span className="font-bold text-lg tracking-tight" style={{ color: textColor }}>
        GuideStride
      </span>
    </div>
  )
}
