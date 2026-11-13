import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { totalProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Catálogo de peças em bronze e alumínio",
  description:
    "Catálogo da Fundição Tropical: placas de bronze para cemitério, crucifixos, imagens sacras, artigos litúrgicos, letras, ostensórios e apliques. Orçamento pelo WhatsApp.",
  alternates: { canonical: "/catalogo" },
};

export default function CatalogPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Fundição Tropical · Maringá PR · Desde 1985</p>
          <h1 className="display" style={{ marginTop: "1.2rem", fontSize: "clamp(2.4rem,5vw,4.4rem)" }}>
            Catálogo <em>geral</em>
          </h1>
          <p className="lead" style={{ marginTop: "1rem" }}>
            {totalProducts} peças em sete linhas. Escolha uma categoria, filtre por acabamento e peça o orçamento da peça
            pelo WhatsApp.
          </p>
        </div>
      </section>
      <CatalogView />
    </>
  );
}
