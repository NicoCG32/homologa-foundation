import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const gridStyle = { "--skeleton-columns": columns } as CSSProperties;
  return (
    <div className="skeleton-table" style={gridStyle} role="status" aria-label="Cargando tabla">
      <span className="sr-only">Cargando datos…</span>
      <div className="skeleton-table-row skeleton-table-head">
        {Array.from({ length: columns }, (_, i) => <Skeleton key={i} className="skeleton-line skeleton-short" />)}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div className="skeleton-table-row" key={row}>
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton key={col} className={`skeleton-line ${col === 0 ? "skeleton-wide" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ScoreTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="score-table skeleton-score-table" role="status" aria-label="Cargando candidatos">
      <span className="sr-only">Cargando candidatos…</span>
      <div className="score-row score-head">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="skeleton-line skeleton-short" />)}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div className="score-row" key={i}>
          <div className="skeleton-copy"><Skeleton className="skeleton-line skeleton-wide" /><Skeleton className="skeleton-line skeleton-short" /></div>
          <Skeleton className="skeleton-pill" />
          <Skeleton className="skeleton-pill" />
          <Skeleton className="skeleton-pill" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-cards" role="status" aria-label="Cargando contenido">
      <span className="sr-only">Cargando contenido…</span>
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <Skeleton className="skeleton-line skeleton-short" />
          <Skeleton className="skeleton-line skeleton-wide" />
          <Skeleton className="skeleton-line" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="skeleton-detail" role="status" aria-label="Cargando detalle">
      <span className="sr-only">Cargando detalle…</span>
      <Skeleton className="skeleton-line skeleton-short" />
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-line skeleton-wide" />
      <div className="skeleton-panel"><Skeleton className="skeleton-line skeleton-short" /><Skeleton className="skeleton-line skeleton-wide" /></div>
      <TableSkeleton rows={5} columns={4} />
      <div className="skeleton-panel skeleton-panel-tall"><Skeleton className="skeleton-line skeleton-short" /><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line skeleton-wide" /></div>
    </div>
  );
}