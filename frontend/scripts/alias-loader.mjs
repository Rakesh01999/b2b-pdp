/**
 * Resolves the project's `@/*` path alias and extensionless imports for plain
 * `node` runs.
 *
 * Next and `tsc` both read the alias out of tsconfig and both allow
 * extensionless module specifiers; Node does neither. Rather than change the
 * source imports just so the tests can load them, this hook teaches Node the
 * same two rules. Registered via `scripts/run-tests.mjs`.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), '..', 'src');

/** Adds `.ts`, or `/index.ts`, when the specifier omits the extension. */
function withExtension(absolute) {
  if (existsSync(absolute)) return absolute;
  for (const candidate of [`${absolute}.ts`, `${absolute}.tsx`, resolvePath(absolute, 'index.ts')]) {
    if (existsSync(candidate)) return candidate;
  }
  return absolute;
}

export function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const absolute = withExtension(resolvePath(SRC, specifier.slice(2)));
    return next(pathToFileURL(absolute).href, context);
  }

  // Relative imports inside the source tree are extensionless too.
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    if (context.parentURL?.startsWith('file:')) {
      const from = dirname(fileURLToPath(context.parentURL));
      const absolute = withExtension(resolvePath(from, specifier));
      return next(pathToFileURL(absolute).href, context);
    }
  }

  return next(specifier, context);
}
