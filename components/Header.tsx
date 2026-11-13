"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { whatsappUrl, DEFAULT_WPP } from "@/lib/site";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/#legado", label: "Nossa História" },
  { href: "/#processo", label: "Processo" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/orcamento", label: "Orçamento" },
];

export default function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setSolid(window.scrollY > 40);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header className={`hdr ${solid || pathname !== "/" ? "is-solid" : ""}`}>
        <Link href="/" className="hdr-logo" aria-label="Fundição Tropical, página inicial">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo-fundicao-tropical.webp" alt="" width={42} height={42} />
          <span>
            <b>
              Fundição <em>Tropical</em>
            </b>
            <small>Maringá · PR · Desde 1985</small>
          </span>
        </Link>
        <nav className="hdr-nav" aria-label="Principal">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="lnk">
              {n.label}
            </Link>
          ))}
          <a className="btn btn-sm btn-solid" href={whatsappUrl(DEFAULT_WPP)} target="_blank" rel="noopener">
            WhatsApp
          </a>
        </nav>
        <button
          className={`burger ${open ? "open" : ""}`}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="hdr-progress" ref={bar} aria-hidden />
      </header>
      <nav className={`mnav ${open ? "open" : ""}`} aria-label="Menu" aria-hidden={!open}>
        {NAV.map((n, i) => (
          <Link key={n.href} href={n.href} className="m" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            {n.label}
            <span>0{i + 1}</span>
          </Link>
        ))}
        <a
          className="btn btn-solid"
          style={{ marginTop: "1.5rem" }}
          href={whatsappUrl(DEFAULT_WPP)}
          target="_blank"
          rel="noopener"
          tabIndex={open ? 0 : -1}
        >
          Falar no WhatsApp
        </a>
      </nav>
    </>
  );
}
