const leaves = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 12}s`,
  duration: `${11 + Math.random() * 10}s`,
  size: `${8 + Math.random() * 12}px`
}));

export const LeafParticles = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    {leaves.map(leaf => (
      <span
        key={leaf.id}
        className="absolute rounded-full bg-[var(--flame)] opacity-40 blur-[0.5px]"
        style={{
          left: leaf.left,
          width: leaf.size,
          height: leaf.size,
          animation: `leafFloat ${leaf.duration} linear ${leaf.delay} infinite`
        }}
      />
    ))}
  </div>
);
