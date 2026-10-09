export function LoadingSkeleton() {
  return (
    <div className="content">
      <div className="skeleton hero-skeleton" />
      <div className="metric-grid">
        {[1, 2, 3, 4].map((i) => (
          <div className="card skeleton" key={i} />
        ))}
      </div>
      <div className="grid-main">
        <div className="card skeleton tall" />
        <div className="card skeleton tall" />
      </div>
    </div>
  );
}

// Keep Skeleton alias
export { LoadingSkeleton as Skeleton };
