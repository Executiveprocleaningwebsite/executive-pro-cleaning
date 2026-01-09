export default function sitemap() {
  const baseUrl = "https://executive-pro-cleaning.vercel.app";

  const routes = [
    "",
    "/about",
    "/services",
    "/before-after",
    "/pricing",
    "/socials",
    "/contact",
    "/quote", // ✅ NEW
    "/privacy",
    "/terms",
    "/accessibility",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}