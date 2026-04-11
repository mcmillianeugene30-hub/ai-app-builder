# Project Guidance

## User Preferences

[No preferences yet]

## Verified Commands

**Frontend** (run from `src/frontend/`):

- **install**: `pnpm install --prefer-offline`
- **typecheck**: `pnpm typecheck`
- **lint fix**: `pnpm fix`
- **build**: `pnpm build`

**Backend** (run from project root `/`):

- **install**: `mops install`
- **typecheck**: `mops check --fix`
- **build**: `mops build`

**Backend and frontend integration** (run from root):

- **generate bindings**: `pnpm bindgen` This step is necessary to ensure the frontend can call the backend methods.

## Learnings

- Motoko does not support `#=` compound text concatenation — use `result := result # "..."` instead
- Character literal `'"'` and `'\\'` cause M0002 "malformed operator" in Motoko — use `Char.toNat32(c) == 34` (for `"`) and `== 92` (for `\`) comparisons instead
- `mops.toml` is at the project root; run `mops check --fix` and `mops build` from the project root, not from `src/backend/` — otherwise `--actor-idl` path resolution fails for packages like `caffeineai-http-outcalls`
