export const company = {
  name: "TNCNC",
  tagline: "Machinery | Spares | Solutions",
  blurb: "India's Trusted Source for CNC Machinery & Spare Parts",
  phone: "+91 99627 30000",
  phoneHref: "tel:+919962730000",
  whatsapp: "919962730000",
  email: "info@tncnc.in",
  website: "www.tncnc.in",
  address: "Chennai, Tamil Nadu, India",
  instagram: "https://www.instagram.com/",
  linkedin: "https://www.linkedin.com/",
  youtube: "https://www.youtube.com/",
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/machines", label: "CNC Machines" },
  { href: "/used-machines", label: "Used Machines" },
  { href: "/spare-parts", label: "Spare Parts" },
  { href: "/sell", label: "Sell Your Machine" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;

export const categories = [
  { slug: "cnc-lathe", name: "CNC Lathe" },
  { slug: "vmc", name: "VMC" },
  { slug: "hmc", name: "HMC" },
  { slug: "cnc-turning", name: "CNC Turning" },
  { slug: "edm", name: "EDM" },
  { slug: "grinding", name: "Grinding" },
  { slug: "press-brake", name: "Press Brake" },
  { slug: "laser-machine", name: "Laser Machine" },
  { slug: "spare-parts", name: "Spare Parts" },
] as const;

export type Machine = {
  slug: string;
  name: string;
  type: string;
  year: string;
  control: string;
  condition: string;
  location: string;
  image: string;
  featured: boolean;
  used: boolean;
  description: string;
  sku?: string;
  subcategory?: string;
  childCategory?: string;
  categoryName?: string;
  categorySlug?: string;
  price?: number | null;
  previousPrice?: number | null;
};

export const machines: Machine[] = [
  {
    slug: "mazak-quick-turn-250",
    name: "Mazak Quick Turn 250",
    type: "CNC Turning Center",
    year: "2018",
    control: "Mazatrol Control",
    condition: "Excellent",
    location: "Chennai, India",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80",
    featured: true,
    used: true,
    description:
      "Verified Mazak turning center ready for production. Inspected spindle, turret, and control before listing.",
  },
  {
    slug: "doosan-dnm-5700",
    name: "Doosan DNM 5700",
    type: "Vertical Machining Center",
    year: "2019",
    control: "Fanuc Control",
    condition: "Very Good",
    location: "Coimbatore, India",
    image:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80",
    featured: true,
    used: true,
    description:
      "Doosan VMC with Fanuc control, suitable for precision milling and job-shop work.",
  },
  {
    slug: "dmg-mori-cmx-1100-v",
    name: "DMG Mori CMX 1100 V",
    type: "Vertical Machining Center",
    year: "2020",
    control: "Heidenhain Control",
    condition: "Excellent",
    location: "Bangalore, India",
    image:
      "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=900&q=80",
    featured: true,
    used: true,
    description:
      "High-precision VMC from DMG MORI with generous travel and a clean service history.",
  },
  {
    slug: "okuma-lb3000-ex-ii",
    name: "Okuma LB3000 EX II",
    type: "CNC Turning Center",
    year: "2017",
    control: "OSP Control",
    condition: "Good",
    location: "Chennai, India",
    image:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80",
    featured: true,
    used: true,
    description:
      "Okuma turning center built for heavy cuts and long production runs.",
  },
  {
    slug: "haas-vf-2",
    name: "Haas VF-2",
    type: "Vertical Machining Center",
    year: "2021",
    control: "Haas Control",
    condition: "Excellent",
    location: "Pune, India",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80",
    featured: false,
    used: true,
    description:
      "Compact Haas VMC for tool rooms and small-batch production.",
  },
  {
    slug: "brother-speedio-s700x1",
    name: "Brother SPEEDIO S700X1",
    type: "CNC Tapping Center",
    year: "2019",
    control: "Brother CNC-C00",
    condition: "Very Good",
    location: "Chennai, India",
    image:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80",
    featured: false,
    used: true,
    description:
      "High-speed tapping center for volume drilling, tapping, and light milling.",
  },
];

export const spareParts = [
  { slug: "fanuc-parts", name: "FANUC Parts", color: "from-amber-400 to-yellow-600" },
  { slug: "siemens-parts", name: "Siemens Parts", color: "from-sky-400 to-cyan-600" },
  { slug: "mitsubishi-parts", name: "Mitsubishi Parts", color: "from-rose-500 to-red-700" },
  { slug: "yaskawa-parts", name: "Yaskawa Parts", color: "from-slate-400 to-slate-700" },
  { slug: "spindle-motors", name: "Spindle Motors", color: "from-zinc-300 to-zinc-500" },
  { slug: "servo-motors", name: "Servo Motors", color: "from-stone-300 to-stone-600" },
  { slug: "power-supply", name: "Power Supply", color: "from-yellow-300 to-amber-500" },
  { slug: "encoders", name: "Encoders", color: "from-neutral-400 to-neutral-700" },
  { slug: "cables-connectors", name: "Cables & Connectors", color: "from-zinc-800 to-black" },
];

export const brands = [
  "FANUC",
  "SIEMENS",
  "MITSUBISHI",
  "Mazak",
  "DMG MORI",
  "OKUMA",
  "DOOSAN",
  "HAAS",
  "MAKINO",
  "brother",
  "Sodick",
];

export const services = [
  {
    title: "Installation",
    text: "On-site installation, leveling, and first-part prove-out for new and used CNC machines.",
  },
  {
    title: "Commissioning",
    text: "Control setup, tooling recommendations, and operator handover so production starts faster.",
  },
  {
    title: "Repair & AMC",
    text: "Spindle, drive, and control repairs with annual maintenance contracts across South India.",
  },
  {
    title: "Sourcing",
    text: "Import and export of verified machines from global yards to Indian shops.",
  },
];

export function getMachine(slug: string) {
  return machines.find((machine) => machine.slug === slug);
}

export function whatsappLink(message?: string) {
  const text = encodeURIComponent(
    message ?? "Hi TNCNC, I would like to enquire about a CNC machine.",
  );
  return `https://wa.me/${company.whatsapp}?text=${text}`;
}
