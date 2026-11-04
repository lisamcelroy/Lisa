// The Inside my Kitchen assistant: a soft rose fridge with its door just open and a warm
// gold light spilling out. Used on the Home page and when it asks your name.
// Each copy gets its own gradient ids so several can sit on one page.

let n = 0;

export function mascotSvg(cls = "mascot", { id = `m${++n}` } = {}) {
  return `<svg class="${cls}" viewBox="0 0 64 68" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${id}-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0a9b6"/><stop offset="1" stop-color="#d96c81"/></linearGradient>
    <radialGradient id="${id}-glow" cx=".1" cy=".5" r=".9"><stop offset="0" stop-color="#f4af30" stop-opacity=".9"/><stop offset="1" stop-color="#f4af30" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse class="glow" cx="44" cy="40" rx="17" ry="22" fill="url(#${id}-glow)"/>
  <path class="door" d="M46 7l6 3v50l-6 3z" fill="#f4af30"/>
  <rect x="12" y="5" width="34" height="58" rx="10" fill="url(#${id}-body)"/>
  <path d="M12 23.5H46" stroke="#fdf6ea" stroke-opacity=".7" stroke-width="1.5"/>
  <rect x="17" y="28" width="2.6" height="10" rx="1.3" fill="#fdf6ea" opacity=".85"/>
  <path class="eyes" d="M24.5 37.5q2-2.4 4 0M32 37.5q2-2.4 4 0" fill="none" stroke="#fdf6ea" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;
}
