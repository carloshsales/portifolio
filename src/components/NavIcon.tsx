export type NavIconName = 'inicio' | 'projetos' | 'jogos' | 'artigos' | 'experimentos' | 'contato'

type NavIconProps = {
  name: NavIconName
}

export default function NavIcon({ name }: NavIconProps) {
  const props = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const

  switch (name) {
    case 'inicio':
      return (
        <svg {...props}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      )
    case 'projetos':
      return (
        <svg {...props}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      )
    case 'jogos':
      return (
        <svg {...props}>
          <rect x="2" y="8" width="20" height="9" rx="4" />
          <path d="M7 11.5v3M5.5 13h3" />
          <circle cx="16" cy="11.5" r="0.6" />
          <circle cx="18.5" cy="13.5" r="0.6" />
        </svg>
      )
    case 'artigos':
      return (
        <svg {...props}>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4" />
          <path d="M9 12h6M9 16h6" />
        </svg>
      )
    case 'experimentos':
      return (
        <svg {...props}>
          <path d="M9 3h6" />
          <path d="M10 3v6L5 19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2L14 9V3" />
          <path d="M7.5 15h9" />
        </svg>
      )
    case 'contato':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      )
  }
}
