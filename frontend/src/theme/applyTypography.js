import { Typography } from './typography';

const TYPOGRAPHY_VARIANTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'subtitle1',
  'subtitle2',
  'body1',
  'body2',
  'button',
  'caption',
  'overline',
];

export function applyTypography(root = document.documentElement) {
  if (!root) return;

  root.style.setProperty('--font-sans', `'${Typography.fontFamily}', 'Inter', system-ui, sans-serif`);

  TYPOGRAPHY_VARIANTS.forEach((variant) => {
    const values = Typography[variant];
    if (!values) return;

    root.style.setProperty(`--type-${variant}-font-size`, values.fontSize);
    root.style.setProperty(`--type-${variant}-font-weight`, String(values.fontWeight));
    root.style.setProperty(`--type-${variant}-line-height`, values.lineHeight);
    root.style.setProperty(`--type-${variant}-letter-spacing`, values.letterSpacing);

    if (values.textTransform) {
      root.style.setProperty(`--type-${variant}-text-transform`, values.textTransform);
    }
  });
}

