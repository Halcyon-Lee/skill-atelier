export function SkillNetwork({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 400" fill="none" aria-hidden="true" className={className}>
      <g stroke="currentColor" strokeWidth="1">
        <ellipse cx="300" cy="200" rx="230" ry="116" opacity=".15" transform="rotate(-20 300 200)" />
        <ellipse cx="300" cy="200" rx="230" ry="116" opacity=".12" transform="rotate(28 300 200)" />
        <path d="m140 115 160 85 165-105M110 280l190-80 175 95M300 40v320" opacity=".22" />
        <rect x="224" y="124" width="152" height="152" rx="20" opacity=".13" transform="rotate(45 300 200)" />
        <rect x="240" y="140" width="120" height="120" rx="16" opacity=".3" transform="rotate(45 300 200)" />
        <rect x="252" y="152" width="96" height="96" rx="14" fill="var(--color-accent-soft)" transform="rotate(45 300 200)" />
      </g>
      <path d="m282 186-14 14 14 14m36-28 14 14-14 14m-12-38-12 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {[
        { x: 140, y: 115, label: "CODE" }, { x: 465, y: 95, label: "DESIGN" },
        { x: 110, y: 280, label: "RESEARCH" }, { x: 475, y: 295, label: "CREATE" },
      ].map((node) => <g key={node.label}>
        <rect x={node.x - 49} y={node.y - 22} width="98" height="44" rx="8" fill="var(--color-raised)" stroke="currentColor" strokeOpacity=".35" />
        <circle cx={node.x - 33} cy={node.y} r="2.5" fill="currentColor" />
        <text x={node.x + 6} y={node.y + 4} textAnchor="middle" fill="var(--color-muted)" fontFamily="var(--font-mono)" fontSize="11">{node.label}</text>
      </g>)}
      <g fill="currentColor"><circle cx="300" cy="40" r="4" /><circle cx="300" cy="360" r="3" /><circle cx="76" cy="188" r="2" opacity=".5" /><circle cx="526" cy="202" r="3" opacity=".6" /></g>
    </svg>
  );
}
