// Loads Bun's ambient types (incl. the "bun:test" module) for `tsc --noEmit`.
// @types/bun re-exports these via `/// <reference types="bun-types" />`, but
// TypeScript 6 no longer resolves that indirect types-reference for a package
// living at node_modules/bun-types (not under @types/), so reference it by path.
/// <reference path="./node_modules/bun-types/index.d.ts" />
