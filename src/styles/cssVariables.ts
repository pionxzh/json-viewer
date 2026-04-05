import type { Colorspace } from '../theme/base16'

/**
 * Generates CSS custom properties object from a Base16 colorspace for inline styles
 */
export function generateCSSVariables (colorspace: Colorspace): Record<string, string> {
  return Object.entries(colorspace).reduce((acc, [key, value]) => {
    if (key !== 'author') {
      acc[`--jv-${key}`] = value
    }
    return acc
  }, {} as Record<string, string>)
}
