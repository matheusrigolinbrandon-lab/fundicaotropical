import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsFloat from "@/components/WhatsFloat";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-serif", display: "swap" });
const sans = Manrope({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-sans", display: "swap" });
const cond = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-cond", display: "swap" });

export const viewport: Viewport = { themeColor: "#080807", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Fundição Tropical | Fundição artesanal de bronze e alumínio em Maringá PR",
    template: "%s | Fundição Tropical",
  },
  description:
    "Desde 1985 em Maringá-PR: placas de bronze, arte sacra, imagens religiosas, artigos litúrgicos, letras e peças personalizadas em bronze e alumínio. Atendemos todo o Brasil.",
  keywords: [
    "fundição de bronze", "placas de bronze", "arte sacra", "imagens religiosas", "artigos litúrgicos",
    "peças personalizadas em bronze", "fundição artesanal", "fundição em Maringá", "ostensórios", "placas para cemitério",
  ],
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE.name,
    title: "Fundição Tropical — Arte em bronze e alumínio desde 1985",
    description:
      "Placas de cemitério, arte sacra, peças para igreja, ostensórios e apliques em bronze fundido. Maringá-PR, atendemos todo o Brasil.",
    url: "/",
    images: [{ url: "/img/og-fundicao-tropical.jpg", width: 1200, height: 630, alt: "Fundição Tropical — logo e ostensório em bronze dourado" }],
  },
  twitter: { card: "summary_large_image" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE.name,
  description:
    "Fundição artesanal de peças em bronze e alumínio: placas de cemitério, crucifixos, imagens sacras, peças para igreja, ostensórios, letras e apliques para móveis.",
  url: SITE.url + "/",
  logo: SITE.url + "/img/fundicao-tropical.webp",
  image: SITE.url + "/img/og-fundicao-tropical.jpg",
  telephone: "+55-44-3028-7513",
  email: SITE.email,
  foundingDate: "1985",
  address: { "@type": "PostalAddress", addressLocality: "Maringá", addressRegion: "PR", addressCountry: "BR" },
  areaServed: { "@type": "Country", name: "Brasil" },
  contactPoint: { "@type": "ContactPoint", telephone: "+55-44-99725-3199", contactType: "sales", availableLanguage: "Portuguese" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${serif.variable} ${sans.variable} ${cond.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <Header />
        <main>{children}</main>
        <Footer />
        <WhatsFloat />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
