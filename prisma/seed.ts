import { PrismaClient, type SidebarSection } from "@prisma/client";
import { SETTING_KEYS } from "../lib/settings";
import { serializeWidgetCards, DEFAULT_HERO_CARDS, DEFAULT_SERVICE_CARDS } from "../lib/widgetCards";
import { serializeSocialLinks } from "../lib/socialLinks";
import { NAV_LINKS, ROUTES } from "../lib/routes";

const prisma = new PrismaClient();

const INITIAL_SITE_SETTINGS: Record<string, string> = {
  [SETTING_KEYS.siteName]: "Subra",
  [SETTING_KEYS.siteTagline]: "CATALOGUE",
  [SETTING_KEYS.siteLogo]: "",
  [SETTING_KEYS.favicon]: "",
  [SETTING_KEYS.contactEmail]: "info@Patientscientific.com",
  [SETTING_KEYS.contactPhone]: "+91 98765 43210",
  [SETTING_KEYS.companyAddress]:
    "Subra Scientific Company, Balathandayutham Street, Anna Nagar Ext., Puducherry - 605005",
  [SETTING_KEYS.themeMode]: "dark",
  [SETTING_KEYS.themePrimaryColor]: "#0b5cff",
  [SETTING_KEYS.themeAccentColor]: "#ff2d2d",
  [SETTING_KEYS.smtpPort]: "587",
  [SETTING_KEYS.smtpSecure]: "false",
  [SETTING_KEYS.smtpEnabled]: "false",
  [SETTING_KEYS.razorpayEnabled]: "false",
  [SETTING_KEYS.widgetShowHero]: "true",
  [SETTING_KEYS.widgetShowCategories]: "true",
  [SETTING_KEYS.widgetShowServices]: "true",
  [SETTING_KEYS.widgetShowEnquiry]: "true",
  [SETTING_KEYS.widgetHeroCards]: serializeWidgetCards(DEFAULT_HERO_CARDS),
  [SETTING_KEYS.widgetServiceCards]: serializeWidgetCards(DEFAULT_SERVICE_CARDS),
  [SETTING_KEYS.socialLinks]: serializeSocialLinks([]),
  [SETTING_KEYS.socialLinkedin]: "",
  [SETTING_KEYS.socialFacebook]: "",
  [SETTING_KEYS.socialTwitter]: "",
  [SETTING_KEYS.socialYoutube]: "",
};

async function seedSiteSettings() {
  for (const [key, value] of Object.entries(INITIAL_SITE_SETTINGS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
}

type SidebarSeedItem = {
  label: string;
  href: string;
  sortOrder: number;
  children?: { label: string; href: string; sortOrder: number }[];
};

const PUBLIC_SIDEBAR_SEEDS: Record<
  Exclude<SidebarSection, "admin">,
  SidebarSeedItem[]
> = {
  navbar: NAV_LINKS.public.map((item, index) => ({
    label: item.label,
    href: item.href,
    sortOrder: index,
    ...(item.label === "Products"
      ? {
          children: NAV_LINKS.productDropdown.map((child, childIndex) => ({
            label: child.label,
            href: child.href,
            sortOrder: childIndex,
          })),
        }
      : {}),
  })),
  footer: NAV_LINKS.footer.quickLinks.map((item, index) => ({
    label: item.label,
    href: item.href,
    sortOrder: index,
  })),
  footer_service: NAV_LINKS.footer.customerService.map((item, index) => ({
    label: item.label,
    href: item.href,
    sortOrder: index,
  })),
  products_sidebar: NAV_LINKS.azSidebar.map((item, index) => ({
    label: item.title,
    href: item.href,
    sortOrder: index,
  })),
};

async function seedSidebarItems() {
  for (const [section, items] of Object.entries(PUBLIC_SIDEBAR_SEEDS) as [
    Exclude<SidebarSection, "admin">,
    SidebarSeedItem[],
  ][]) {
    const existingCount = await prisma.sidebarItem.count({
      where: { section },
    });
    if (existingCount > 0) continue;

    for (const item of items) {
      const parent = await prisma.sidebarItem.create({
        data: {
          label: item.label,
          href: item.href,
          section,
          sortOrder: item.sortOrder,
          isActive: true,
        },
      });

      if (item.children?.length) {
        await prisma.sidebarItem.createMany({
          data: item.children.map((child) => ({
            label: child.label,
            href: child.href,
            section,
            parentId: parent.id,
            sortOrder: child.sortOrder,
            isActive: true,
          })),
        });
      }
    }
  }
}

async function seedAdminSidebarItems() {
  const existingCount = await prisma.sidebarItem.count({
    where: { section: "admin" },
  });
  if (existingCount > 0) return;

  const adminItems: SidebarSeedItem[] = [
    { label: "Dashboard", href: ROUTES.admin.dashboard, sortOrder: 0 },
    {
      label: "Products Management",
      href: ROUTES.admin.products,
      sortOrder: 1,
      children: [
        { label: "All Products", href: ROUTES.admin.products, sortOrder: 0 },
        {
          label: "Add Product",
          href: ROUTES.admin.productCreate,
          sortOrder: 1,
        },
        {
          label: "External Products",
          href: ROUTES.admin.externalProducts,
          sortOrder: 2,
        },
      ],
    },
    { label: "Categories", href: ROUTES.admin.categories, sortOrder: 2 },
    { label: "Sub Categories", href: ROUTES.admin.subcategories, sortOrder: 3 },
    {
      label: "User Management",
      href: ROUTES.admin.users,
      sortOrder: 4,
      children: [{ label: "All Users", href: ROUTES.admin.users, sortOrder: 0 }],
    },
    { label: "Enquiries", href: ROUTES.admin.enquiry, sortOrder: 5 },
    { label: "Sidebar Menu", href: ROUTES.admin.sidebar, sortOrder: 6 },
    { label: "Settings", href: ROUTES.admin.settings, sortOrder: 7 },
  ];

  for (const item of adminItems) {
    const parent = await prisma.sidebarItem.create({
      data: {
        label: item.label,
        href: item.href,
        section: "admin",
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });

    if (item.children?.length) {
      await prisma.sidebarItem.createMany({
        data: item.children.map((child) => ({
          label: child.label,
          href: child.href,
          section: "admin",
          parentId: parent.id,
          sortOrder: child.sortOrder,
          isActive: true,
        })),
      });
    }
  }
}

async function main() {
  await seedSiteSettings();
  console.log("Site settings seeded.");

  await seedSidebarItems();
  console.log("Public sidebar items seeded.");

  await seedAdminSidebarItems();
  console.log("Admin sidebar items seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
