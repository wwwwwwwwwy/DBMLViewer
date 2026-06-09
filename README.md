# DBML Diagram

Fully frontend DBML visualization tool. It imports or edits DBML in the browser,
normalizes the parsed database model, and renders an ERD-style graph with React
Flow.

## Features

- Import `.dbml` files or paste/edit DBML directly.
- Parse DBML in the browser with `@dbml/core`.
- Preserve the last successful diagram when parsing fails.
- Render tables, columns, indexes, enums, and relations as a graph.
- Select tables or relations to inspect details.
- Search tables and columns.
- Auto-layout the diagram with ELK.
- Persist DBML source and manually moved node positions in IndexedDB.
- Export the visible diagram as PNG or SVG.
- Copy DBML source or normalized JSON.

## Stack

- Vite 5 + React 18 + TypeScript
- `@dbml/core` for DBML parsing
- `@xyflow/react` for graph rendering
- `elkjs` for layout
- Monaco Editor for DBML editing
- Zustand + Dexie for local state and IndexedDB persistence
- Vitest + Testing Library for tests

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run lint
npm run build
```

## Notes

- The project is intentionally frontend-only: no login, backend, or cloud sync.
- Node 18 is supported by pinning the Vite toolchain to versions compatible with
  this workspace.
- Production build currently emits a large JS bundle because Monaco Editor and
  DBML parsing are browser-side dependencies. A later optimization pass can split
  Monaco and parser code with dynamic imports.
- `elkjs` uses EPL-2.0 licensing. If the deployment target requires all-MIT
  dependencies, replace it with `@dagrejs/dagre`.
