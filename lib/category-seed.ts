export type CategorySeed = {
  slug: string;
  name: string;
  kind: "MACHINE" | "SPARE";
  sortOrder: number;
  description: string;
  imageUrl: string;
};

export const categorySeed: CategorySeed[] = [
  {
    slug: "cnc-lathe",
    name: "CNC Lathe",
    kind: "MACHINE",
    sortOrder: 10,
    description: "CNC lathes for turning, facing, and production work.",
    imageUrl:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "vmc",
    name: "VMC",
    kind: "MACHINE",
    sortOrder: 20,
    description: "Vertical machining centers for milling and drilling.",
    imageUrl:
      "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "hmc",
    name: "HMC",
    kind: "MACHINE",
    sortOrder: 30,
    description: "Horizontal machining centers for high-volume prismatic parts.",
    imageUrl:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "cnc-turning",
    name: "CNC Turning",
    kind: "MACHINE",
    sortOrder: 40,
    description: "CNC turning centers and mill-turn machines.",
    imageUrl:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "edm",
    name: "EDM",
    kind: "MACHINE",
    sortOrder: 50,
    description: "Wire-cut and spark EDM machines.",
    imageUrl:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "grinding",
    name: "Grinding",
    kind: "MACHINE",
    sortOrder: 60,
    description: "Cylindrical, surface, and CNC grinding machines.",
    imageUrl:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "press-brake",
    name: "Press Brake",
    kind: "MACHINE",
    sortOrder: 70,
    description: "CNC press brakes for sheet-metal bending.",
    imageUrl:
      "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "laser-machine",
    name: "Laser Machine",
    kind: "MACHINE",
    sortOrder: 80,
    description: "Fiber and CO2 laser cutting machines.",
    imageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "spare-parts",
    name: "Spare Parts",
    kind: "MACHINE",
    sortOrder: 90,
    description: "CNC spare parts, drives, motors, and control modules.",
    imageUrl:
      "https://images.unsplash.com/photo-1581092160603-962b610b5ae1?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "fanuc-parts",
    name: "FANUC Parts",
    kind: "SPARE",
    sortOrder: 110,
    description: "FANUC amplifiers, motors, and control modules.",
    imageUrl:
      "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "siemens-parts",
    name: "Siemens Parts",
    kind: "SPARE",
    sortOrder: 120,
    description: "Siemens Sinumerik and Sinamics spare parts.",
    imageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "mitsubishi-parts",
    name: "Mitsubishi Parts",
    kind: "SPARE",
    sortOrder: 130,
    description: "Mitsubishi CNC drives, servos, and boards.",
    imageUrl:
      "https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "yaskawa-parts",
    name: "Yaskawa Parts",
    kind: "SPARE",
    sortOrder: 140,
    description: "Yaskawa servo packs and motion control parts.",
    imageUrl:
      "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "spindle-motors",
    name: "Spindle Motors",
    kind: "SPARE",
    sortOrder: 150,
    description: "Spindle motors and related assemblies.",
    imageUrl:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "servo-motors",
    name: "Servo Motors",
    kind: "SPARE",
    sortOrder: 160,
    description: "AC servo motors for CNC axes.",
    imageUrl:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "power-supply",
    name: "Power Supply",
    kind: "SPARE",
    sortOrder: 170,
    description: "CNC power supply units and PSMs.",
    imageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "encoders",
    name: "Encoders",
    kind: "SPARE",
    sortOrder: 180,
    description: "Rotary encoders and feedback devices.",
    imageUrl:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=80",
  },
  {
    slug: "cables-connectors",
    name: "Cables & Connectors",
    kind: "SPARE",
    sortOrder: 190,
    description: "Servo cables, encoder cables, and connectors.",
    imageUrl:
      "https://images.unsplash.com/photo-1555612565-4b90cd2c2d2e?auto=format&fit=crop&w=400&q=80",
  },
];

export function categoryHref(slug: string, kind: "MACHINE" | "SPARE") {
  if (slug === "spare-parts" || kind === "SPARE") {
    return kind === "SPARE" ? `/spare-parts?type=${slug}` : "/spare-parts";
  }
  return `/machines?type=${slug}`;
}
