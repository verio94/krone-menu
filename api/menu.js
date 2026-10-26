// Legge la pagina del sito Krone e restituisce il testo (una riga per elemento).
const ALLOWED = "trattoria-pizzeria-krone.de";

function decode(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function htmlToLines(html) {
  html = html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, "");
  html = html.replace(/<br\s*\/?>/gi, "\n");
  html = html.replace(/<\/(p|div|h[1-6]|li|ul|ol|tr|td|th|section|article|header|footer|a|button)>/gi, "\n");
  html = html.replace(/<[^>]+>/g, "");
  return decode(html)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const u = new URL(String(req.query.url || ""));
    const okHost = u.hostname === ALLOWED || u.hostname === "www." + ALLOWED;
    if (u.protocol !== "https:" || !okHost) {
      return res.status(400).json({ error: "Link non valido: deve essere del sito " + ALLOWED });
    }
    const r = await fetch(u.origin + u.pathname + u.search, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
        "Accept-Language": "de-DE,de;q=0.9",
      },
    });
    const html = await r.text();
    return res.status(200).json({ status: r.status, text: htmlToLines(html) });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
module.exports.htmlToLines = htmlToLines;
