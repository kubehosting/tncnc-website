import { prisma } from "@/lib/prisma";

export type TaxonomyChild = { name: string; count: number };
export type TaxonomyNode = { name: string; count: number; children: TaxonomyChild[] };

export type SubmittedChild = { name: string; original?: string | null };
export type SubmittedNode = { name: string; original?: string | null; children: SubmittedChild[] };

type CleanChild = { name: string; originals: string[] };
type CleanNode = { name: string; originals: string[]; children: CleanChild[] };

type SavedNode = { name: string; children: string[] };

const key = (value: string) => value.trim().toLowerCase();

export function parseSavedTaxonomy(value: string | null | undefined): SavedNode[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object" || !("name" in entry) || typeof entry.name !== "string") {
        return [];
      }
      const name = entry.name.trim();
      if (!name) {
        return [];
      }
      const children =
        "children" in entry && Array.isArray(entry.children)
          ? entry.children
              .filter((child: unknown): child is string => typeof child === "string")
              .map((child: string) => child.trim())
              .filter(Boolean)
          : [];
      return [{ name, children }];
    });
  } catch {
    return [];
  }
}

function mergeTree(
  saved: SavedNode[],
  usage: Array<{ subcategory: string | null; childCategory: string | null; live: boolean }>,
): TaxonomyNode[] {
  const nodes = new Map<string, { name: string; count: number; children: Map<string, TaxonomyChild> }>();
  const order: string[] = [];

  const ensureNode = (name: string) => {
    const id = key(name);
    let node = nodes.get(id);
    if (!node) {
      node = { name, count: 0, children: new Map() };
      nodes.set(id, node);
      order.push(id);
    }
    return node;
  };
  const ensureChild = (node: ReturnType<typeof ensureNode>, name: string) => {
    const id = key(name);
    let child = node.children.get(id);
    if (!child) {
      child = { name, count: 0 };
      node.children.set(id, child);
    }
    return child;
  };

  for (const entry of saved) {
    const node = ensureNode(entry.name);
    for (const child of entry.children) {
      ensureChild(node, child);
    }
  }

  for (const row of usage) {
    const sub = row.subcategory?.trim();
    if (!sub) {
      continue;
    }
    const node = ensureNode(sub);
    if (row.live) {
      node.count += 1;
    }
    const childName = row.childCategory?.trim();
    if (childName) {
      const child = ensureChild(node, childName);
      if (row.live) {
        child.count += 1;
      }
    }
  }

  return order.map((id) => {
    const node = nodes.get(id)!;
    return { name: node.name, count: node.count, children: [...node.children.values()] };
  });
}

export async function getCategoryTrees(categoryIds?: string[]) {
  const [categories, usage] = await Promise.all([
    prisma.category.findMany({
      where: categoryIds ? { id: { in: categoryIds } } : undefined,
      select: { id: true, subcategoriesJson: true },
    }),
    prisma.machine.findMany({
      where: categoryIds ? { categoryId: { in: categoryIds } } : undefined,
      select: { categoryId: true, subcategory: true, childCategory: true, deletedAt: true },
    }),
  ]);
  const usageByCategory = new Map<string, Array<{ subcategory: string | null; childCategory: string | null; live: boolean }>>();
  for (const row of usage) {
    const list = usageByCategory.get(row.categoryId) ?? [];
    list.push({ subcategory: row.subcategory, childCategory: row.childCategory, live: !row.deletedAt });
    usageByCategory.set(row.categoryId, list);
  }
  return new Map(
    categories.map((category) => [
      category.id,
      mergeTree(parseSavedTaxonomy(category.subcategoriesJson), usageByCategory.get(category.id) ?? []),
    ]),
  );
}

function originalOf(record: Record<string, unknown>) {
  return typeof record.original === "string" && record.original.trim() ? [record.original.trim()] : [];
}

// Entries renamed onto an existing name are merged, so their products follow instead of being cleared.
export function cleanSubmittedTree(value: unknown): CleanNode[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const nodes = new Map<string, CleanNode>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) {
      continue;
    }
    const node = nodes.get(key(name)) ?? { name, originals: [], children: [] };
    node.originals.push(...originalOf(record));
    for (const child of Array.isArray(record.children) ? record.children : []) {
      if (!child || typeof child !== "object") {
        continue;
      }
      const childRecord = child as Record<string, unknown>;
      const childName = typeof childRecord.name === "string" ? childRecord.name.trim() : "";
      if (!childName) {
        continue;
      }
      let target = node.children.find((existing) => key(existing.name) === key(childName));
      if (!target) {
        target = { name: childName, originals: [] };
        node.children.push(target);
      }
      target.originals.push(...originalOf(childRecord));
    }
    nodes.set(key(name), node);
  }
  return [...nodes.values()];
}

// Renames and removals are applied to products (including ones in the recycle bin)
// so the saved list and product data never drift apart.
export async function saveCategoryTree(categoryId: string, submitted: CleanNode[]) {
  const current = (await getCategoryTrees([categoryId])).get(categoryId) ?? [];

  await prisma.$transaction(async (tx) => {
    const keptSubs = new Set<string>();
    const childrenBefore = new Map<string, TaxonomyChild[]>();
    for (const node of submitted) {
      const before: TaxonomyChild[] = [];
      for (const original of node.originals) {
        keptSubs.add(key(original));
        before.push(...(current.find((entry) => key(entry.name) === key(original))?.children ?? []));
        if (original !== node.name) {
          await tx.$executeRaw`UPDATE "Machine" SET "subcategory" = ${node.name}
            WHERE "categoryId" = ${categoryId} AND lower(trim("subcategory")) = ${key(original)}`;
        }
      }
      childrenBefore.set(key(node.name), before);
    }
    for (const existing of current) {
      if (!keptSubs.has(key(existing.name))) {
        await tx.$executeRaw`UPDATE "Machine" SET "subcategory" = NULL, "childCategory" = NULL
          WHERE "categoryId" = ${categoryId} AND lower(trim("subcategory")) = ${key(existing.name)}`;
      }
    }

    for (const node of submitted) {
      if (!node.originals.length) {
        continue;
      }
      const keptChildren = new Set<string>();
      for (const child of node.children) {
        for (const original of child.originals) {
          keptChildren.add(key(original));
          if (original !== child.name) {
            await tx.$executeRaw`UPDATE "Machine" SET "childCategory" = ${child.name}
              WHERE "categoryId" = ${categoryId} AND lower(trim("subcategory")) = ${key(node.name)}
              AND lower(trim("childCategory")) = ${key(original)}`;
          }
        }
      }
      for (const child of childrenBefore.get(key(node.name)) ?? []) {
        if (!keptChildren.has(key(child.name))) {
          await tx.$executeRaw`UPDATE "Machine" SET "childCategory" = NULL
            WHERE "categoryId" = ${categoryId} AND lower(trim("subcategory")) = ${key(node.name)}
            AND lower(trim("childCategory")) = ${key(child.name)}`;
        }
      }
    }

    const saved: SavedNode[] = submitted.map((node) => ({
      name: node.name,
      children: node.children.map((child) => child.name),
    }));
    await tx.category.update({
      where: { id: categoryId },
      data: { subcategoriesJson: saved.length ? JSON.stringify(saved) : null },
    });
  });
}

export async function getCategoryOptions() {
  const trees = await getCategoryTrees();
  return Object.fromEntries(
    [...trees.entries()].map(([id, nodes]) => [
      id,
      nodes.map((node) => ({ name: node.name, children: node.children.map((child) => child.name) })),
    ]),
  );
}

export type TaxonomyAction =
  | { action: "addSub"; categoryId: string; name: string }
  | { action: "renameSub"; categoryId: string; sub: string; name: string }
  | { action: "removeSub"; categoryId: string; sub: string }
  | { action: "addChild"; categoryId: string; sub: string; name: string }
  | { action: "renameChild"; categoryId: string; sub: string; child: string; name: string }
  | { action: "removeChild"; categoryId: string; sub: string; child: string };

export class TaxonomyError extends Error {}

export async function applyTaxonomyAction(input: TaxonomyAction) {
  const current = (await getCategoryTrees([input.categoryId])).get(input.categoryId);
  if (!current) {
    throw new TaxonomyError("Category not found");
  }
  const tree: SubmittedNode[] = current.map((node) => ({
    name: node.name,
    original: node.name,
    children: node.children.map((child) => ({ name: child.name, original: child.name })),
  }));
  const findSub = (name: string) => {
    const node = tree.find((entry) => key(entry.name) === key(name));
    if (!node) {
      throw new TaxonomyError(`Subcategory “${name}” was not found. Reload and try again.`);
    }
    return node;
  };
  const findChild = (node: SubmittedNode, name: string) => {
    const child = node.children.find((entry) => key(entry.name) === key(name));
    if (!child) {
      throw new TaxonomyError(`Child category “${name}” was not found. Reload and try again.`);
    }
    return child;
  };
  const requireName = (value: string) => {
    const name = value.trim();
    if (!name) {
      throw new TaxonomyError("Name is required");
    }
    return name;
  };

  switch (input.action) {
    case "addSub": {
      const name = requireName(input.name);
      if (tree.some((entry) => key(entry.name) === key(name))) {
        throw new TaxonomyError(`“${name}” already exists in this category.`);
      }
      tree.push({ name, original: null, children: [] });
      break;
    }
    case "renameSub":
      findSub(input.sub).name = requireName(input.name);
      break;
    case "removeSub": {
      const node = findSub(input.sub);
      tree.splice(tree.indexOf(node), 1);
      break;
    }
    case "addChild": {
      const node = findSub(input.sub);
      const name = requireName(input.name);
      if (node.children.some((entry) => key(entry.name) === key(name))) {
        throw new TaxonomyError(`“${name}” already exists under ${node.name}.`);
      }
      node.children.push({ name, original: null });
      break;
    }
    case "renameChild":
      findChild(findSub(input.sub), input.child).name = requireName(input.name);
      break;
    case "removeChild": {
      const node = findSub(input.sub);
      node.children.splice(node.children.indexOf(findChild(node, input.child)), 1);
      break;
    }
  }

  await saveCategoryTree(input.categoryId, cleanSubmittedTree(tree) ?? []);
}

export async function getTaxonomyPageData() {
  const [categories, trees] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, kind: true },
    }),
    getCategoryTrees(),
  ]);
  return { categories, trees: Object.fromEntries(trees) };
}
