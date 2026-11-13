import raw from "@/data/catalog.json";

export type Product = {
  code: string;
  name: string;
  image: string;
  description: string;
  application: string;
  tags: string[];
  finishes: string[];
  example?: string;
  badge?: string;
  fit: string;
};

export type Category = {
  slug: string;
  title: string;
  description: string;
  note: string;
  filtersNote: string;
  filters: { label: string; tag: string }[];
  products: Product[];
};

export const categories = raw as Category[];

export const SHORT: Record<string, string> = {
  cemiterio: "Cemitério",
  crucifixos: "Crucifixos",
  sacras: "Imagens Sacras",
  igreja: "Igreja",
  letras: "Letras",
  ostensorios: "Ostensórios",
  apliques: "Apliques",
};

/** Foto de capa de cada categoria no showroom (sempre uma peça real do catálogo). */
export const COVER: Record<string, string> = {
  cemiterio: "/img/placa-c-coroa-de-louros-e-porta-retrato.webp",
  crucifixos: "/img/crucifixo-completo-cruz-robusta-com-pergaminho.webp",
  sacras: "/img/sao-miguel-arcanjo-com-balanca-da-justica.webp",
  igreja: "/img/sacrario-tabernaculo-em-bronze-dourado.webp",
  letras: "/img/manuscrito-cursivo-acabamento-escovado.webp",
  ostensorios: "/img/ostensorio-solar-barroco-em-ouro.webp",
  apliques: "/img/puxador-rocaille-com-dragoes.webp",
};

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function findProduct(code: string) {
  for (const c of categories) {
    const p = c.products.find((x) => x.code === code);
    if (p) return { product: p, category: c };
  }
  return undefined;
}

/** "17 modelos · Bronze" -> total declarado pela empresa (17). */
export function declaredTotal(c: Category) {
  const m = c.note.match(/^(\d+)/);
  return m ? Number(m[1]) : c.products.length;
}

export const totalProducts = categories.reduce((n, c) => n + c.products.length, 0);
