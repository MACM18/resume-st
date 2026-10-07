export function Flower({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="currentColor">
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="25"
            rx="12"
            ry="24"
            transform={`rotate(${i * 45} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="13" fill="#faf8f1" />
      <circle cx="46" cy="48" r="1.6" />
      <circle cx="54" cy="48" r="1.6" />
      <path
        d="M45 54 Q50 58 55 54"
        stroke="#292a25"
        fill="none"
        strokeWidth="1.5"
      />
    </svg>
  );
}
