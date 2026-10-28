import type { SVGProps } from 'react'

export type IconName =
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'home'
  | 'sliders'
  | 'book'
  | 'chart'
  | 'settings'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-right'
  | 'chevron-down'
  | 'check'
  | 'x'
  | 'plus'
  | 'minus'
  | 'flame'
  | 'clock'
  | 'target'
  | 'layers'
  | 'refresh'
  | 'play'
  | 'eye'
  | 'edit'
  | 'star'
  | 'bookmark'
  | 'filter'
  | 'search'
  | 'download'
  | 'upload'
  | 'trash'
  | 'info'
  | 'alert'
  | 'lightbulb'
  | 'keyboard'
  | 'list'
  | 'grid'
  | 'route'
  | 'flag'
  | 'graduation'
  | 'external'
  | 'sparkles'
  | 'circle-help'
  | 'lock'
  | 'chevron-left'

const paths: Record<IconName, React.ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.42-1.42" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  home: <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M9 21v-8h6v8" />,
  sliders: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="2" fill="var(--surface)" />
      <circle cx="15" cy="12" r="2" fill="var(--surface)" />
      <circle cx="7" cy="18" r="2" fill="var(--surface)" />
    </>
  ),
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V5a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 5.5v14Z M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.7 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.7a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.3 9v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
    </>
  ),
  'arrow-left': <path d="M19 12H5M12 19l-7-7 7-7" />,
  'arrow-right': <path d="M5 12h14M12 5l7 7-7 7" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  flame: <path d="M12 22c4 0 7-3 7-7 0-3-2-5-3.5-6.5C14 7 13 5 13 2c0 0-4 3-4 7 0 1.5.5 2.5 1 3.5-1.5-.5-2-2-2-3.5C6 11 5 13 5 15c0 4 3 7 7 7Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  layers: <path d="m12 2 9 5-9 5-9-5 9-5Z M3 12l9 5 9-5 M3 17l9 5 9-5" />,
  refresh: <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />,
  play: <path d="m7 4 13 8-13 8V4Z" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />,
  star: <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.3l6.5-.9L12 2.5Z" />,
  bookmark: <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />,
  filter: <path d="M4 4h16l-6 8v6l-4 2v-8L4 4Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  download: <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />,
  upload: <path d="M12 21V9M7 14l5-5 5 5M4 3h16" />,
  trash: <path d="M3 6h18M8 6V3h8v3M19 6l-1 15H6L5 6M10 11v6M14 11v6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  alert: <path d="M12 3 2 21h20L12 3ZM12 9v5M12 18h.01" />,
  lightbulb: <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />,
  keyboard: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h6a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h7" />
    </>
  ),
  flag: <path d="M5 22V3M5 4h11l-2 4 2 4H5" />,
  graduation: <path d="M2 9l10-5 10 5-10 5L2 9ZM6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />,
  external: <path d="M15 3h6v6M10 14 21 3M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" />,
  sparkles: <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3ZM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />,
  'circle-help': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 1 1 4.4 2.7c-.9.5-1.5 1.2-1.5 2.3M12 17h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
}

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.8,
  ...rest
}: { name: IconName; size?: number; className?: string; strokeWidth?: number } & Omit<
  SVGProps<SVGSVGElement>,
  'name' | 'className' | 'width' | 'height'
>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === 'star' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
