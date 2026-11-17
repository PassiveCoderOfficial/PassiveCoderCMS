/**
 * "server-only" is not an installed package: Next's bundler supplies it. Tests
 * that load code importing it (layout-lock, site-chat training...) import
 * this file first, the same trick tests/platform/pm-test-env.ts uses.
 */
const loader = require("node:module") as { _load: (request: string, ...rest: unknown[]) => unknown };
const load = loader._load;
loader._load = (request: string, ...rest: unknown[]) => (request === "server-only" ? {} : load(request, ...rest));

export {};
