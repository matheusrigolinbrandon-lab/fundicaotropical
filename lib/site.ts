export const SITE = {
  name: "Fundição Tropical",
  url: "https://fundicaotropical.vercel.app",
  city: "Maringá",
  state: "PR",
  founded: 1985,
  whatsapp: "5544997253199",
  whatsappLabel: "(44) 99725-3199",
  phone: "+554430287513",
  phoneLabel: "(44) 3028-7513",
  email: "fundicaotropical@gmail.com",
};

export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const DEFAULT_WPP =
  "Olá! Vim pelo site da Fundição Tropical e gostaria de solicitar um orçamento.";

export function productMessage(p: { code: string; name: string }, finish?: string, extra?: string) {
  return (
    "Olá! Vim pelo site da Fundição Tropical e gostaria de fazer um orçamento.\n\n" +
    `Código: ${p.code}\nProduto: ${p.name}` +
    (finish ? `\nAcabamento: ${finish}` : "") +
    (extra ? `\nPersonalização: ${extra}` : "") +
    "\n\nAguardo retorno!"
  );
}
