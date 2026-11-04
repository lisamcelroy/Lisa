// The Inside my Kitchen assistant: a little fridge with a face that waves and blinks.
// Used in the header, on the Home page, in the opening splash and when it asks your name.

export function mascotSvg(cls = "mascot", { sparkle = false } = {}) {
  const ink = "#24405f";
  return `<svg class="${cls}" viewBox="0 0 64 68" aria-hidden="true" focusable="false">
  <g class="arm-l"><path d="M17 40C11 39 7.5 35 6.6 30.6" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="6.3" cy="28.8" r="2.7" fill="#fff7e2" stroke="${ink}" stroke-width="2.4"/></g>
  <g class="arm-r"><path d="M47 40C53 38 56.6 33.6 57 28.6" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="57.2" cy="26.8" r="2.7" fill="#fff7e2" stroke="${ink}" stroke-width="2.4"/></g>
  <path d="M22 59.5v4.2M42 59.5v4.2" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
  <rect x="16" y="5" width="32" height="54.5" rx="10" fill="#fff7e2" stroke="${ink}" stroke-width="3"/>
  <path d="M16 22.5H48" stroke="${ink}" stroke-width="3"/>
  <path d="M21.6 10.6v6" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
  <circle class="magnet m1" cx="41" cy="12" r="2.8" fill="#f08c21"/>
  <circle class="magnet m2" cx="34.4" cy="15.4" r="2.1" fill="#e36888"/>
  <g class="eyes"><circle cx="26.5" cy="36" r="2.8" fill="${ink}"/><circle cx="37.5" cy="36" r="2.8" fill="${ink}"/>
    <circle cx="27.5" cy="35" r=".95" fill="#fff"/><circle cx="38.5" cy="35" r=".95" fill="#fff"/></g>
  <ellipse cx="22.4" cy="41.6" rx="2.8" ry="1.7" fill="#e36888" opacity=".85"/>
  <ellipse cx="41.6" cy="41.6" rx="2.8" ry="1.7" fill="#e36888" opacity=".85"/>
  <path d="M28.4 41.4Q32 45.2 35.6 41.4" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  ${sparkle ? `<g class="sparkle" fill="none" stroke="#f08c21" stroke-width="2.4" stroke-linecap="round"><path d="M6 12l3 3M4 21h4M58 9l-3 3M60 18h-4"/></g>` : ""}
</svg>`;
}
