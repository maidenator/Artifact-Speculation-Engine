## Artifact Speculation Engine

**An artifact domain simulator that uses a Monte Carlo engine to simulate game accurate artifact runs.**
___

# TODO: Artifact Speculation Engine

## P0: Critical

**Hunt List correctness** (`useSimulationWorkers.ts`, `artifact_interface.hpp`)
- [X] Remove the cap of 20 results so all simulated artifacts are checked
- [X] Remove the duplicate 50% set roll in JS, so the set chance is applied once
- [X] Fix "set chosen, Domain = Any" so those items can be found
- [X] Record resin spent at the moment each item is found, not the batch total
- [X] Move hunt matching into the C++ engine
- [X] Add regression tests for each of the four hunt bugs

**Font bundle size** (`src/index.css:3-9`)
- [X] Subset the 7.2 MB CJK TTF to the Latin and UI glyphs actually used
- [X] Convert the subset to WOFF2 (target: 30–80 kB)

## P1: High

**Worker architecture**
- [ ] Add request IDs and an error path to worker messages, so promises settle on `ERROR`
- [ ] Create one shared worker pool at module level instead of one per component
- [ ] Start workers lazily on first run, and cap them at `min(hardwareConcurrency - 1, 8)`
- [ ] Stop the Sandbox from starting a second worker set
- [ ] Fix Target mode so it doesn't sum spent resin across failed workers
- [ ] Split **trials** across workers, not the budget
- [ ] Report success probability and percentiles (p50, p90) instead of a single draw
- [ ] Add a cancel button that terminates and respawns the worker

**Statistics and game data**
- [X] Remove the dead `while (remainingBudget > 0)` loop
- [X] Use the existing named constants (`FOUR_LINER_CHANCE`, `DOUBLE_5_STAR_CHANCE`, `RESIN_PER_RUN`) instead of magic numbers
- [ ] Export game constants from WASM, or generate a shared `game-data.json`, so the C++ and TS copies can't drift

**Security**
- [ ] Replace the public CORS proxy (`codetabs`) with a server-side function that validates the UID and sets a User-Agent
- [ ] Validate the UID on the client with `/^\d{9,10}$/` before sending
- [ ] Narrow the wildcard rewrites in `vercel.json` to specific image paths
- [ ] Remove unused COOP/COEP headers and add CSP, `X-Content-Type-Options`, and `Referrer-Policy`

**Testing and CI**
- [ ] Add a frontend job to CI, and widen the workflow triggers beyond `cpp/**`
- [ ] Move orchestration logic into pure functions (`splitTrials`, `aggregate`, `matchesHuntItem`) and unit-test them
- [ ] Add a contract test that parses `serializeSummaryJson` output in TS
- [ ] Add a Playwright smoke test: load → "Engine ready" → run → cards appear

**Accessibility and mobile**
- [ ] Make the strongbox checkbox keyboard-reachable (`sr-only peer` pattern instead of `display:none`)
- [ ] Convert modals to proper dialogs (Headless UI `Dialog`), with focus trap and Escape to close
- [ ] Stop backdrop clicks from saving the hunt item
- [ ] Fix the viewport meta tag (`width=device-width, initial-scale=1`)

**Tooling**
- [ ] Install the missing ESLint packages, fix the 22 reported problems, and add a `lint` script
- [ ] Move the WASM build into CI so the committed `.wasm` always matches the source

## P2: Medium

**Performance**
- [ ] Rebuild WASM with `-O3 -flto -DNDEBUG -fwasm-exceptions`, without `-profiling`
- [X] Remove the stale `public/artifact_engine.wasm` and `public/wasm/*` files
- [ ] Remove the 22 preload tags, and self-host the card background image
- [ ] Lazy-load `UIDImport` and `ArtifactSandbox` with `React.lazy`
- [ ] Replace the font-shrinking loop with CSS `clamp()` and container queries
- [ ] Stop generating IDs in the hot loop; only generate them in batch and sandbox paths
- [ ] Use an early-return check in `updateReservoir` to avoid copies and full sorts

**Code quality**
- [ ] Turn on `strict: true` (0 errors today)
- [ ] Replace `any` in `WorkerMessageData`, `enka.ts`, and `setId` with discriminated unions and a schema
- [ ] Tighten `ArtifactOutput` to use `SlotId` / `StatId`
- [ ] Key stat icons by stat ID instead of display name
- [X] Extract the artifact-to-JSON serializer, which is duplicated three times
- [ ] Extract shared UI pieces: `ArtifactIcon`, `ScoreModeToggle`, `useDraggable`, a skeleton card
- [ ] Move `setState` calls out of `setArtifacts` updaters in `ArtifactSandbox`, and clear animation timers on unmount
- [ ] Fix the GOOD export to write the real `setKey` instead of always `GladiatorsFinale`

**Validation and reliability**
- [ ] Range-check enums in `serializer.hpp`
- [ ] Clamp `resinBudget` in both UI and C++, and use `int64_t` counters
- [ ] Guard `TargetGoal` against `resinBudget <= 0`
- [ ] Add an error boundary
- [ ] Show runtime errors as runtime errors, not "failed to load"
- [ ] Mount `@vercel/analytics` and log WASM init time and run duration

**Dependencies and build**
- [ ] Upgrade vite 5 → current and vitest 2 → current (clears the critical and high audit findings)
- [ ] Remove `legacy-peer-deps=true` and fix the peer conflicts
- [ ] Remove unused packages: `ts-morph`, `lucide-react`, and the packages used only by the dead `ui/button.tsx`
- [ ] Add `URL_HASH SHA256` to the `nlohmann_json` FetchContent, and pin Catch2 to a commit
- [ ] Delete the duplicate vendored `cpp/nlohmann/json.hpp`
- [ ] Enable `-Wall -Wextra -Wconversion -Werror` for tests, and fix the 76 warnings
- [ ] Add an ASan/UBSan CI job

**Accessibility**
- [ ] Fix light-mode contrast: `--muted` (3.25:1), `--gold` headings (2.51:1), `--ok` (3.09:1)
- [ ] Remove `text-muted/50`
- [ ] Replace hardcoded dark colors (`#121620`, `#0f172a`) with tokens

## P3: Low

- [ ] Replace the `<div>` hunt cards with buttons; make the delete button visible on focus and give it a label
- [ ] Add `aria-label` and `aria-expanded` to the ActionBar chevron
- [ ] Add `aria-current="page"` to the active SideNav item, and show labels on focus
- [ ] Add `aria-busy` to the results region while simulating
- [ ] Add hash routing or `react-router` for deep links and working back navigation
- [ ] Persist the hunt list and settings with zustand's `persist` middleware
- [ ] Remove `UIDImport`'s bundle footprint once it's lazy-loaded (`characters.json`, 50 kB)
- [ ] SEO: add `meta description`, absolute `og:image`, `twitter:card`, canonical link, `robots.txt`, and per-page titles
- [ ] Delete dead files: `SpeculatorConfig.tsx`, `ui/button.tsx`, `lib/utils.ts`, `src/scratch/*.cjs`, the duplicate worker under `src/workers/src/...`, and the 0-byte JSON files
- [ ] Remove unused C++ config fields (`minRollValue`, `prioritySubstats`, `minPriorityRolls`) and the unused `score` parameter
- [ ] Fix the Lemire rejection to use the full 64 bits
- [ ] Fix the "SplitMix65" comment, or implement the real SplitMix64 seeding
- [ ] Replace `__uint128_t` with a portable 128-bit multiply for MSVC
- [ ] Store the tier index for accumulated rolls instead of rounded values
- [ ] Set `permissions: contents: read` in GitHub Actions and pin `actions/checkout` to a SHA
- [ ] Add Prettier, clang-format, `lint-staged`, and an `.editorconfig`
- [ ] Add a `test:cpp` script and build/run instructions to the README