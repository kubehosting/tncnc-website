import { inr } from "@/lib/admin-ui";

type Point = { label: string; total: number };

export function SalesTrendChart({ points }: { points: Point[] }) {
  const max = Math.max(...points.map((point) => point.total), 1);

  return (
    <div className="flex h-56 items-end gap-2 sm:gap-3">
      {points.map((point) => {
        const height = Math.max(6, Math.round((point.total / max) * 100));
        return (
          <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <p className="text-[10px] font-medium text-slate-500 sm:text-xs">
              {point.total ? inr(point.total) : "—"}
            </p>
            <div className="flex h-36 w-full items-end rounded-xl bg-slate-50 px-1">
              <div
                className="w-full rounded-t-lg bg-gold"
                style={{ height: `${height}%` }}
                title={inr(point.total)}
              />
            </div>
            <p className="text-xs font-semibold text-navy">{point.label}</p>
          </div>
        );
      })}
    </div>
  );
}
