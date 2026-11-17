const META = {
  id: "rudi-anime-custom",
  name: "Rudi Custom Anime",
  version: "1.0.0",
  type: "anime",
  lang: "id",
  baseUrl: "https://example.com"
};

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  "Referer": META.baseUrl + "/"
};

async function requestText(url) {
  if (typeof globalThis.httpGet === "function") {
    return await globalThis.httpGet(url, HEADERS);
  }
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.text();
}

async function search(query, page = 1) {
  // Ganti endpoint ini sesuai API / endpoint pencarian situs target
  const q = encodeURIComponent(query || "");
  const url = `${META.baseUrl}/api/search?q=${q}&page=${page}`;
  const raw = await requestText(url);
  const data = JSON.parse(raw);

  return (data.results || []).map((item) => ({
    id: String(item.id),
    title: item.title,
    poster: item.poster || "",
    url: item.url || `${META.baseUrl}/anime/${item.id}`
  }));
}

async function getDetail(id) {
  const url = `${META.baseUrl}/api/anime/${encodeURIComponent(id)}`;
  const raw = await requestText(url);
  const item = JSON.parse(raw);

  return {
    id: String(item.id || id),
    title: item.title || "Untitled",
    poster: item.poster || "",
    synopsis: item.synopsis || "",
    status: item.status || "Ongoing",
    // Isi malId (integer) jika tersedia agar tersinkron ke AniList / MyAnimeList
    malId: item.malId ? Number(item.malId) : null
  };
}

async function getEpisodes(detailId) {
  const url = `${META.baseUrl}/api/anime/${encodeURIComponent(detailId)}/episodes`;
  const raw = await requestText(url);
  const data = JSON.parse(raw);

  return (data.episodes || []).map((ep, index) => {
    const num = Number(ep.number ?? index + 1);
    return {
      id: String(ep.id || `${detailId}-ep-${num}`),
      number: num,
      title: ep.title || `Episode ${num}`
    };
  });
}

async function getSources(episodeId) {
  const url = `${META.baseUrl}/api/episode/${encodeURIComponent(episodeId)}/sources`;
  const raw = await requestText(url);
  const data = JSON.parse(raw);

  return (data.sources || []).map((src) => ({
    url: src.url,
    quality: src.quality || "Auto",
    isM3U8: String(src.url || "").includes(".m3u8"),
    headers: {
      ...HEADERS,
      Referer: src.referer || META.baseUrl + "/"
    }
  }));
}

const provider = {
  meta: META,
  search,
  getDetail,
  getEpisodes,
  getSources
};

if (typeof globalThis !== "undefined") {
  globalThis.provider = provider;
}

