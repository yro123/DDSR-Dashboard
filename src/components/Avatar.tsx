interface AvatarProps {
  name?: string | null
  bg?: string
  fg?: string
  size?: number
}

export default function Avatar({ name, bg = '#F3F4F6', fg = '#374151', size = 24 }: AvatarProps) {
  const initials = (name || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
  return (
    <span className="av" style={{
      width: size, height: size,
      fontSize: Math.floor(size * 0.42),
      background: bg, color: fg,
    }}>
      {initials}
    </span>
  )
}
