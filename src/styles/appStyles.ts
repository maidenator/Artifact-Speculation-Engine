export const APP_CSS = `
/* =========================================
   01. VARIABLES & THEMING
   Controls the global color palette.
   ========================================= */
:root {
  color-scheme: light dark;
  --page: #f0ebd8;
  --card: #ffffff;
  --ink: #3a3f4a;
  --muted: #798290;
  --line: #d2c8b4;
  --accent: #d3a352;
  --on-accent: #211c14;
  --ok: #65a30d;
  --bad: #dc2626;
  --gold: #d89643;
  --cyan: #0d9488;
  --card-inner: #f9f8f3;
}

@media (prefers-color-scheme: dark) {
  :root {
    --page: #121620;
    --card: #1c2232;
    --ink: #ece5d8;
    --muted: #94a3b8;
    --line: #2f384f;
    --accent: #d3a352;
    --on-accent: #211c14;
    --ok: #4ade80;
    --bad: #ff5277;
    --gold: #e4b76a;
    --cyan: #4ce7cc;
    --card-inner: #161a27;
  }
}

/* =========================================
   02. GLOBAL STYLES & TYPOGRAPHY
   Base app sizing, fonts, and layout.
   ========================================= */
html { zoom: 1.2; }
html,
body {
  margin: 0;
  background: var(--page);
  color: var(--ink);
}

.app * {
  box-sizing: border-box;
}

/* Utility class to force Genshin font anywhere */
.font-genshin {
  font-family: "GenshinFont", "HYWenHei", system-ui, -apple-system, sans-serif;
  transform: translateZ(0); 
}

/* Main app wrapper */
.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 36px 20px 72px; /* Kept for mobile */
  min-height: 100vh;
  box-sizing: border-box;
  font: 15px / 1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
}

/* Header Wrapper (Mobile defaults) */
.sticky-header {
  position: relative;
  top: auto;
  background: var(--page); 
  z-index: 100;
  padding: 36px 0 16px; 
  margin-bottom: 12px;
}

/* Base Headings */
.app h1, 
.app h2, 
.app h3 {
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif;
  color: var(--gold);
  letter-spacing: 0.5px;
}

.app h1 { font-size: 28px; line-height: 1.2; margin: 0 0 6px; }
.app h2 { font-size: 18px; margin: 0 0 14px; }
.app h3 { font-size: 16px; margin: 22px 0 10px; }

/* Subtitle text under the main AppHeader */
.lede {
  margin: 0 0 10px;
  color: var(--muted);
  max-width: 60ch;
}

/* Helper text below form fields */
.hint {
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif !important;
  margin: 5px 0 0;
  font-size: 12.5px;
  color: var(--muted);
  letter-spacing: 0.3px;
}

/* =========================================
   03. LAYOUT & CONTAINERS
   Main structural boxes for settings.
   ========================================= */
/* The main panels containing forms/results */
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* Two-column grid layout */
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

/* Desktop layout rules */
@media (min-width: 1024px) {
  body {
    overflow: auto; /* Allows the main page to scroll naturally */
  }

  .app {
    height: auto; /* Removes the fixed 100vh lock so the page expands */
    min-height: 100vh;
  }

  .layout {
    grid-template-columns: 420px 1fr;
    height: auto; /* Lets the layout fit the natural content height */
  }
  
  .sidebar {
    height: auto;
    max-height: calc(100vh - 72px);
    overflow-y: auto; /* Scrolls internally only when the sidebar content is taller than the screen */
  }

  main {
    height: auto;
    overflow: visible; /* Lets results flow naturally with the page */
  }
}

/* Form field column layout */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 18px;
  margin-bottom: 6px;
}

/* Advanced Substat details section */
.advanced {
  margin-top: 16px;
  border-top: 1px solid var(--line);
  padding-top: 12px;
}
.advanced summary {
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}
.weights {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  margin-top: 14px;
}


/* =========================================
   04. FORM ELEMENTS (NATIVE)
   Inputs, standard selects, and checkboxes.
   ========================================= */
.field label {
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif !important;
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}

/* Number inputs (Resin, Top K, Min CV) */
.app input[type="number"] {
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif !important;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  width: 100%;
  padding: 8px 12px;
  color: inherit;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--line);
  border-radius: 6px;
}

/* Standard native selects (if any remain) */
.app select,
.app option {
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif !important;
  letter-spacing: 0.3px;
  font-weight: 500;
}

/* Checkbox container (Use Strongbox) */
.check {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 14px;
  cursor: pointer;
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif;
  letter-spacing: 0.3px;
}
.check input { margin-top: 4px; }
.check small {
  display: block;
  color: var(--muted);
  font-size: 12.5px;
  margin-top: 2px;
}

/* Global focus state for all interactables (Single gold line) */
.app input:focus-visible,
.app select:focus-visible,
.app button:focus-visible,
.app summary:focus-visible,
.custom-select-trigger:focus-visible {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 1px var(--gold);
}

/* Input boxes with internal icons (e.g. Resin Moon icon) */
.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.input-with-icon .field-icon {
  position: absolute;
  left: 8px;
  width: 24px;
  height: 24px;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}
.input-with-icon input {
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif !important;
  font-size: 18px;
  width: 100%;
  padding-left: 38px !important;
  font-weight: 600;
  letter-spacing: 0.5px;
}


/* =========================================
   05. CUSTOM SELECT COMPONENT
   The Genshin-themed dropdown box.
   ========================================= */
.custom-select-container {
  position: relative;
  width: 100%;
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif;
}

/* The visible dropdown button */
.custom-select-trigger {
  width: 100%;
  padding: 8px 12px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  color: inherit;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--line);
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: border-color 0.15s ease;
}

.chevron {
  width: 16px;
  height: 16px;
  color: var(--muted);
  transition: transform 0.2s ease;
}
.chevron.open {
  transform: rotate(180deg);
}

/* The floating menu */
.custom-select-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--card-inner);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 50; 
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Individual options within the menu */
.custom-select-option {
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  border-radius: 4px;
  transition: all 0.15s ease;
}
.custom-select-option:hover {
  background: rgba(228, 183, 106, 0.1);
  color: var(--gold);
}
.custom-select-option.selected {
  background: rgba(228, 183, 106, 0.15);
  color: var(--gold);
  font-weight: 600;
}


/* =========================================
   06. BUTTONS & ACTIONS
   Run buttons, Reset buttons, and toggles.
   ========================================= */
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 8px 0 20px;
}

/* Force all buttons to use custom font */
.app button {
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif !important;
  letter-spacing: 0.5px;
}
.app button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

/* Main "Run Simulation" Button */
.primary {
  padding: 10px 28px;
  font: inherit;
  font-weight: 700;
  color: #211c14;
  background: linear-gradient(180deg, #d3a352 0%, #b88636 100%);
  border: 1px solid #ffd780;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(184, 134, 54, 0.3);
  transition: filter 0.15s ease, transform 0.1s ease;
}
.primary:hover:not(:disabled) {
  filter: brightness(1.15);
  transform: translateY(-1px);
}
.primary:active:not(:disabled) {
  transform: translateY(1px);
}

/* Secondary "Reset Settings" Button */
.ghost {
  padding: 10px 14px;
  font: inherit;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
  border: 1px solid transparent; 
  border-radius: 999px;
  transition: all 0.15s ease;
}
.ghost:hover:not(:disabled) {
  color: #ff5c5c !important; 
  border-color: #ff5c5c !important; 
  background: rgba(255, 92, 92, 0.1) !important;
}

/* Toggle Buttons (CV vs RV selector in Results) */
.toggle {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 999px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.15);
}
.toggle button {
  padding: 4px 14px;
  font: inherit;
  font-size: 12.5px;
  color: var(--muted);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.toggle button:hover {
  color: var(--gold);
}
.toggle button[aria-pressed="true"] {
  color: #121620;
  background: var(--cyan);
  font-weight: 600;
}


/* =========================================
   07. CHIPS & STATUS INDICATORS
   Substat priority chips, Loading states, Badges.
   ========================================= */
.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 22px;
  font-size: 13px;
  color: var(--muted);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--muted);
}
.status.ok .dot { background: var(--ok); }
.status.bad { color: var(--bad); }
.status.bad .dot { background: var(--bad); }

.error {
  padding: 10px 14px;
  margin: 0 0 16px;
  color: var(--bad);
  border: 1px solid var(--bad);
  border-radius: 6px;
}

/* Badge shown in results (e.g. "Goal Reached") */
.badge {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border: 1px solid currentColor;
  border-radius: 999px;
}
.badge.ok { color: var(--ok); }
.badge.bad { color: var(--bad); }

/* Substat selection layout */
.pick-label {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--muted);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.chip {
  padding: 4px 12px;
  font: inherit;
  font-size: 12.5px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.chip:hover {
  border-color: var(--gold);
  color: var(--gold);
}

/* State when a substat is selected */
.chip.picked {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(228, 183, 106, 0.15);
}

/* The number indicator inside a selected chip */
.chip-rank {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--gold);
  color: var(--page);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding-top: 2px;
}


/* =========================================
   08. RESULTS & STATS BOARD
   The summary data shown after running.
   ========================================= */

/* 1. Locks the outer card to fill the screen without moving */
.card.results {
  padding: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; 
  overflow: hidden; 
}

/* 2. The header stays pinned naturally */
.sticky-results-header {
  background: var(--card); 
  z-index: 10;
  padding: 20px 20px 12px 20px; 
  border-bottom: 1px solid var(--line); 
  flex-shrink: 0; 
}

/* Padding fix if 0 artifacts match */
.card.results > .hint {
  padding: 20px;
}

.results-head, .pieces-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.results-head h2, .pieces-head h3 {
  margin: 0;
}
.pieces-head {
  margin: 16px 0 0;
}

/* Main summary text (e.g. "Spending X resin got you...") */
.summary {
  margin: 12px 0 16px;
  font-size: 16px;
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif;
  letter-spacing: 0.3px;
}

/* Grid holding domain runs, strongbox stats, etc. */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin: 0;
}
.stats div {
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.stats dt {
  font-size: 12.5px;
  color: var(--muted);
}
.stats dd {
  margin: 0;
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif;
  font-size: 22px;
  font-weight: 650;
  letter-spacing: 0.5px;
}

/* 3. ONLY the artifacts area is allowed to scroll - Single Unified Definition */
.artifacts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  grid-auto-rows: max-content;
  align-content: start; 
  gap: 16px;
  
  padding: 20px 20px 40px 20px; 
  
  /* Sets a clean maximum height so it triggers internal scrolling */
  max-height: 650px; 
  overflow-y: auto; 
}


/* =========================================
   09. ARTIFACT CARDS
   In-game style 5-star artifact visuals.
   ========================================= */
.artifact {
  background: var(--card-inner);
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  height: max-content;

  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.artifact:hover {
  transform: translateY(-2px);
}

/* Top bar (5-Star Orange Gradient) */
.artifact header {
  background: linear-gradient(135deg, #a75727 0%, #d89643 100%);
  padding: 6px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  border-bottom: 2px solid #eab05f;
  gap: 6px;
}

.rank {
  background: rgba(0, 0, 0, 0.35);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11.5px;
  font-weight: bold;
  color: #fff;
}
.level {
  background: #1e2330;
  color: var(--gold);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid var(--gold);
  margin-left: auto;
}

/* Slot icon within the card header */
.slot-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}
.slot-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

/* Main Stat display */
.main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 16px 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif;
}
.main span {
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.main strong {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); 
}

/* Substat lines */
.artifact ul {
  list-style: none;
  margin: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: "GenshinFont", "HYWenHei", system-ui, sans-serif;
  font-size: 12px;
  letter-spacing: 0.3px;
  font-weight: normal !important; 
  transform: translateZ(0); 
}
.artifact li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1px 0;
  color: #ece5d8;
}

/* Roll count indicators (+1, +2) */
.artifact li i {
  font-style: normal;
  color: var(--cyan);
  letter-spacing: 2px;
  margin-left: 6px;
}

/* Artifact Footer */
.artifact footer {
  display: flex;
  justify-content: space-between;
  margin: auto 8px 8px 8px; 
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--line);
  border-radius: 6px; 
}

/* Tier Colors */
.cv-max strong { color: var(--bad); }
footer.cv-max { border-color: var(--bad); }

.cv-top strong { color: var(--gold); }
footer.cv-top { border-color: var(--gold); }

.cv-high strong { color: var(--ok); }
footer.cv-high { border-color: var(--ok); }

.cv-mid strong { color: var(--cyan); }
footer.cv-mid { border-color: var(--cyan); }

.cv-low strong { color: var(--muted); }
footer.cv-low { border-color: var(--line); }

/* Individual Roll Quality Dots */
.roll-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  background: currentColor;
}

/* Roll Tier Colors */
.tier-max { color: var(--bad); } 
.tier-high { color: var(--gold); }
.tier-mid { color: var(--ok); }  
.tier-low { color: var(--cyan); }
.tier-min { color: var(--muted); }

/* Solid gold custom scrollbar */
.card.results .artifacts::-webkit-scrollbar {
  width: 16px !important;
  display: block !important;
}

.card.results .artifacts::-webkit-scrollbar-track {
  background: rgba(18, 22, 32, 0.6) !important;
  border-radius: 8px !important;
}

.card.results .artifacts::-webkit-scrollbar-thumb {
  background-color: #d89643 !important; /* Solid Genshin gold */
  border-radius: 8px !important;
  /* Creates clean padding inside the track without ghost outlines */
  border: 4px solid transparent !important;
  background-clip: padding-box !important;
}

.card.results .artifacts::-webkit-scrollbar-thumb:hover {
  background-color: #e4b76a !important; /* Solid lighter gold on hover */
  background-clip: padding-box !important;
}
`