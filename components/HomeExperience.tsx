"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Foundry } from "@/lib/foundry";
import { categories, COVER } from "@/lib/catalog";
import { whatsappUrl, DEFAULT_WPP } from "@/lib/site";
import { WhatsIcon } from "./WhatsFloat";

const STEPS = [
  { at: 0.0, label: "Metal sólido" },
  { at: 0.12, label: "Aquecimento no forno" },
  { at: 0.34, label: "Metal em estado líquido" },
  { at: 0.52, label: "Vazamento no molde" },
  { at: 0.86, label: "Resfriamento e solidificação" },
];

const TIMELINE = [
  ["1985", "Fundação da empresa", "Santo funda a Fundição Tropical em Maringá, PR, com foco em arte sacra e peças memoriais em bronze."],
  ["1990", "Expansão do catálogo", "Letras em bronze, ostensórios e peças para igrejas de toda a região do Paraná."],
  ["1998", "Reconhecimento regional", "Consolidação como referência no Paraná, atendendo cemitérios e igrejas em dezenas de municípios."],
  ["2005", "Atendimento nacional", "Clientes de todo o Brasil passam a ser atendidos com peças personalizadas."],
  ["2012", "Modernização", "Investimento em novas técnicas de fundição mantendo o acabamento artesanal da marca."],
  ["2025", "Plataforma digital", "Transformação digital levando 40 anos de tradição artesanal para o ambiente online."],
];

const VALUES = ["Tradição", "Qualidade", "Fé", "Família", "Honestidade", "Durabilidade", "Arte", "Respeito", "Comprometimento"];

export default function HomeExperience() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lite =
      window.matchMedia("(max-width: 820px)").matches ||
      (navigator.hardwareConcurrency || 8) <= 4 ||
      ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8) <= 4;

    let foundry: Foundry | null = null;
    let dead = false;
    const p = { a: 0, b: 0, c: 0, d: 0 };
    const push = () => foundry?.setStory(p.a + p.b + p.c + p.d);

    if (reduced) setFallback(true);
    else
      import("@/lib/foundry")
        .then(({ createFoundry }) => {
          if (dead || !canvas.current) return;
          try {
            foundry = createFoundry(canvas.current, { lite });
            push();
          } catch {
            setFallback(true);
          }
        })
        .catch(() => setFallback(true));

    const ctx = gsap.context(() => {
      const scrub = (id: string, key: keyof typeof p, extra?: (v: number) => void) =>
        ScrollTrigger.create({
          trigger: id,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (st) => {
            p[key] = st.progress;
            push();
            extra?.(st.progress);
          },
        });

      scrub("#inicio", "a", (v) => {
        gsap.set(".hero-copy", { opacity: 1 - Math.min(1, v * 2.4), y: -v * 120 });
        gsap.set(".scroll-hint", { opacity: 1 - Math.min(1, v * 8) });
      });
      scrub("#processo", "b", (v) => {
        let i = 0;
        STEPS.forEach((s, k) => v >= s.at && (i = k));
        setStep(i);
        gsap.set(".process-copy", { opacity: Math.min(1, v * 8) * (1 - Math.max(0, (v - 0.94) * 16)) });
        document.querySelectorAll<HTMLElement>(".step .bar i").forEach((el, k) => {
          const a = STEPS[k].at, b = STEPS[k + 1]?.at ?? 1;
          el.style.transform = `scaleX(${Math.min(1, Math.max(0, (v - a) / (b - a)))})`;
        });
      });
      scrub("#arte", "c", (v) => {
        gsap.set(".art-copy", { opacity: Math.min(1, v * 6) * (1 - Math.max(0, (v - 0.92) * 12)) });
        document.querySelectorAll<HTMLElement>(".detail-tags span").forEach((el, k) => {
          el.style.opacity = String(Math.min(1, Math.max(0, (v - 0.3 - k * 0.1) * 8)));
        });
      });
      // encerramento: a cena volta enquanto a seção entra na tela
      ScrollTrigger.create({
        trigger: "#contato",
        start: "top bottom",
        end: "bottom bottom",
        onUpdate: (st) => {
          p.d = st.progress;
          push();
          gsap.set(".final-copy", { opacity: Math.min(1, Math.max(0, (st.progress - 0.3) * 4)), y: (1 - Math.min(1, st.progress * 1.6)) * 40 });
        },
      });
      // pausa o WebGL enquanto o showroom e o legado cobrem a tela
      ScrollTrigger.create({
        trigger: "#colecao",
        start: "top top",
        endTrigger: "#contato",
        end: "top bottom",
        onToggle: (st) => foundry?.setActive(!st.isActive),
      });

      if (!reduced) {
        ScrollTrigger.batch("[data-reveal]", {
          start: "top 88%",
          once: true,
          onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.09 }),
        });
        gsap.from(".hero-copy > *", { opacity: 0, y: 34, duration: 1.4, ease: "power3.out", stagger: 0.14, delay: 0.35 });
      }
    }, root);

    const onResize = () => foundry?.resize();
    window.addEventListener("resize", onResize);

    return () => {
      dead = true;
      window.removeEventListener("resize", onResize);
      ctx.revert();
      foundry?.dispose();
    };
  }, []);

  // inclinação 3D dos pedestais (só com mouse)
  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget.querySelector<HTMLElement>(".plinth");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 7}deg)`;
  };
  const untilt = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget.querySelector<HTMLElement>(".plinth");
    if (el) el.style.transform = "";
  };
  const slide = (dir: number) => {
    const t = track.current;
    if (t) t.scrollBy({ left: dir * Math.min(t.clientWidth * 0.8, 520), behavior: "smooth" });
  };

  return (
    <div ref={root}>
      <div className="stage" aria-hidden>
        {fallback ? <div className="stage-fallback" /> : <canvas ref={canvas} />}
        <div className="stage-vignette" />
      </div>

      {/* CENA 01 — ORIGEM */}
      <section id="inicio" className="scene" style={{ height: "230vh" }}>
        <div className="pin scrim-l">
          <div className="wrap rel">
            <div className="hero-copy" style={{ maxWidth: "46rem" }}>
              <p className="eyebrow">Maringá · Paraná · Desde 1985</p>
              <h1 className="display" style={{ margin: "1.6rem 0 1.4rem" }}>
                Mais que metal.
                <br />
                Uma história <em>moldada pelo tempo.</em>
              </h1>
              <p className="lead">Desde 1985, transformamos bronze e alumínio em peças que atravessam gerações.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".8rem", marginTop: "2.2rem" }}>
                <a className="btn btn-solid" href="#processo">
                  Conheça nossa arte
                </a>
                <Link className="btn btn-ghost" href="/catalogo">
                  Ver catálogo
                </Link>
              </div>
            </div>
          </div>
          <div className="scroll-hint" aria-hidden>
            Role para entrar
            <i />
          </div>
        </div>
      </section>

      {/* CENA 02 — PROCESSO */}
      <section id="processo" className="scene" style={{ height: "430vh" }}>
        <div className="pin top scrim-l">
          <div className="wrap rel">
            <div className="process-copy" style={{ maxWidth: "34rem", opacity: 0 }}>
              <p className="scene-num">02 — O PROCESSO</p>
              <h2 className="h2" style={{ margin: "1rem 0" }}>
                Da matéria-prima <em>à eternidade.</em>
              </h2>
              <p className="lead">
                Cada peça nasce de um processo artesanal que combina experiência, precisão e dedicação.
              </p>
              <ol className="steps">
                {STEPS.map((s, i) => (
                  <li key={s.label} className={`step ${i <= step ? "on" : ""}`}>
                    <b>0{i + 1}</b>
                    <span>{s.label}</span>
                    <div className="bar">
                      <i />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Registros reais */}
      <section className="solid-soft" aria-labelledby="reel-t">
        <div className="wrap reel">
          <div>
            <p className="eyebrow" data-reveal>
              Registros reais da nossa oficina
            </p>
            <h2 id="reel-t" className="h2" style={{ margin: "1.2rem 0" }} data-reveal>
              O bronze <em>sendo fundido.</em>
            </h2>
            <p className="lead" data-reveal>
              Cada peça começa com alumínio ou bronze derretido a mais de 700°C. Assista ao processo artesanal que
              fazemos há mais de 40 anos.
            </p>
          </div>
          <figure data-reveal>
            <video controls playsInline preload="none" poster="/img/poster-fundicao1.jpg" src="/videos/fundicao1.mp4" />
            <figcaption>Derretimento do metal</figcaption>
          </figure>
          <figure data-reveal>
            <video controls playsInline preload="none" poster="/img/poster-fundicao2.jpg" src="/videos/fundicao2.mp4" />
            <figcaption>Metal em estado líquido</figcaption>
          </figure>
        </div>
      </section>

      {/* CENA 03 — ARTE */}
      <section id="arte" className="scene" style={{ height: "330vh" }}>
        <div className="pin top scrim-l">
          <div className="wrap rel">
            <div className="art-copy" style={{ maxWidth: "32rem", opacity: 0 }}>
              <p className="scene-num">03 — A ARTE</p>
              <h2 className="h2" style={{ margin: "1rem 0" }}>
                A arte está <em>nos detalhes.</em>
              </h2>
              <p className="lead">
                Do molde nasce a peça. Depois vêm as mãos: rebarbação, polimento e acabamento, até o bronze ganhar o
                brilho que vai durar décadas.
              </p>
              <div className="detail-tags">
                {["Textura", "Relevo", "Brilho", "Acabamento", "Detalhe artesanal"].map((t) => (
                  <span key={t} style={{ opacity: 0 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CENA 04 — COLEÇÃO */}
      <section id="colecao" className="gallery" aria-labelledby="col-t">
        <div className="wrap gallery-head">
          <div>
            <p className="scene-num" data-reveal>
              04 — A COLEÇÃO
            </p>
            <h2 id="col-t" className="h2" style={{ marginTop: "1rem" }} data-reveal>
              Nossas obras, <em>em exposição.</em>
            </h2>
            <p className="lead" style={{ marginTop: "1rem" }} data-reveal>
              Oito linhas de peças em bronze e alumínio. Escolha uma para ver o catálogo completo.
            </p>
          </div>
          <div className="track-nav" data-reveal>
            <button onClick={() => slide(-1)} aria-label="Peças anteriores">
              ←
            </button>
            <button onClick={() => slide(1)} aria-label="Próximas peças">
              →
            </button>
          </div>
        </div>
        <div className="track" ref={track}>
          {categories.map((c, i) => (
            <article key={c.slug} className="piece" onPointerMove={tilt} onPointerLeave={untilt} data-reveal>
              <Link href={`/catalogo/${c.slug}`}>
                <div className="plinth">
                  <span className="n">0{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={COVER[c.slug]} alt={`${c.title} — peça do catálogo Fundição Tropical`} loading="lazy" />
                  <span className="floor" />
                </div>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <div className="meta">
                  <span>{c.note}</span>
                  <i>Ver catálogo →</i>
                </div>
              </Link>
            </article>
          ))}
          <article className="piece" onPointerMove={tilt} onPointerLeave={untilt} data-reveal>
            <Link href="/orcamento">
              <div className="plinth">
                <span className="n">08</span>
                <span className="bespoke">Sob medida</span>
                <span className="floor" />
              </div>
              <h3>Produtos Sob Encomenda</h3>
              <p>
                Peças exclusivas e personalizadas. Apliques, artesanais, industriais e outros produtos especiais.
                Consulte.
              </p>
              <div className="meta">
                <span>Consulte disponibilidade</span>
                <i>Pedir orçamento →</i>
              </div>
            </Link>
          </article>
        </div>
      </section>

      {/* CENA 05 — LEGADO */}
      <section id="legado" className="legacy" aria-labelledby="leg-t">
        <div className="wrap">
          <p className="scene-num" data-reveal>
            05 — NOSSO LEGADO
          </p>
          <h2 id="leg-t" className="display" style={{ marginTop: "1rem", fontSize: "clamp(2.3rem,5.4vw,4.6rem)" }} data-reveal>
            Uma história construída <em>com as próprias mãos.</em>
          </h2>

          <div className="stats" data-reveal>
            <div>
              <b>40+</b>
              <span>Anos de tradição</span>
            </div>
            <div>
              <b>1985</b>
              <span>Fundação</span>
            </div>
            <div>
              <b>100%</b>
              <span>Empresa familiar</span>
            </div>
            <div>
              <b>Brasil</b>
              <span>Atendimento nacional</span>
            </div>
          </div>

          <div className="cols2">
            <h3 className="h2" style={{ fontSize: "clamp(1.7rem,3vw,2.5rem)" }} data-reveal>
              Quatro décadas em <em>bronze e alumínio</em>
            </h3>
            <div className="prose" data-reveal>
              <p>
                Em <strong>1985</strong>, na cidade de Maringá, no coração do Paraná, nascia a Fundição Tropical.
                Fundada por <strong>Santo</strong>, um jovem empreendedor que desde cedo demonstrou que trabalho duro,
                dedicação e amor pelo que faz são os ingredientes de uma história duradoura.
              </p>
              <p>
                Desde os primeiros anos, a empresa se especializou em peças que tocam a alma:{" "}
                <strong>crucifixos, arte sacra, letras em bronze, ostensórios e placas para cemitério</strong>. Cada
                produto é resultado de um processo artesanal cuidadoso, onde técnica e devoção caminham lado a lado.
              </p>
              <p>
                Ao longo de mais de quatro décadas, a Fundição Tropical construiu sua reputação atendendo igrejas,
                capelas, cemitérios, famílias e colecionadores em todo o Brasil — sempre mantendo o compromisso com a
                qualidade que só a tradição familiar pode garantir.
              </p>
            </div>
          </div>

          <div className="founder">
            <figure className="founder-photo" data-reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/santo-fundador.webp" alt="Santo, fundador da Fundição Tropical" loading="lazy" />
              <figcaption>Santo · Fundador</figcaption>
            </figure>
            <div>
              <p className="eyebrow" data-reveal>
                O fundador
              </p>
              <h3 className="h2" style={{ margin: "1rem 0 .3rem" }} data-reveal>
                Santo
              </h3>
              <p className="scene-num" data-reveal>
                FUNDADOR &amp; MESTRE FUNDIDOR · DESDE 1985
              </p>
              <div className="prose" style={{ marginTop: "1.4rem" }} data-reveal>
                <p>
                  Olá, meu nome é Santo e sou proprietário da Fundição Tropical. É um prazer falar com você. Nossa
                  empresa está presente no mercado há mais de 40 anos, oferecendo qualidade, compromisso e confiança em
                  cada serviço realizado.
                </p>
                <p>
                  Trabalhamos com dedicação e experiência para atender nossos clientes da melhor forma possível, sempre
                  buscando entregar resultados que superem as expectativas.
                </p>
              </div>
              <blockquote className="quote" data-reveal>
                “Posso dizer com sinceridade que amo o que faço. Por isso, quando assumimos um projeto, entregamos não
                apenas um serviço, mas todo o nosso empenho, responsabilidade e comprometimento. Se você escolher
                trabalhar conosco, pode ter certeza de que faremos o nosso melhor para garantir um serviço de
                excelência.”
              </blockquote>
              <p className="scene-num" data-reveal>
                — SANTO, FUNDADOR DA FUNDIÇÃO TROPICAL
              </p>
            </div>
          </div>

          <p className="eyebrow" data-reveal>
            Marcos da nossa história
          </p>
          <ol className="timeline">
            {TIMELINE.map(([y, t, d]) => (
              <li key={y} data-reveal>
                <b>{y}</b>
                <strong>{t}</strong>
                <p>{d}</p>
              </li>
            ))}
          </ol>

          <div className="mvv" data-reveal>
            <div>
              <h4>Missão</h4>
              <p>
                Transformar bronze e alumínio em arte, memória e fé — peças que perpetuam a espiritualidade por
                gerações.
              </p>
            </div>
            <div>
              <h4>Visão</h4>
              <p>
                Ser a referência nacional em fundição sacra e memorial, reconhecida pela qualidade artesanal e
                excelência.
              </p>
            </div>
            <div>
              <h4>Propósito</h4>
              <p>
                Levar arte e tradição familiar a cada cliente com atendimento personalizado e compromisso desde 1985.
              </p>
            </div>
          </div>
          <div className="values" data-reveal>
            {VALUES.map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CENA 06 — A PRÓXIMA OBRA */}
      <section id="contato" className="scene" style={{ height: "200vh" }}>
        <div className="pin top scrim-l">
          <div className="wrap rel">
            <div className="final-copy" style={{ maxWidth: "36rem", opacity: 0 }}>
              <p className="scene-num">
                06 — A PRÓXIMA OBRA
              </p>
              <h2 className="display" style={{ margin: "1rem 0 1.3rem", fontSize: "clamp(2.4rem,5.6vw,4.8rem)" }}>
                Seu projeto merece <em>ser único.</em>
              </h2>
              <p className="lead">
                Transformamos ideias em peças especiais. Entre em contato e solicite um orçamento personalizado.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".8rem", marginTop: "2.2rem" }}>
                <a className="btn btn-solid" href={whatsappUrl(DEFAULT_WPP)} target="_blank" rel="noopener">
                  <WhatsIcon size={16} /> Solicitar orçamento
                </a>
                <Link className="btn btn-ghost" href="/catalogo">
                  Conhecer catálogo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
