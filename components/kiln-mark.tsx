export function KilnMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M32 8.5c13 0 23.5 10.5 23.5 23.5S45 55.5 32 55.5 8.5 45 8.5 32"
        stroke="#e08a3c"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M12 18.5 20 14l3.5 8.5-8.2 3.2z"
        fill="#c45c26"
        stroke="#f0b27a"
        strokeWidth="0.8"
      />
      <path
        d="M46.5 16 52 23.5 43 27l-2.5-9z"
        fill="#9a3f16"
        stroke="#e08a3c"
        strokeWidth="0.8"
      />
      <path
        d="M18 46.5 14 38.2l9.2-2.2 2.6 8.4z"
        fill="#e08a3c"
        stroke="#f4eadc"
        strokeWidth="0.6"
      />
      <circle cx="32" cy="32" r="4.2" fill="#f0b27a" />
    </svg>
  );
}
