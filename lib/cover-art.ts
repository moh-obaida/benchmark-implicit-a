const PAPERS = ["#EEDCEE", "#F3E4E1", "#D7E3D4", "#D5E0E8", "#F4EFE6", "#E8E0D4", "#E6E2DE", "#F3EEE8"];

function motif(index: number, fg: string) {
  const ink = "#2C2826";
  switch (index % 6) {
    case 0:
      return `<circle cx="430" cy="470" r="210" fill="${fg}"/><rect x="168" y="150" width="14" height="760" rx="7" fill="${ink}"/>`;
    case 1:
      return `<path d="M180 820 V360 C180 180 620 180 620 360 V820 Z" fill="${fg}"/><rect x="386" y="250" width="28" height="430" rx="14" fill="${ink}" opacity="0.78"/>`;
    case 2:
      return `<rect x="120" y="180" width="360" height="520" rx="28" fill="${fg}"/><rect x="300" y="360" width="380" height="460" rx="28" fill="${ink}" opacity="0.12"/>`;
    case 3:
      return `<rect x="0" y="180" width="800" height="90" fill="${fg}"/><rect x="0" y="470" width="800" height="48" fill="${ink}" opacity="0.12"/><rect x="0" y="760" width="800" height="120" fill="${fg}"/>`;
    case 4:
      return `<circle cx="0" cy="0" r="280" fill="${fg}"/><circle cx="800" cy="1067" r="340" fill="${fg}"/><circle cx="620" cy="280" r="70" fill="${ink}" opacity="0.14"/>`;
    default:
      return `<circle cx="250" cy="340" r="90" fill="${fg}"/><circle cx="430" cy="520" r="130" fill="${fg}"/><circle cx="560" cy="760" r="70" fill="${ink}" opacity="0.12"/><rect x="150" y="140" width="10" height="780" rx="5" fill="${ink}" opacity="0.7"/>`;
  }
}

export function coverSvg(index: number) {
  const bg = PAPERS[index % PAPERS.length];
  const fg = PAPERS[(index + 3) % PAPERS.length];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1067" viewBox="0 0 800 1067">
  <rect width="800" height="1067" fill="${bg}"/>
  ${motif(index, fg)}
  <rect x="36" y="36" width="728" height="995" fill="none" stroke="#2C2826" stroke-opacity="0.16" stroke-width="2"/>
</svg>`;
}

export function authorSvg(index: number) {
  const bg = PAPERS[(index + 1) % PAPERS.length];
  const fg = PAPERS[(index + 4) % PAPERS.length];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg}"/>
  <circle cx="200" cy="168" r="78" fill="${fg}"/>
  <path d="M70 360c24-78 70-112 130-112s106 34 130 112" fill="#2C2826" opacity="0.14"/>
</svg>`;
}
