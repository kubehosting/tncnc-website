export function formatInr(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function PriceTag({
  price,
  previousPrice,
  size = "md",
}: {
  price: number | null | undefined;
  previousPrice?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const current = price ?? null;
  const previous = previousPrice ?? null;
  const showPrevious = previous != null && current != null && previous > current;
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";

  if (current == null) {
    return <p className={`${text} font-semibold text-slate-500`}>Price on request</p>;
  }

  return (
    <p className="flex flex-wrap items-baseline gap-2">
      {showPrevious ? (
        <span className="text-sm font-medium text-slate-400 line-through">{formatInr(previous)}</span>
      ) : null}
      <span className={`${text} font-extrabold text-navy`}>{formatInr(current)}</span>
    </p>
  );
}
