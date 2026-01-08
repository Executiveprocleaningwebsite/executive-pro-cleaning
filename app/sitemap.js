export default function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const routes = [
    "",
    "/about",
    "/services",
    "/before-after",
    "/pricing",
    "/socials",
    "/contact",
    "/privacy",
    "/terms",
  ];

  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
  }));
}
