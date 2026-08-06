// Monogram "M" badge with an accent dot (nods to the WhatsApp notification
// feature). Reusable so the SVG isn't hardcoded per page — see docs/10-logo.md.
export default function LogoIcon({ variant = 'light', size = 36 }) {
  const badgeFill = variant === 'dark' ? '#2563EB' : '#1E40AF';
  const dotFill = variant === 'dark' ? '#fff' : '#93C5FD';

  return (
    <svg width={size} height={size} viewBox="0 0 36 36" role="img" aria-label="Medicalsia">
      <rect width="36" height="36" rx="10" fill={badgeFill} />
      <path
        d="M9 26V11l4.5 8L18 11v0M18 11l4.5 8L27 11v15"
        stroke="#fff"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="9" r="2.2" fill={dotFill} />
    </svg>
  );
}
