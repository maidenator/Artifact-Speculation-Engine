export const APP_CSS = `
:root{color-scheme:light dark;--page:#eceff3;--card:#fff;--ink:#181b21;--muted:#5d6572;--line:#d9dee5;--accent:#0f766e;--on-accent:#fff;--ok:#15803d;--bad:#b42318;--gold:#b7791f}
@media(prefers-color-scheme:dark){:root{--page:#111418;--card:#1b1f26;--ink:#e8eaee;--muted:#98a1ae;--line:#2c333d;--accent:#2dd4bf;--on-accent:#06201d;--ok:#4ade80;--bad:#f87171;--gold:#fbbf24}}
html,body{margin:0;background:var(--page);color:var(--ink)}
.app{max-width:900px;margin:0 auto;padding:36px 20px 72px;min-height:100vh;box-sizing:border-box;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.app *{box-sizing:border-box}
.app h1{font-size:28px;line-height:1.2;margin:0 0 6px}
.app h2{font-size:18px;margin:0 0 14px}
.app h3{font-size:16px;margin:22px 0 10px}
.lede{margin:0 0 10px;color:var(--muted);max-width:60ch}
.status{display:inline-flex;align-items:center;gap:8px;margin:0 0 22px;font-size:13px;color:var(--muted)}
.dot{width:8px;height:8px;border-radius:50%;background:var(--muted)}
.status.ok .dot{background:var(--ok)}.status.bad{color:var(--bad)}.status.bad .dot{background:var(--bad)}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px;margin-bottom:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px;margin-bottom:6px}
.field label{display:block;font-size:13px;font-weight:600;margin-bottom:5px}
.app input[type=number],.app select{width:100%;padding:8px 10px;font:inherit;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:6px}
.app input:focus-visible,.app select:focus-visible,.app button:focus-visible,.app summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.hint{margin:5px 0 0;font-size:12.5px;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.chip{padding:3px 10px;font:inherit;font-size:12.5px;color:inherit;background:transparent;border:1px solid var(--line);border-radius:999px;cursor:pointer}
.chip:hover{border-color:var(--accent);color:var(--accent)}
.chip.picked{border-color:var(--accent);color:var(--accent)}
.chip-rank{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 4px 2px;font-size:11.5px;font-weight:700;line-height:1;color:var(--on-accent);background:var(--accent);border-radius:999px}
.pick-label{margin:16px 0 0;font-size:13px;color:var(--muted)}
.check{display:flex;gap:10px;align-items:flex-start;margin-top:14px;cursor:pointer}
.check input{margin-top:4px}.check small{display:block;color:var(--muted);font-size:12.5px}
.advanced{margin-top:16px;border-top:1px solid var(--line);padding-top:12px}
.advanced summary{cursor:pointer;font-weight:600;font-size:14px}
.weights{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-top:14px}
.actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:4px 0 20px}
.primary{padding:10px 26px;font:inherit;font-weight:600;color:var(--on-accent);background:var(--accent);border:0;border-radius:6px;cursor:pointer}
.ghost{padding:10px 14px;font:inherit;color:var(--muted);background:transparent;border:0;cursor:pointer}
.app button:disabled{opacity:.5;cursor:not-allowed}
.error{padding:10px 14px;margin:0 0 16px;color:var(--bad);border:1px solid var(--bad);border-radius:6px}
.results-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.results-head h2{margin:0}
.badge{font-size:13px;font-weight:600;padding:2px 10px;border:1px solid currentColor;border-radius:999px}
.badge.ok{color:var(--ok)}.badge.bad{color:var(--bad)}
.summary{margin:12px 0 16px;font-size:16px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:0}
.stats div{padding:10px 12px;border:1px solid var(--line);border-radius:8px}
.stats dt{font-size:12.5px;color:var(--muted)}.stats dd{margin:0;font-size:20px;font-weight:650}
.artifacts{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.artifact{border:1px solid var(--line);border-top:3px solid var(--gold);border-radius:8px;padding:12px 14px}
.artifact header{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}
.rank{font-size:12.5px;color:var(--muted)}.level{margin-left:auto;color:var(--gold);font-weight:650}
.main{display:flex;justify-content:space-between;margin:0 0 8px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.artifact ul{list-style:none;margin:0;padding:0;font-size:13.5px}
.artifact li{display:flex;justify-content:space-between;padding:1px 0}
.artifact li i{font-style:normal;color:var(--gold);letter-spacing:1px}
.artifact footer{display:flex;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid var(--line)}
.cv-max strong{color:var(--bad)}
.artifact.card-cv-max{border-color:var(--bad)}
.artifact.card-cv-top{border-color:var(--gold)}
.artifact.card-cv-high{border-color:var(--ok)}
.artifact.card-cv-mid{border-color:var(--muted)}
.artifact.card-cv-low{border-color:var(--line)}
.cv-top strong{color:var(--gold)}.cv-high strong{color:var(--ok)}.cv-low strong{color:var(--muted)}

.pieces-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:22px 0 10px}
.pieces-head h3{margin:0}
.toggle{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden}
.toggle button{padding:4px 14px;font:inherit;font-size:12.5px;color:var(--muted);background:transparent;border:0;cursor:pointer}
.toggle button:hover{color:var(--accent)}
.toggle button[aria-pressed=true]{color:var(--on-accent);background:var(--accent)}
`