export type HeroSlide = {
  imageUrl: string;
  title: string;
  subtitle: string;
  brand: string;
  caption: string;
  tagline: string;
};

export const defaultHeroSlides: HeroSlide[] = [
  {
    imageUrl:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1800&q=80",
    title: "Quality CNC Machines for a Stronger Tomorrow",
    subtitle: "Used CNC Machines | New Arrivals | Spare Parts | Global Sourcing",
    brand: "DMG MORI",
    caption: "CNC Vertical Machining Center",
    tagline: "High Precision. Higher Possibilities.",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1800&q=80",
    title: "Verified Used CNC Machines, Ready for Production",
    subtitle: "Inspection | Stock Photos | Pan India Delivery",
    brand: "MAZAK",
    caption: "CNC Turning Center",
    tagline: "Reliable machines. Honest condition reports.",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=1800&q=80",
    title: "CNC Spare Parts with Genuine Compatibility",
    subtitle: "FANUC | Siemens | Mitsubishi | Ready Stock",
    brand: "FANUC",
    caption: "Servo, spindle and control parts",
    tagline: "Genuine | Compatible | Tested",
  },
];

export const MIN_HERO_SLIDES = 3;

export function stringifyHeroSlides(slides: HeroSlide[]) {
  return JSON.stringify(slides);
}

export function parseHeroSlides(value: string, fallback = defaultHeroSlides): HeroSlide[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return fallback;
    }
    const slides = parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const imageUrl =
          "imageUrl" in entry && typeof entry.imageUrl === "string" ? entry.imageUrl.trim() : "";
        if (!imageUrl) {
          return null;
        }
        return {
          imageUrl,
          title: "title" in entry && typeof entry.title === "string" ? entry.title : "",
          subtitle: "subtitle" in entry && typeof entry.subtitle === "string" ? entry.subtitle : "",
          brand: "brand" in entry && typeof entry.brand === "string" ? entry.brand : "",
          caption: "caption" in entry && typeof entry.caption === "string" ? entry.caption : "",
          tagline: "tagline" in entry && typeof entry.tagline === "string" ? entry.tagline : "",
        };
      })
      .filter((item): item is HeroSlide => item !== null);
    return slides.length ? slides : fallback;
  } catch {
    return fallback;
  }
}

export function isOptimizedImage(src: string) {
  return src.startsWith("/") || src.includes("images.unsplash.com");
}
