export function GoogleDriveLogo({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" aria-hidden="true">
      <path d="M6.6 66.85 3.3 58.55h81.3l-3.3 8.3z" fill="#0066da" />
      <path d="M25.7 12.1 13.4 36.6h60.5L61.6 12.1z" fill="#00ac47" />
      <path d="M0 58.55 12.3 34.05 25.7 58.55z" fill="#ea4335" />
      <path d="M25.7 12.1 38 36.6 61.6 12.1z" fill="#00832d" />
      <path d="M38 36.6 25.7 58.55 61.6 58.55z" fill="#2684fc" />
      <path d="M61.6 12.1 73.9 36.6 87.3 12.1z" fill="#ffba00" />
    </svg>
  );
}

export function CloudIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
      />
    </svg>
  );
}

export function DeviceIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

export function SyncIcon({ className = "w-4 h-4", spinning = false }) {
  return (
    <svg
      className={`${className} ${spinning ? "animate-spin" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export function FolderDriveIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 7a2 2 0 012-2h5l2 2h9a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        fill="#FBBC04"
        stroke="#E37400"
        strokeWidth="0.5"
      />
      <circle cx="18" cy="8" r="3" fill="#4285F4" />
    </svg>
  );
}

export function FileDriveIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6z"
        fill="#E8F0FE"
        stroke="#4285F4"
        strokeWidth="1.5"
      />
      <path d="M14 2v6h6" fill="#4285F4" fillOpacity="0.3" />
      <circle cx="17" cy="5" r="2.5" fill="#4285F4" />
    </svg>
  );
}
