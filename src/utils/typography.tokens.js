// typography.tokens.ts
// Typography design tokens based on Apple Human Interface Guidelines

export const typographyTokens = {
  fontFamily: {
    primary: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
  },

  fontSizes: {
    ios: {
      default: '17px',
      min: '11px',
    },
    macos: {
      default: '13px',
      min: '10px',
    },
    tvos: {
      default: '29px',
      min: '23px',
    },
    visionos: {
      default: '17px',
      min: '12px',
    },
    watchos: {
      default: '16px',
      min: '12px',
    },
  },

  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    title: 1.2,
    subtitle: 1.3,
    body: 1.5,
    callout: 1.4,
    caption: 1.4,
    footnote: 1.4,
  },

  variants: {
    title: {
      fontSize: '1.5rem', // 24px at 16px base
      fontWeight: 700,
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.3,
    },
    body: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    callout: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: 1.4,
    },
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
      lineHeight: 1.4,
    },
    footnote: {
      fontSize: '0.6875rem', // 11px
      fontWeight: 400,
      lineHeight: 1.4,
    },
  },
};