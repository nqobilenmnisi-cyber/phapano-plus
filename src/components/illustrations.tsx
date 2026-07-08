/**
 * Phapano illustration system.
 * Hand-drawn SVG motifs in the brand palette: sunrise, reaching hands,
 * mountain, stepping stones, bridge, star. No stock art, no blobs.
 * Each is decorative (aria-hidden) and inherits sizing from className.
 */

export function Sunrise({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 190 150" fill="none" aria-hidden className={className}>
      <circle cx="120" cy="92" r="30" fill="#FBE3CF" />
      <circle cx="120" cy="92" r="30" stroke="#E6B58C" strokeWidth="1.3" strokeDasharray="2 5" opacity="0.7" />
      <path d="M60 92h120M74 104h92M88 116h64" stroke="#AD795B" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <path d="M120 40v-12M150 56l8-8M90 56l-8-8" stroke="#76B9F0" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function ReachingHands({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 96" fill="none" aria-hidden className={className}>
      <path d="M6 54c20-12 38-12 56 0s36 12 56 0" stroke="#AD795B" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10 44c18-10 34-10 50 0" stroke="#AD795B" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      <path d="M150 44c-18-10-34-10-50 0" stroke="#AD795B" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function Mountain({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 54" fill="none" aria-hidden className={className}>
      <path d="M4 44 20 16l9 14 6-9 15 23H4Z" fill="#EADFD6" />
      <path d="M20 16l9 14 6-9" stroke="#AD795B" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <path d="M20 16l-4 7h8l-4-7Z" fill="#AD795B" />
      <path d="M20 12v4M20 12l4 1.5L20 15" fill="#AD795B" stroke="#AD795B" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function SteppingStones({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 30" fill="none" aria-hidden className={className}>
      <circle cx="7" cy="22" r="3.4" fill="#AD795B" />
      <circle cx="15" cy="15" r="3.4" fill="#76B9F0" />
      <circle cx="23" cy="8" r="3.4" fill="none" stroke="#76B9F0" strokeWidth="1.6" />
      <path d="M9.5 20 12.5 17M17.5 13 20.5 10" stroke="#C9CDD2" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 3" />
    </svg>
  );
}

export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 3.5l1.9 5.2 5.6.3-4.3 3.6 1.4 5.4L12 16.6 7.4 21l1.4-5.4-4.3-3.6 5.6-.3L12 3.5Z"
        fill="#E7F1FC"
        stroke="#76B9F0"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A faint dotted pathway used to connect journey steps. */
export function PathwayLine({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block w-[3px] rounded bg-[repeating-linear-gradient(180deg,#76B9F0_0_9px,transparent_9px_16px)] opacity-50 ${className}`}
    />
  );
}

/** Compass — an academic, navigational motif (replaces the sunrise). */
export function Compass({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 190 150" fill="none" aria-hidden className={className}>
      <circle cx="120" cy="80" r="40" fill="#EAF3FC" />
      <circle cx="120" cy="80" r="40" stroke="#9CC8F2" strokeWidth="1.4" />
      <circle cx="120" cy="80" r="29" stroke="#C9DEF5" strokeWidth="1" strokeDasharray="2 4" />
      {/* needle */}
      <path d="M120 80 132 58 120 66Z" fill="#AD795B" />
      <path d="M120 80 108 102 120 94Z" fill="#76B9F0" />
      <circle cx="120" cy="80" r="3" fill="#373738" />
      {/* tick marks */}
      <path d="M120 40v6M120 114v6M80 80h6M154 80h6" stroke="#76B9F0" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** Connected opportunity markers — a small "radar / pathway" motif. */
export function PathwayDots({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 190 150" fill="none" aria-hidden className={className}>
      <path d="M30 110 75 86 120 100 165 60" stroke="#C9DEF5" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 5" />
      <circle cx="30" cy="110" r="5" fill="#AD795B" />
      <circle cx="75" cy="86" r="5" fill="#76B9F0" />
      <circle cx="120" cy="100" r="5" fill="none" stroke="#76B9F0" strokeWidth="1.8" />
      <circle cx="165" cy="60" r="5" fill="none" stroke="#AD795B" strokeWidth="1.8" />
    </svg>
  );
}

/** Stacked application documents — for application-focused contexts. */
export function Documents({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 54" fill="none" aria-hidden className={className}>
      <rect x="14" y="10" width="26" height="34" rx="3" fill="#EAF3FC" stroke="#9CC8F2" strokeWidth="1.5" />
      <rect x="10" y="14" width="26" height="34" rx="3" fill="#fff" stroke="#76B9F0" strokeWidth="1.6" />
      <path d="M15 22h16M15 28h16M15 34h11" stroke="#AD795B" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
 * Functional feature icons (clear meaning, not decorative). Stroke-based,
 * inherit the brand palette. Sized via className like the motifs above.
 * ------------------------------------------------------------------------- */

export function IconApplication({ className = "" }: { className?: string }) {
  // Document with checklist lines — applications / forms.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V3.5Z" stroke="#2E6FB0" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3.5V8h4" stroke="#2E6FB0" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 13l1.2 1.2L12.5 12" stroke="#AD795B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 17h6" stroke="#76B9F0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconFunding({ className = "" }: { className?: string }) {
  // Wallet with a coin — funding / bursaries.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="6.5" width="17" height="12" rx="2.5" stroke="#2E6FB0" strokeWidth="1.6" />
      <path d="M3.5 10h17" stroke="#2E6FB0" strokeWidth="1.6" />
      <circle cx="16.5" cy="14" r="1.6" fill="#AD795B" />
    </svg>
  );
}

export function IconRadar({ className = "" }: { className?: string }) {
  // Bell with alert dot — deadlines / opportunity radar.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6.5 17.5c1-.8 1.5-2 1.5-3.6V11a4 4 0 0 1 8 0v2.9c0 1.6.5 2.8 1.5 3.6h-11Z" stroke="#2E6FB0" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10.5 20a1.7 1.7 0 0 0 3 0" stroke="#2E6FB0" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="7" r="2.3" fill="#AD795B" />
    </svg>
  );
}

export function IconDashboard({ className = "" }: { className?: string }) {
  // Compass — orientation / dashboard.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="#2E6FB0" strokeWidth="1.6" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z" fill="#AD795B" stroke="#AD795B" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLearn({ className = "" }: { className?: string }) {
  // Open book — learning resources.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 6.5C10.5 5.3 8 5 5 5.5v12c3-.5 5.5-.3 7 1 1.5-1.3 4-1.5 7-1v-12c-3-.5-5.5-.2-7 1Z" stroke="#2E6FB0" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 6.5v12" stroke="#76B9F0" strokeWidth="1.5" />
    </svg>
  );
}

export function IconNotes({ className = "" }: { className?: string }) {
  // Notebook with pen line — private notes / planning.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5.5" y="4" width="13" height="16" rx="2" stroke="#2E6FB0" strokeWidth="1.6" />
      <path d="M5.5 8h13" stroke="#76B9F0" strokeWidth="1.4" />
      <path d="M9 12h6M9 15.5h4" stroke="#AD795B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconProfile({ className = "" }: { className?: string }) {
  // Person in a card — profile details.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" stroke="#2E6FB0" strokeWidth="1.6" />
      <circle cx="9" cy="11" r="2" stroke="#2E6FB0" strokeWidth="1.5" />
      <path d="M6 16a3 3 0 0 1 6 0" stroke="#2E6FB0" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.5 10.5h3M14.5 13.5h3" stroke="#AD795B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
