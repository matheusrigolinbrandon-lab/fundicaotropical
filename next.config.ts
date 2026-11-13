import type { NextConfig } from "next";

const config: NextConfig = {
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/index_completo.html", destination: "/catalogo", permanent: true },
      { source: "/ostensorios.html", destination: "/catalogo/ostensorios", permanent: true },
      { source: "/apliques_moveis.html", destination: "/catalogo/apliques", permanent: true },
      { source: "/fundicao1.mp4", destination: "/videos/fundicao1.mp4", permanent: true },
      { source: "/fundicao2.mp4", destination: "/videos/fundicao2.mp4", permanent: true },
    ];
  },
};
export default config;
