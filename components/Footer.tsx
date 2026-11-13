import Link from "next/link";
import { SITE, whatsappUrl } from "@/lib/site";
import { categories } from "@/lib/catalog";

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-grid">
          <div>
            <p className="h2" style={{ fontSize: "2rem" }}>
              Fundição <em>Tropical</em>
            </p>
            <p className="lead" style={{ marginTop: "1rem", fontSize: ".95rem" }}>
              Fundição artesanal de bronze e alumínio em Maringá, Paraná. Empresa familiar desde 1985, com atendimento em
              todo o Brasil.
            </p>
          </div>
          <div>
            <h5>Catálogo</h5>
            {categories.map((c) => (
              <Link key={c.slug} href={`/catalogo/${c.slug}`}>
                {c.title}
              </Link>
            ))}
          </div>
          <div>
            <h5>Contato</h5>
            <a href={whatsappUrl()} target="_blank" rel="noopener">
              WhatsApp {SITE.whatsappLabel}
            </a>
            <a href={`tel:${SITE.phone}`}>Telefone {SITE.phoneLabel}</a>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <Link href="/orcamento">Solicitar orçamento</Link>
          </div>
        </div>
        <div className="ftr-base">
          <span>© {new Date().getFullYear()} Fundição Tropical · Maringá, Paraná · Desde 1985</span>
          <span>Bronze e alumínio que atravessam gerações</span>
        </div>
      </div>
    </footer>
  );
}
