/** VAAKYA mark: a speech bubble whose tail forms a "V", with a marigold dot for the spoken word. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="var(--primary)" />
      <path d="M11 12.5 L20 28 L29 12.5" fill="none" stroke="var(--primary-ink)" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="29.5" cy="28.5" r="3.2" fill="#e8a33d" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[1.35rem] leading-none tracking-tight text-ink">VAAKYA</span>
    </span>
  );
}
