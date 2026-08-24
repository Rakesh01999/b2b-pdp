import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * Flat config, using the native exports from `eslint-config-next`.
 *
 * Next 16 ships these as flat configs already; routing them through
 * `FlatCompat` (the Next 15 pattern) makes the eslintrc bridge try to
 * JSON-stringify the React plugin and die on a circular reference.
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ['.next/**', 'node_modules/**', 'scripts/**', 'public/**'],
  },
];

export default config;
