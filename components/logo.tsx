// GuideStride logo mark — uses the real PNG logo

interface LogoMarkProps {
  size?: number
}

export function LogoMark({ size = 40 }: LogoMarkProps) {
  return (
    <img
      src="/logo.png"
      alt="GuideStride"
      width={size}
      height={size}
      style={{ display: 'block', borderRadius: size * 0.15 }}
    />
  )
}

// Full lockup: mark + wordmark side by side
export function LogoLockup() {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={28} />
      <span className="font-bold text-lg tracking-tight text-white">
        GuideStride
      </span>
    </div>
  )
}
