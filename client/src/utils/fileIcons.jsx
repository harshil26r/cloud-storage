function FileIcon({ color, children, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6z"
        fill={`${color}15`}
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M14 2v6h6" fill={`${color}30`} />
      {children}
    </svg>
  );
}

const icons = {
  pdf: {
    color: "#ea4335",
    icon: (
      <>
        <circle cx="17" cy="10" r="5" fill="#ea4335" opacity="0.15" />
        <text
          x="17"
          y="12"
          textAnchor="middle"
          fill="#ea4335"
          fontSize="7"
          fontWeight="bold"
          fontFamily="Arial"
        >
          PDF
        </text>
      </>
    ),
  },
  word: {
    color: "#4285f4",
    icon: (
      <>
        <circle cx="17" cy="10" r="5" fill="#4285f4" opacity="0.15" />
        <text
          x="17"
          y="12"
          textAnchor="middle"
          fill="#4285f4"
          fontSize="8"
          fontWeight="bold"
          fontFamily="Arial"
        >
          W
        </text>
      </>
    ),
  },
  excel: {
    color: "#34a853",
    icon: (
      <>
        <circle cx="17" cy="10" r="5" fill="#34a853" opacity="0.15" />
        <text
          x="17"
          y="12"
          textAnchor="middle"
          fill="#34a853"
          fontSize="8"
          fontWeight="bold"
          fontFamily="Arial"
        >
          X
        </text>
      </>
    ),
  },
  powerpoint: {
    color: "#fb5607",
    icon: (
      <>
        <circle cx="17" cy="10" r="5" fill="#fb5607" opacity="0.15" />
        <text
          x="17"
          y="12"
          textAnchor="middle"
          fill="#fb5607"
          fontSize="8"
          fontWeight="bold"
          fontFamily="Arial"
        >
          P
        </text>
      </>
    ),
  },
  archive: {
    color: "#fbbc04",
    icon: (
      <g transform="translate(14.5, 6)">
        <line
          x1="-1"
          y1="4"
          x2="5"
          y2="4"
          stroke="#fbbc04"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="-1"
          y1="6"
          x2="5"
          y2="6"
          stroke="#fbbc04"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="-1"
          y1="8"
          x2="5"
          y2="8"
          stroke="#fbbc04"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    ),
  },
  audio: {
    color: "#9c27b0",
    icon: (
      <g transform="translate(14.5, 5)">
        <circle cx="2" cy="8" r="2" fill="#9c27b0" />
        <path
          d="M4 8V3l5-1v6"
          stroke="#9c27b0"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="7" cy="8" r="2" fill="#9c27b0" />
      </g>
    ),
  },
  video: {
    color: "#00bcd4",
    icon: (
      <g transform="translate(14.5, 5)">
        <rect
          x="0"
          y="2"
          width="7"
          height="6"
          rx="1"
          fill="none"
          stroke="#00bcd4"
          strokeWidth="1.2"
        />
        <polygon
          points="6,5 9,3 9,7"
          fill="none"
          stroke="#00bcd4"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </g>
    ),
  },
  text: {
    color: "#757575",
    icon: (
      <g transform="translate(14.5, 6)">
        <line
          x1="0"
          y1="1"
          x2="5"
          y2="1"
          stroke="#757575"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="3"
          x2="5"
          y2="3"
          stroke="#757575"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="5"
          x2="3"
          y2="5"
          stroke="#757575"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    ),
  },
  code: {
    color: "#3f51b5",
    icon: (
      <g transform="translate(14, 5)">
        <path
          d="M2 8L0 5l2-3"
          stroke="#3f51b5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M6 8l2-3-2-3"
          stroke="#3f51b5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    ),
  },
  csv: {
    color: "#0d9488",
    icon: (
      <g transform="translate(14, 5)">
        <rect
          x="0"
          y="0"
          width="6"
          height="8"
          rx="0.5"
          fill="none"
          stroke="#0d9488"
          strokeWidth="1.2"
        />
        <line x1="1" y1="3" x2="5" y2="3" stroke="#0d9488" strokeWidth="1" />
        <line x1="1" y1="5" x2="5" y2="5" stroke="#0d9488" strokeWidth="1" />
        <line x1="1" y1="7" x2="5" y2="7" stroke="#0d9488" strokeWidth="1" />
      </g>
    ),
  },
  image: {
    color: "#0284c7",
    icon: (
      <g transform="translate(14.5, 5)">
        <rect
          x="0"
          y="0"
          width="5"
          height="8"
          rx="1"
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.2"
        />
        <circle cx="2" cy="2.5" r="1" fill="#0284c7" opacity="0.4" />
        <path
          d="M0 6l2-2 1 1 2-2"
          stroke="#0284c7"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    ),
  },
};

const extensionMap = {
  pdf: "pdf",

  doc: "word",
  docx: "word",
  odt: "word",

  xls: "excel",
  xlsx: "excel",
  ods: "excel",

  ppt: "powerpoint",
  pptx: "powerpoint",
  odp: "powerpoint",

  zip: "archive",
  rar: "archive",
  tar: "archive",
  gz: "archive",
  "7z": "archive",
  bz2: "archive",

  mp3: "audio",
  wav: "audio",
  flac: "audio",
  aac: "audio",
  ogg: "audio",
  wma: "audio",

  mp4: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  webm: "video",
  wmv: "video",
  flv: "video",

  txt: "text",
  md: "text",
  rtf: "text",

  js: "code",
  jsx: "code",
  ts: "code",
  tsx: "code",
  py: "code",
  java: "code",
  rb: "code",
  go: "code",
  rs: "code",
  php: "code",
  c: "code",
  cpp: "code",
  h: "code",
  html: "code",
  css: "code",
  scss: "code",
  less: "code",
  json: "code",
  xml: "code",
  yaml: "code",
  yml: "code",
  sh: "code",
  bash: "code",
  sql: "code",

  csv: "csv",

  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  bmp: "image",
  ico: "image",
};

function getIconType(mimeType, ext) {
  if (!ext && !mimeType) return "generic";

  const cleanExt = ext?.replace(".", "").toLowerCase();
  if (cleanExt && extensionMap[cleanExt]) return extensionMap[cleanExt];

  if (!mimeType) return "generic";
  const mime = mimeType.toLowerCase();

  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("word") || mime.includes("document")) return "word";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "excel";
  if (mime.includes("presentation") || mime.includes("powerpoint"))
    return "powerpoint";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("archive"))
    return "archive";
  if (mime.includes("json") || mime.includes("xml")) return "code";
  if (mime === "text/csv") return "csv";
  if (mime.startsWith("text/")) return "text";

  return "generic";
}

export function getFileIcon(mimeType, extension, className = "w-5 h-5") {
  const type = getIconType(mimeType, extension);

  if (type === "generic") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6z"
          fill="#E8F0FE"
          stroke="#4285F4"
          strokeWidth="1.5"
        />
        <path d="M14 2v6h6" fill="#4285F4" fillOpacity="0.3" />
      </svg>
    );
  }

  const { color, icon } = icons[type];
  return (
    <FileIcon color={color} className={className}>
      {icon}
    </FileIcon>
  );
}
