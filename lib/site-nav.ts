export type NavItem = { href: string; label: string };

export const defaultHeaderMenu: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/machines", label: "CNC Machines" },
  { href: "/used-machines", label: "Used Machines" },
  { href: "/spare-parts", label: "Spare Parts" },
  { href: "/sell", label: "Sell Your Machine" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function stringifyNav(items: NavItem[]) {
  return JSON.stringify(items);
}

export function parseNav(value: string, fallback: NavItem[] = defaultHeaderMenu): NavItem[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return fallback;
    }
    const items = parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const href = "href" in entry && typeof entry.href === "string" ? entry.href.trim() : "";
        const label = "label" in entry && typeof entry.label === "string" ? entry.label.trim() : "";
        if (!href || !label) {
          return null;
        }
        return { href, label };
      })
      .filter((item): item is NavItem => item !== null);
    return items.length ? items : fallback;
  } catch {
    return fallback;
  }
}

export function fillCopyright(template: string, year = new Date().getFullYear()) {
  return template.replaceAll("{year}", String(year));
}
