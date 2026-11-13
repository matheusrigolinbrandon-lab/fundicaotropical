import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogView from "@/components/CatalogView";
import { categories, getCategory } from "@/lib/catalog";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ categoria: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getCategory((await params).categoria);
  if (!c) return {};
  return {
    title: `${c.title} em bronze`,
    description: `${c.description} Fundição Tropical, Maringá-PR, desde 1985. Orçamento pelo WhatsApp.`,
    alternates: { canonical: `/catalogo/${c.slug}` },
    openGraph: { title: `${c.title} | Fundição Tropical`, description: c.description, url: `/catalogo/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const c = getCategory((await params).categoria);
  if (!c) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${c.title} — Fundição Tropical`,
    itemListElement: c.products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@type": "Product", name: p.name, sku: p.code, description: p.description, image: SITE.url + p.image, brand: { "@type": "Brand", name: SITE.name } },
    })),
  };

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Catálogo · {c.note}</p>
          <h1 className="display" style={{ marginTop: "1.2rem", fontSize: "clamp(2.4rem,5vw,4.4rem)" }}>
            {c.title}
          </h1>
          <p className="lead" style={{ marginTop: "1rem" }}>
            {c.description}
          </p>
        </div>
      </section>
      <CatalogView slug={c.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
