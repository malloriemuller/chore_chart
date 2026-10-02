"use client";

const PARTICLE_COUNT = 14;

/** Deterministic pseudo-random in [0, 1), so particle layout stays a pure function of its seed. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildParticles(burstKey: number) {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const seed = burstKey * 1000 + i;
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + seededRandom(seed) * 0.4;
    const distance = 40 + seededRandom(seed + 0.5) * 40;
    return {
      id: i,
      dx: `${Math.cos(angle) * distance}px`,
      dy: `${Math.sin(angle) * distance - 10}px`,
      delay: `${seededRandom(seed + 0.25) * 60}ms`,
      opacity: 0.5 + seededRandom(seed + 0.75) * 0.5,
    };
  });
}

export function Confetti({ burstKey }: { burstKey: number }) {
  if (burstKey === 0) return null;
  const particles = buildParticles(burstKey);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden key={burstKey}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 h-2 w-2 animate-confetti rounded-full"
          style={
            {
              backgroundColor: "var(--profile-base)",
              opacity: p.opacity,
              animationDelay: p.delay,
              "--dx": p.dx,
              "--dy": p.dy,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
