import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";
import { SITE, whatsappUrl, DEFAULT_WPP } from "@/lib/site";

export const metadata: Metadata = {
  title: "Solicitar orçamento",
  description:
    "Peça seu orçamento de placas de bronze, arte sacra e peças personalizadas. A Fundição Tropical atende todo o Brasil pelo WhatsApp, telefone ou e-mail.",
  alternates: { canonical: "/orcamento" },
};

export default function QuotePage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Atendimento · Fundição Tropical</p>
          <h1 className="display" style={{ marginTop: "1.2rem", fontSize: "clamp(2.4rem,5vw,4.4rem)" }}>
            Solicitar <em>orçamento</em>
          </h1>
          <p className="lead" style={{ marginTop: "1rem" }}>
            Monte seu pedido em cinco passos e envie pelo WhatsApp. Atendemos todo o Brasil, com resposta rápida e
            atendimento personalizado.
          </p>
        </div>
      </section>
      <div className="wrap quote-grid">
        <QuoteForm />
        <aside>
          <p className="eyebrow" style={{ marginBottom: "1.2rem" }}>
            Fale direto com a gente
          </p>
          <a className="contact-card" href={whatsappUrl(DEFAULT_WPP)} target="_blank" rel="noopener">
            <span className="label">WhatsApp</span>
            <b>{SITE.whatsappLabel}</b>
          </a>
          <a className="contact-card" href={`tel:${SITE.phone}`}>
            <span className="label">Telefone</span>
            <b>{SITE.phoneLabel}</b>
          </a>
          <a className="contact-card" href={`mailto:${SITE.email}`}>
            <span className="label">E-mail</span>
            <b style={{ fontSize: "1.05rem" }}>{SITE.email}</b>
          </a>
          <div className="prose" style={{ marginTop: "1.6rem", fontSize: ".92rem" }}>
            <p>
              <strong>Localização:</strong> Maringá, Paraná
              <br />
              <strong>Atendimento:</strong> todo o Brasil, com entrega pelos Correios e transportadoras
              <br />
              <strong>Prazo:</strong> sob consulta, conforme o produto
              <br />
              <strong>Fundação:</strong> 1985, mais de 40 anos de tradição artesanal
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
