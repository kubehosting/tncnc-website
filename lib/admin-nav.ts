export const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/settings/homepage", label: "Home Page Settings" },
  { href: "/admin/settings/header", label: "Header & Footer" },
  { href: "/admin/invoices", label: "Orders" },
  { href: "/admin/regions", label: "Manage Country" },
  { href: "/admin/earnings", label: "Total Earning" },
  {
    label: "Manage Categories",
    children: [
      { href: "/admin/categories", label: "Main Category" },
      { href: "/admin/categories/sub", label: "Sub Category" },
      { href: "/admin/categories/child", label: "Child Category" },
    ],
  },
  {
    label: "Product",
    children: [
      { href: "/admin/inventory", label: "Inventory" },
      { href: "/admin/inventory/recycle", label: "Recycle bin" },
      { href: "/admin/inventory/bulk", label: "Bulk Product Import" },
      { href: "/admin/coupons", label: "Set Coupons" },
    ],
  },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/blog", label: "Blog" },
  {
    label: "Settings",
    children: [
      { href: "/admin/settings/general", label: "General Settings" },
      { href: "/admin/settings/homepage", label: "Home Page Settings" },
      { href: "/admin/settings/header", label: "Header & Footer" },
      { href: "/admin/settings/email", label: "Email Settings" },
      { href: "/admin/settings/payment", label: "Payment Settings" },
      { href: "/admin/settings/social", label: "Social Settings" },
      { href: "/admin/settings/seo", label: "SEO Tools" },
    ],
  },
  { href: "/admin/staff", label: "Admin Users" },
  { href: "/admin/tools/cache", label: "Clear Cache" },
] as const;
