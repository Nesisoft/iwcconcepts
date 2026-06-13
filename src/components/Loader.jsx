/**
 * Loader.jsx — small reusable loading indicator.
 *
 * <Loader />                       inline spinner
 * <Loader label="Loading…" />      spinner + caption, centred in its container
 * <Loader fill label="Loading…" /> fills available space and centres (for panes)
 *
 * Spinner animation lives in global.css (.iwc-spinner / @keyframes iwc-spin).
 */
export default function Loader({
  label,
  size = 26,
  accent = '#C9A84C',
  fill = false,
  style = {},
}) {
  const spinner = (
    <div
      className="iwc-spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 9)), borderTopColor: accent }}
    />
  )

  if (!label && !fill) return spinner

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontFamily: "'Montserrat', sans-serif",
        ...(fill ? { width: '100%', height: '100%', minHeight: 180, flex: 1 } : {}),
        ...style,
      }}
    >
      {spinner}
      {label && <div style={{ letterSpacing: 0.5 }}>{label}</div>}
    </div>
  )
}
