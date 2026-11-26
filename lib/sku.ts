export function readRequestSku(value: unknown) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return "";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value).trim();
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

export function skuKey(sku: string) {
  return sku.trim().toLowerCase();
}

export function duplicateSkuMessage(sku: string) {
  return `SKU ${sku.trim()} is already used. Enter a different SKU.`;
}

export function allocateSuffixedSku(base: string, taken: Set<string>) {
  const trimmed = base.trim();
  let n = 2;
  let candidate = `${trimmed}-${n}`;
  while (taken.has(skuKey(candidate))) {
    n += 1;
    candidate = `${trimmed}-${n}`;
  }
  return candidate;
}
