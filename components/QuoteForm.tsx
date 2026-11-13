"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, findProduct, SHORT, COVER } from "@/lib/catalog";
import { whatsappUrl } from "@/lib/site";
import { WhatsIcon } from "./WhatsFloat";

const CUSTOM = "sob-encomenda";
const TITLES = ["Categoria", "Produto", "Personalização", "Seus dados", "Revisar e enviar"];

export default function QuoteForm() {
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState("");
  const [code, setCode] = useState("");
  const [finish, setFinish] = useState("");
  const [details, setDetails] = useState("");
  const [qty, setQty] = useState("1");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [tried, setTried] = useState(false);

  // chegada pelo catálogo: /orcamento?produto=FT-OST-01
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("produto");
    const hit = c ? findProduct(c) : undefined;
    if (hit) {
      setCat(hit.category.slug);
      setCode(hit.product.code);
      setFinish(hit.product.finishes[0] ?? "");
      setStep(2);
    }
  }, []);

  const category = categories.find((c) => c.slug === cat);
  const product = category?.products.find((p) => p.code === code);
  const digits = phone.replace(/\D/g, "");
  const errors = {
    name: name.trim().length < 2 ? "Informe seu nome." : "",
    phone: digits.length < 10 || digits.length > 13 ? "Informe um telefone com DDD." : "",
    details: cat === CUSTOM && details.trim().length < 5 ? "Descreva a peça que você precisa." : "",
  };

  const message = useMemo(() => {
    const l = ["Olá! Vim pelo site da Fundição Tropical e gostaria de solicitar um orçamento.", ""];
    l.push(`Categoria: ${cat === CUSTOM ? "Produto sob encomenda" : category?.title ?? "-"}`);
    if (product) l.push(`Código: ${product.code}`, `Produto: ${product.name}`);
    else if (cat !== CUSTOM) l.push("Produto: ainda não escolhi, preciso de orientação");
    if (finish) l.push(`Acabamento: ${finish}`);
    if (qty && qty !== "1") l.push(`Quantidade: ${qty}`);
    if (details.trim()) l.push(`Personalização: ${details.trim()}`);
    l.push("", `Nome: ${name.trim()}`, `Contato: ${phone.trim()}`);
    if (city.trim()) l.push(`Cidade: ${city.trim()}`);
    l.push("", "Aguardo retorno!");
    return l.join("\n");
  }, [cat, category, product, finish, qty, details, name, phone, city]);

  const canNext = [!!cat, true, !errors.details, !errors.name && !errors.phone, true][step];
  const next = () => {
    if (!canNext) return setTried(true);
    setTried(false);
    setStep(cat === CUSTOM && step === 0 ? 2 : step + 1);
  };
  const back = () => {
    setTried(false);
    setStep(cat === CUSTOM && step === 2 ? 0 : step - 1);
  };

  return (
    <div className="panel">
      <div className="stepper" aria-hidden>
        {TITLES.map((t, i) => (
          <div key={t} className={i <= step ? "done" : ""} />
        ))}
      </div>
      <p className="scene-num" aria-live="polite">
        PASSO {step + 1} DE 5 — {TITLES[step].toUpperCase()}
      </p>

      <div style={{ margin: "1.6rem 0 2rem", minHeight: 220 }}>
        {step === 0 && (
          <div className="opt-grid">
            {categories.map((c) => (
              <button
                key={c.slug}
                className={`opt ${cat === c.slug ? "on" : ""}`}
                aria-pressed={cat === c.slug}
                onClick={() => {
                  setCat(c.slug);
                  setCode("");
                  setFinish("");
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={COVER[c.slug]} alt="" loading="lazy" />
                <b>{SHORT[c.slug]}</b>
              </button>
            ))}
            <button
              className={`opt ${cat === CUSTOM ? "on" : ""}`}
              aria-pressed={cat === CUSTOM}
              onClick={() => {
                setCat(CUSTOM);
                setCode("");
                setFinish("");
              }}
              style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
            >
              <b>Sob encomenda</b>
              <small>PEÇA EXCLUSIVA</small>
            </button>
          </div>
        )}

        {step === 1 && category && (
          <div className="opt-grid">
            <button className={`opt ${!code ? "on" : ""}`} aria-pressed={!code} onClick={() => { setCode(""); setFinish(""); }} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <b>Ainda não sei</b>
              <small>QUERO ORIENTAÇÃO</small>
            </button>
            {category.products.map((p) => (
              <button
                key={p.code}
                className={`opt ${code === p.code ? "on" : ""}`}
                aria-pressed={code === p.code}
                onClick={() => {
                  setCode(p.code);
                  setFinish(p.finishes[0] ?? "");
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" loading="lazy" />
                <small>{p.code}</small>
                <b>{p.name}</b>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "grid", gap: "1.2rem" }}>
            {product && (
              <p className="kv">
                <b>Peça escolhida</b>
                {product.code} · {product.name}
              </p>
            )}
            {product && product.finishes.length > 0 && (
              <div>
                <span className="label">Acabamento</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                  {product.finishes.map((f) => (
                    <button key={f} className={`chip ${finish === f ? "on" : ""}`} aria-pressed={finish === f} onClick={() => setFinish(f)}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="label" htmlFor="q-det">
                {cat === CUSTOM ? "Descreva a peça que você precisa" : "Detalhes de personalização (opcional)"}
              </label>
              <textarea
                id="q-det"
                className="field"
                rows={4}
                placeholder="Ex.: nome e datas da placa, medidas, local de instalação…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
              {tried && errors.details && <p className="err" role="alert">{errors.details}</p>}
            </div>
            <div style={{ maxWidth: 160 }}>
              <label className="label" htmlFor="q-qty">
                Quantidade
              </label>
              <input id="q-qty" className="field" type="number" min={1} inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "grid", gap: "1.2rem" }}>
            <div>
              <label className="label" htmlFor="q-name">
                Nome
              </label>
              <input id="q-name" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              {tried && errors.name && <p className="err" role="alert">{errors.name}</p>}
            </div>
            <div>
              <label className="label" htmlFor="q-phone">
                Telefone ou WhatsApp (com DDD)
              </label>
              <input id="q-phone" className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="(44) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
              {tried && errors.phone && <p className="err" role="alert">{errors.phone}</p>}
            </div>
            <div>
              <label className="label" htmlFor="q-city">
                Cidade e estado (opcional)
              </label>
              <input id="q-city" className="field" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
        )}

        {step === 4 && (
          <>
            <p className="lead" style={{ marginBottom: "1rem", fontSize: ".95rem" }}>
              Esta é a mensagem que será aberta no seu WhatsApp. Nada é enviado antes de você tocar em enviar lá.
            </p>
            <pre className="summary">{message}</pre>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
        {step > 0 && (
          <button className="btn btn-ghost" onClick={back}>
            Voltar
          </button>
        )}
        {step < 4 ? (
          <button className="btn btn-solid" onClick={next} aria-disabled={!canNext} style={{ opacity: canNext ? 1 : 0.55 }}>
            Continuar
          </button>
        ) : (
          <a className="btn btn-solid" href={whatsappUrl(message)} target="_blank" rel="noopener">
            <WhatsIcon size={16} /> Enviar pelo WhatsApp
          </a>
        )}
      </div>
      {tried && step === 0 && !cat && <p className="err" role="alert">Escolha uma categoria para continuar.</p>}
    </div>
  );
}
