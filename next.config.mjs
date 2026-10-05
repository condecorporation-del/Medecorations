import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

export default function config(phase) {
  return {
    // A production build must never overwrite the live preview's CSS or chunks.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  };
}
