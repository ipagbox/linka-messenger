export const tokens = {
  colors: {
    bg: {
      primary: '#0a0a0c',
      secondary: '#131318',
      tertiary: '#1c1c24',
      hover: '#24242e',
    },
    text: {
      primary: '#e4e4e8',
      secondary: '#9494a0',
      muted: '#5c5c68',
    },
    accent: {
      primary: '#6366f1',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    border: {
      default: '#2a2a36',
      focus: '#6366f1',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  font: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    size: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '24px',
    },
    weight: {
      normal: '400',
      medium: '500',
      semibold: '600',
    },
  },
  transition: {
    fast: '120ms ease',
    normal: '200ms ease',
  },
} as const
