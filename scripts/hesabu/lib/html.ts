/**
 * HTML → readable text helpers shared by the scrapers.
 */

import * as cheerio from "cheerio"

type Doc = cheerio.CheerioAPI

/** Visible text only — strips scripts, inline CSS, navigation and other page chrome */
export function readableText($: Doc): string {
  const $c = cheerio.load($.html())
  $c("script, style, noscript, svg, iframe, nav, header, footer, aside, form, .ad, .advertisement, .related, .comments, .menu, .sidebar, .widget").remove()
  const main = ["article", "main", ".entry-content", ".post-content", ".content", "#content", "body"]
    .map((sel) => $c(sel).first().text())
    .find((t) => t.replace(/\s+/g, " ").trim().length > 200) ?? $c("body").text()
  return main.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim()
}

/** Publish date from meta tags, <time>, or JSON-LD (ISO string), if any */
export function publishedDate($: Doc): string | undefined {
  const meta =
    $("meta[property='article:published_time']").attr("content") ||
    $("meta[name='date'], meta[name='pubdate'], meta[itemprop='datePublished']").attr("content") ||
    $("time[datetime]").first().attr("datetime")
  if (meta) return meta
  const ld = $('script[type="application/ld+json"]').map((_, e) => $(e).text()).get().join(" ")
  return ld.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1]
}
