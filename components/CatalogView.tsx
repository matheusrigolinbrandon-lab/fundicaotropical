"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { categories, declaredTotal, SHORT, type Category, type Product } from "@/lib/catalog";
import { productMessage, whatsappUrl } from "@/lib/site";
import { WhatsIcon } from "./WhatsFloat";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Row = { p: Product; c: Category };

export default function CatalogView({ slug }: { slug?: string }) {
  const current = slug ? categories.find((c) => c.slug === slug) : undefined;
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [finish, setFinish] = useState("");
  const [open, setOpen] = useState<Row | null>(null);

  const rows: Row[] = useMemo(
    () => (current ? [current] : categories).flatMap((c) => c.products.map((p) => ({ p, c }))),
    [current],
  );
  const finishes = useMemo(() => [...new Set(rows.flatMap((r) => r.p.finishes))].sort(), [rows]);
  const shown = useMemo(() => {
    const nq = norm(q.trim());
    return rows.filter(
      ({ p }) =>
        (!tag || p.tags.includes(tag)) &&
        (!finish || p.finishes.includes(finish)) &&
        (!nq || norm(p.name).includes(nq) || norm(p.code).includes(nq) || norm(p.description).includes(nq)),
    );
  }, [rows, q, tag, finish]);

  const total = current ? declaredTotal(current) : 0;
  const extra = current ? total - current.products.length : 0;

  return (
    <>
      <div className="cat-tabs">
        <div className="wrap row" role="tablist" aria-label="Categorias">
          <Link href="/catalogo" className={!current ? "on" : ""} scroll={false}>
            Todas
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/catalogo/${c.slug}`} className={current?.slug === c.slug ? "on" : ""} scroll={false}>
              {SHORT[c.slug]}
            </Link>
          ))}
        </div>
      </div>

      <div className="wrap">
        <div className="tools">
          <div className="grow">
            <input
              className="field"
              type="search"
              placeholder="Buscar por nome ou código…"
              aria-label="Buscar produto por nome ou código"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {finishes.length > 0 && (
            <select className="field" style={{ width: "auto", minWidth: 210 }} value={finish} onChange={(e) => setFinish(e.target.value)} aria-label="Filtrar por acabamento">
              <option value="">Todos os acabamentos</option>
              {finishes.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          )}
        </div>
        {current && current.filters.length > 0 && (
          <div className="tools" style={{ paddingTop: ".6rem" }}>
            <button className={`chip ${!tag ? "on" : ""}`} onClick={() => setTag("")}>
              Todos
            </button>
            {current.filters.map((f) => (
              <button key={f.tag} className={`chip ${tag === f.tag ? "on" : ""}`} onClick={() => setTag(tag === f.tag ? "" : f.tag)}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="count" aria-live="polite">
          <span>
            {shown.length} {shown.length === 1 ? "peça" : "peças"}
            {current && extra > 0 && !q && !tag && !finish ? ` no site · outras ${extra} sob consulta` : ""}
          </span>
          <span>{current ? current.filtersNote.replace(/^✦\s*/, "") : "Bronze e alumínio · Desde 1985"}</span>
        </div>

        {shown.length ? (
          <div className="pgrid">
            {shown.map((r) => (
              <Card key={r.p.code} row={r} onOpen={() => setOpen(r)} />
            ))}
          </div>
        ) : (
          <p className="empty">
            Nenhuma peça encontrada com esses filtros.{" "}
            <button
              style={{ color: "var(--glow)", textDecoration: "underline" }}
              onClick={() => {
                setQ("");
                setTag("");
                setFinish("");
              }}
            >
              Limpar filtros
            </button>
          </p>
        )}
      </div>

      <div className="cta-band">
        <div className="wrap">
          <h2 className="h2">
            Precisa de uma peça <em>sob medida?</em>
          </h2>
          <p className="lead" style={{ margin: "1rem auto 2rem" }}>
            Fabricamos peças personalizadas em bronze e alumínio. Atendemos todo o Brasil.
          </p>
          <Link className="btn btn-solid" href="/orcamento">
            Solicitar orçamento
          </Link>
        </div>
      </div>

      {open && <ProductModal row={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Card({ row, onOpen }: { row: Row; onOpen: () => void }) {
  const { p } = row;
  return (
    <article className="pcard">
      <button className="ph" onClick={onOpen} aria-label={`Ver detalhes de ${p.name}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt={p.name} loading="lazy" />
        {p.badge && <span className="badge">{p.badge}</span>}
      </button>
      <div className="bd">
        <span className="code">{p.code}</span>
        <h3>{p.name}</h3>
        <p>{p.description}</p>
      </div>
      <div className="ft">
        <button className="btn btn-sm btn-ghost" onClick={onOpen}>
          Detalhes
        </button>
        <a className="btn btn-sm btn-solid" href={whatsappUrl(productMessage(p))} target="_blank" rel="noopener">
          <WhatsIcon size={14} /> Orçamento
        </a>
      </div>
    </article>
  );
}

function ProductModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const { p, c } = row;
  const [finish, setFinish] = useState(p.finishes[0] ?? "");
  const [note, setNote] = useState("");
  const [zoom, setZoom] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={p.name} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} aria-label="Fechar" autoFocus>
          ✕
        </button>
        <button className={`modal-img ${zoom ? "zoom" : ""}`} onClick={() => setZoom(!zoom)} aria-label={zoom ? "Reduzir imagem" : "Ampliar imagem"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt={p.name} />
        </button>
        <div className="modal-info">
          <span className="eyebrow">{c.title}</span>
          <h2 className="h2" style={{ fontSize: "clamp(1.6rem,2.6vw,2.2rem)" }}>
            {p.name}
          </h2>
          <p className="kv">
            <b>Código</b>
            {p.code}{" "}
            <button
              style={{ color: "var(--glow)", marginLeft: ".5rem", textDecoration: "underline", fontSize: ".82rem" }}
              onClick={() =>
                navigator.clipboard?.writeText(p.code).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                })
              }
            >
              {copied ? "Copiado ✓" : "Copiar"}
            </button>
          </p>
          <p className="kv">
            <b>Descrição</b>
            {p.description}
          </p>
          {p.example && <p className="kv" style={{ fontStyle: "italic", color: "var(--glow)" }}>{p.example}</p>}
          {p.application && (
            <p className="kv">
              <b>Aplicação</b>
              {p.application}
            </p>
          )}
          {p.finishes.length > 0 && (
            <div>
              <span className="label">Acabamento</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                {p.finishes.map((f) => (
                  <button key={f} className={`chip ${finish === f ? "on" : ""}`} onClick={() => setFinish(f)} aria-pressed={finish === f}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="label" htmlFor="pers">
              Personalização (opcional)
            </label>
            <textarea
              id="pers"
              className="field"
              rows={2}
              placeholder="Ex.: nome, datas, medidas, quantidade…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <a className="btn btn-solid" href={whatsappUrl(productMessage(p, finish, note.trim()))} target="_blank" rel="noopener">
            <WhatsIcon size={16} /> Pedir orçamento desta peça
          </a>
          <Link className="btn btn-sm btn-ghost" href={`/orcamento?produto=${p.code}`}>
            Orçamento detalhado
          </Link>
        </div>
      </div>
    </div>
  );
}
