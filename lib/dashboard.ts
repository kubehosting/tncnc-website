export function monthRange(monthsBack: number, now = new Date()) {
  const months: {
    year: number;
    month: number;
    start: Date;
    end: Date;
    label: string;
  }[] = [];

  for (let offset = monthsBack - 1; offset >= 0; offset -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      year: start.getFullYear(),
      month: start.getMonth(),
      start,
      end: new Date(start.getFullYear(), start.getMonth() + 1, 1),
      label: start.toLocaleString("en-IN", { month: "short" }),
    });
  }

  return months;
}

export function amount(value: { toString(): string } | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}
