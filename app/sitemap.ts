import type { MetadataRoute } from "next";
import { categories } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE.url}/`, lastModified: now, priority: 1 },
    { url: `${SITE.url}/catalogo`, lastModified: now, priority: 0.9 },
    ...categories.map((c) => ({ url: `${SITE.url}/catalogo/${c.slug}`, lastModified: now, priority: 0.8 })),
    { url: `${SITE.url}/orcamento`, lastModified: now, priority: 0.7 },
  ];
}
