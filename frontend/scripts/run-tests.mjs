/**
 * Test entry point: registers the path-alias hook, then runs the assertions.
 *
 * `node scripts/run-tests.mjs` — no framework, no build step. Node strips the
 * TypeScript annotations from the imported modules itself.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./alias-loader.mjs', pathToFileURL(import.meta.filename));
await import('./test-pricing.mjs');
