import 'dotenv/config';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';

const DEFAULT_API_BASE = 'https://pyqapi.3331322.xyz';
const DEFAULT_INPUT = 'game_reviews_full.json';
const DEFAULT_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=';

function getArg(name, fallback = undefined) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
}

function normalizeForMatch(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[\u200b-\u200d\uFEFF]/g, '')
    .replace(/['’"“”()（）【】\\[\\]{}]/g, '')
    .replace(/[·•・]/g, ' ')
    .replace(/[，,。.!?:;：；…]/g, ' ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const s = normalizeForMatch(a);
  const t = normalizeForMatch(b);
  if (!s && !t) return 0;
  if (!s) return t.length;
  if (!t) return s.length;
  const dp = Array.from({ length: s.length + 1 }, () => new Array(t.length + 1).fill(0));
  for (let i = 0; i <= s.length; i++) dp[i][0] = i;
  for (let j = 0; j <= t.length; j++) dp[0][j] = j;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[s.length][t.length];
}

function similarityScore(a, b) {
  const s = normalizeForMatch(a);
  const t = normalizeForMatch(b);
  if (!s || !t) return 0;
  if (s === t) return 1;
  if (s.includes(t) || t.includes(s)) return 0.92;
  const dist = levenshtein(s, t);
  const maxLen = Math.max(s.length, t.length);
  return maxLen ? Math.max(0, 1 - dist / maxLen) : 0;
}

function decodeSlugFromLink(link) {
  try {
    const u = new URL(link);
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    // If it contains percent-encoding, decoding usually yields Chinese; keep as-is.
    const decoded = decodeURIComponent(last);
    return decoded;
  } catch {
    return '';
  }
}

function buildQueryCandidates({ title, link, override }) {
  const candidates = [];
  if (override?.query) candidates.push(String(override.query));
  if (override?.igdb_id) return candidates;

  const slug = decodeSlugFromLink(link);
  const slugLooksAscii = slug && /^[a-z0-9-]+$/i.test(slug);
  if (slugLooksAscii) {
    candidates.push(slug.replace(/-/g, ' ').trim());
  }

  const titleStr = String(title || '').trim();
  if (titleStr) candidates.push(titleStr);

  // De-dup, preserve order
  return [...new Set(candidates.filter(Boolean))];
}

function stripHtmlToText(html) {
  const $ = cheerio.load(html || '');
  const text = $.text();
  return text.replace(/\s+/g, ' ').trim();
}

function containsCJK(s) {
  return /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u30FF\uAC00-\uD7AF]/.test(String(s || ''));
}

function toISODate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function randomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function computeCompletedDate(releaseDateISO) {
  const today = new Date();
  const releaseDate = releaseDateISO ? new Date(releaseDateISO) : null;
  if (!releaseDate || Number.isNaN(releaseDate.getTime())) {
    return toISODate(today);
  }
  const minPlayed = addDays(releaseDate, 365);
  const maxPlayed = addDays(releaseDate, 365 * 3);
  const cappedMax = maxPlayed > today ? today : maxPlayed;
  const cappedMin = minPlayed > cappedMax ? cappedMax : minPlayed;
  const spanDays = Math.max(0, Math.round((cappedMax - cappedMin) / (24 * 3600 * 1000)));
  const offsetDays = randomIntInclusive(0, spanDays);
  return toISODate(addDays(cappedMin, offsetDays));
}

function getIGDBImageUrl(imageId, size = 'cover_big') {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, json, text };
}

async function login(apiBase, email, password) {
  const { res, json, text } = await fetchJson(`${apiBase}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok || !json?.success || !json?.data?.access_token) {
    throw new Error(`Login failed: HTTP ${res.status} ${json?.error || json?.message || text || ''}`.trim());
  }
  return json.data.access_token;
}

async function fetchIntegrationStatus(apiBase, token) {
  const { res, json } = await fetchJson(`${apiBase}/api/integrations/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return json?.success ? json.data : json?.data ?? json;
}

async function searchIGDBViaBackend(apiBase, token, query) {
  const url = `${apiBase}/api/search/igdb?query=${encodeURIComponent(query)}`;
  const { res, json, text } = await fetchJson(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`IGDB search failed: HTTP ${res.status} ${json?.error || text || ''}`.trim());
  const data = json?.data ?? json;
  return Array.isArray(data) ? data : [];
}

function scoreIGDBCandidate({ title, query, candidate }) {
  const name = candidate?.name || '';
  const base = Math.max(similarityScore(title, name), similarityScore(query, name));

  const normName = normalizeForMatch(name);
  const normQuery = normalizeForMatch(query);
  const normTitle = normalizeForMatch(title);

  const badKeywords = [
    'mod',
    'promod',
    'season',
    'battle pass',
    'dlc',
    'pack',
    'bundle',
    'soundtrack',
    'skin',
    'weapon',
    'demo',
    'beta',
    'alpha',
    'test',
    'variety map pack',
    'collector',
    'limited',
    'pro edition',
    'deluxe edition',
    'digital deluxe',
    'ultimate edition',
    'game of the year',
    'goty',
    'mode',
  ];

  const badPlatformOnly = (() => {
    const platforms = Array.isArray(candidate?.platforms) ? candidate.platforms : [];
    if (platforms.length === 0) return false;
    const names = platforms.map((p) => String(p?.name || ''));
    const isMobile = (n) => /mobile|android|ios|legacy mobile/i.test(n);
    return names.every(isMobile);
  })();

  const majorPlatformCount = (() => {
    const platforms = Array.isArray(candidate?.platforms) ? candidate.platforms : [];
    const names = platforms.map((p) => String(p?.name || ''));
    const isMajor = (n) => /pc|playstation|xbox|nintendo|switch|steam/i.test(n) && !/legacy mobile/i.test(n);
    return names.filter(isMajor).length;
  })();

  const keywordPenalty = badKeywords.reduce((acc, kw) => acc + (normName.includes(kw) && !normQuery.includes(kw) ? 0.12 : 0), 0);
  const platformPenalty = badPlatformOnly ? 0.12 : 0;
  const platformBonus = Math.min(0.12, majorPlatformCount * 0.03);
  const exactBonus = (normName === normQuery || (!!normTitle && normName === normTitle)) ? 0.15 : 0;

  const score = Math.max(0, Math.min(1, base - keywordPenalty - platformPenalty + platformBonus + exactBonus));
  return { score, base, majorPlatformCount, badPlatformOnly, keywordPenalty, platformPenalty, name };
}

function pickBestIGDBCandidate({ title, query, candidates, minScore }) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const normQuery = normalizeForMatch(query);
  const normTitle = normalizeForMatch(title);

  // If there's an exact textual match, prefer it (avoids picking unrelated sequels/editions).
  const exact = candidates.find((c) => {
    const n = normalizeForMatch(c?.name || '');
    return (normQuery && n === normQuery) || (normTitle && n === normTitle);
  });
  if (exact) {
    const s = scoreIGDBCandidate({ title, query, candidate: exact });
    if (s.score >= minScore) return { candidate: exact, score: s.score };
  }

  const scored = candidates
    .map((c) => {
      const s = scoreIGDBCandidate({ title, query, candidate: c });
      const releaseTs = typeof c?.first_release_date === 'number' ? c.first_release_date : null;
      return { c, s, releaseTs };
    })
    .sort((a, b) => {
      if (b.s.score !== a.s.score) return b.s.score - a.s.score;
      if (b.s.majorPlatformCount !== a.s.majorPlatformCount) return b.s.majorPlatformCount - a.s.majorPlatformCount;
      // Prefer earlier original releases over recent mods when scores tie.
      if (a.releaseTs && b.releaseTs && a.releaseTs !== b.releaseTs) return a.releaseTs - b.releaseTs;
      return 0;
    });

  const best = scored[0];
  if (!best) return null;
  if (best.s.score < minScore) return null;
  return { candidate: best.c, score: best.s.score };
}

async function fetchExistingGameIds(apiBase, token) {
  const ids = new Set();
  let page = 1;
  const limit = 100;
  while (true) {
    const { res, json } = await fetchJson(`${apiBase}/api/library/games?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) break;
    const items = json?.success ? json?.data?.items : json?.data?.items ?? json?.items ?? [];
    if (!Array.isArray(items) || items.length === 0) break;
    for (const it of items) {
      if (it?.igdb_id) ids.add(String(it.igdb_id));
      if (it?.rawg_id) ids.add(String(it.rawg_id));
      if (it?.external_id) ids.add(String(it.external_id));
    }
    page++;
    if (page > 200) break;
  }
  return ids;
}

async function addGameToLibrary(apiBase, token, payload) {
  const { res, json, text } = await fetchJson(`${apiBase}/api/library/games`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.ok) return { ok: true, json };
  const msg = json?.error || json?.message || text || `HTTP ${res.status}`;
  const already = typeof msg === 'string' && /already in (your )?library/i.test(msg);
  const conflict = res.status === 409;
  return { ok: false, already: already || conflict, status: res.status, json, message: msg };
}

async function translateToEnglish(text, endpointBase = DEFAULT_TRANSLATE_ENDPOINT) {
  const url = `${endpointBase}${encodeURIComponent(text)}`;
  const { res, json, text: raw } = await fetchJson(url);
  if (!res.ok) return null;
  // google: [[["translated","original",...],...],...]
  if (Array.isArray(json) && Array.isArray(json[0])) {
    const chunks = json[0].map((x) => (Array.isArray(x) ? x[0] : '')).filter(Boolean);
    const out = chunks.join('').replace(/\s+/g, ' ').trim();
    return out || null;
  }
  // some proxies might return stringified JSON
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
      const chunks = parsed[0].map((x) => (Array.isArray(x) ? x[0] : '')).filter(Boolean);
      const out = chunks.join('').replace(/\s+/g, ' ').trim();
      return out || null;
    }
  } catch {
    // ignore
  }
  return null;
}

async function main() {
  const apiBase = String(process.env.ML_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
  const inputPath = String(getArg('input', DEFAULT_INPUT));
  const dryRun = !!getArg('dry-run', false);
  const limit = Number(getArg('limit', '0')) || 0;
  const start = Number(getArg('start', '1')) || 1;
  const sleepMs = Number(getArg('sleep-ms', '250')) || 250;
  const minScore = Number(getArg('min-score', '0.86')) || 0.86;
  const enableTranslate = getArg('translate', 'true');
  const translateEnabled = !(enableTranslate === 'false' || enableTranslate === false);
  const translateEndpoint = String(getArg('translate-endpoint', DEFAULT_TRANSLATE_ENDPOINT));
  const translateSleepMs = Number(getArg('translate-sleep-ms', String(Math.max(200, sleepMs)))) || Math.max(200, sleepMs);

  const overridesPath = String(getArg('overrides', 'game_title_overrides.json'));
  let overrides = {};
  try {
    overrides = JSON.parse(await fs.readFile(overridesPath, 'utf-8'));
  } catch {
    // optional
  }

  const raw = await fs.readFile(inputPath, 'utf-8');
  const wpItems = JSON.parse(raw);
  if (!Array.isArray(wpItems)) throw new Error(`Input is not an array: ${inputPath}`);

  const selected = wpItems.slice(Math.max(0, start - 1), limit ? Math.max(0, start - 1) + limit : undefined);
  console.log(`[wp] loaded=${wpItems.length} selected=${selected.length} input=${inputPath}`);

  const tokenFromEnv = process.env.API_TOKEN || process.env.ML_API_TOKEN;
  let token = tokenFromEnv;
  if (!token) {
    const email = process.env.ML_EMAIL;
    const password = process.env.ML_PASSWORD;
    if (!email || !password) {
      throw new Error('Missing auth: set API_TOKEN (or ML_API_TOKEN) OR set ML_EMAIL + ML_PASSWORD');
    }
    token = await login(apiBase, email, password);
  }

  const status = await fetchIntegrationStatus(apiBase, token);
  if (status?.igdb?.configured === false) {
    throw new Error('IGDB integration is not configured in your Media Library backend (/admin/settings).');
  }

  const existingIds = await fetchExistingGameIds(apiBase, token);
  console.log(`[library] existing game ids=${existingIds.size}`);

  const results = [];
  const unmatched = [];
  const searchCache = new Map();
  const translateCache = new Map();

  for (const wp of selected) {
    const wpTitle = wp?.title || '';
    const wpLink = wp?.link || '';
    const wpDate = wp?.date || '';
    const override = overrides?.[wpTitle] || overrides?.[wpLink] || null;

    if (override?.skip) {
      results.push({ wpTitle, wpLink, skipped: true, reason: 'override.skip' });
      continue;
    }

    if (override?.igdb_id) {
      const idStr = String(override.igdb_id);
      if (existingIds.has(idStr)) {
        results.push({ wpTitle, wpLink, matched: true, igdb_id: override.igdb_id, skipped: true, reason: 'already_in_library' });
        continue;
      }
    }

    const queryCandidates = buildQueryCandidates({ title: wpTitle, link: wpLink, override });
    if (translateEnabled && containsCJK(wpTitle)) {
      if (!translateCache.has(wpTitle)) {
        const translated = await translateToEnglish(wpTitle, translateEndpoint);
        translateCache.set(wpTitle, translated);
        await new Promise((r) => setTimeout(r, translateSleepMs));
      }
      const translated = translateCache.get(wpTitle);
      if (translated) queryCandidates.unshift(translated);
    }

    let chosen = null;
    let chosenQuery = null;
    let lastCandidates = [];
    let bestNonEmptyCandidates = [];
    let bestNonEmptyQuery = null;
    const candidatesByQuery = [];

    for (const q of queryCandidates) {
      if (!q) continue;
      let candidates = searchCache.get(q);
      if (!candidates) {
        candidates = await searchIGDBViaBackend(apiBase, token, q);
        searchCache.set(q, candidates);
        await new Promise((r) => setTimeout(r, sleepMs));
      }
      lastCandidates = candidates;
      if (Array.isArray(candidates) && candidates.length > 0) {
        if (!bestNonEmptyCandidates.length) {
          bestNonEmptyCandidates = candidates;
          bestNonEmptyQuery = q;
        }
        candidatesByQuery.push({
          query: q,
          topCandidates: candidates.slice(0, 5).map((c) => ({
            id: c?.id,
            name: c?.name,
            first_release_date: c?.first_release_date,
          })),
        });
      }

      if (override?.igdb_id) {
        chosen = candidates.find((c) => String(c?.id) === String(override.igdb_id)) || null;
        chosenQuery = q;
        if (chosen) break;
      }

      const picked = pickBestIGDBCandidate({ title: wpTitle, query: q, candidates, minScore });
      chosen = picked?.candidate || null;
      chosenQuery = q;
      if (chosen) break;

      // If we got candidates but no confident match, don't waste calls on other queries
      // (especially CJK titles that IGDB won't return anyway). We'll report candidates for manual override.
      if (Array.isArray(candidates) && candidates.length > 0) break;
    }

    if (!chosen) {
      unmatched.push({
        wpTitle,
        wpLink,
        wpDate,
        queryCandidates,
        candidatesByQuery,
        bestQuery: bestNonEmptyQuery,
        topCandidates: (bestNonEmptyCandidates || lastCandidates || []).slice(0, 5).map((c) => ({
          id: c?.id,
          name: c?.name,
          first_release_date: c?.first_release_date,
        })),
      });
      results.push({ wpTitle, wpLink, matched: false });
      continue;
    }

    const igdbId = chosen?.id;
    if (!igdbId) {
      results.push({ wpTitle, wpLink, matched: false, error: 'chosen_missing_id' });
      continue;
    }

    if (existingIds.has(String(igdbId))) {
      results.push({ wpTitle, wpLink, matched: true, igdb_id: igdbId, name: chosen?.name, skipped: true, reason: 'already_in_library' });
      continue;
    }

    const releaseISO = chosen?.first_release_date
      ? toISODate(new Date(chosen.first_release_date * 1000))
      : null;
    const completedDate = computeCompletedDate(releaseISO || toISODate(wpDate));

    const myReviewText = stripHtmlToText(wp?.content_html || wp?.excerpt_html || '');
    const myReview = [myReviewText, wpLink ? `Source: ${wpLink}` : ''].filter(Boolean).join('\n\n').slice(0, 8000);

    const payload = {
      my_rating: 0,
      status: 'played',
      my_review: myReview,
      review: myReview,
      completed_date: completedDate,
      rawg_id: igdbId, // backend field name (legacy); value is IGDB id
      title: chosen?.name || wpTitle,
      cover_image_cdn: chosen?.cover?.image_id ? getIGDBImageUrl(chosen.cover.image_id, 'cover_big') : null,
      backdrop_image_cdn: chosen?.screenshots?.[0]?.image_id ? getIGDBImageUrl(chosen.screenshots[0].image_id, 'screenshot_med') : null,
      overview: chosen?.summary || null,
      genres: Array.isArray(chosen?.genres) ? chosen.genres.map((g) => g?.name).filter(Boolean) : null,
      external_rating: typeof chosen?.total_rating === 'number'
        ? Number((chosen.total_rating / 10).toFixed(1))
        : (typeof chosen?.rating === 'number' ? Number((chosen.rating / 10).toFixed(1)) : null),
      release_date: releaseISO,
      platforms: Array.isArray(chosen?.platforms) ? chosen.platforms.map((p) => p?.name).filter(Boolean) : null,
      developers: Array.isArray(chosen?.involved_companies)
        ? chosen.involved_companies.filter((c) => c?.developer).map((c) => c?.company?.name).filter(Boolean)
        : null,
      publishers: Array.isArray(chosen?.involved_companies)
        ? chosen.involved_companies.filter((c) => c?.publisher).map((c) => c?.company?.name).filter(Boolean)
        : null,
      platform: Array.isArray(chosen?.platforms) && chosen.platforms[0]?.name ? chosen.platforms[0].name : '',
      playtime_hours: 0,
    };

    if (dryRun) {
      results.push({ wpTitle, wpLink, matched: true, igdb_id: igdbId, name: chosen?.name, igdb_query: chosenQuery, dryRun: true, completed_date: completedDate });
      existingIds.add(String(igdbId));
      continue;
    }

    const res = await addGameToLibrary(apiBase, token, payload);
    await new Promise((r) => setTimeout(r, sleepMs));

    if (res.ok) {
      results.push({ wpTitle, wpLink, matched: true, igdb_id: igdbId, name: chosen?.name, igdb_query: chosenQuery, imported: true, completed_date: completedDate });
      existingIds.add(String(igdbId));
      continue;
    }

    if (res.already) {
      results.push({ wpTitle, wpLink, matched: true, igdb_id: igdbId, name: chosen?.name, igdb_query: chosenQuery, skipped: true, reason: 'already_in_library' });
      existingIds.add(String(igdbId));
      continue;
    }

    results.push({ wpTitle, wpLink, matched: true, igdb_id: igdbId, name: chosen?.name, igdb_query: chosenQuery, imported: false, status: res.status, error: res.message });
  }

  const outBase = `igdb_wp_game_import_${Date.now()}`;
  await fs.writeFile(`${outBase}.results.json`, JSON.stringify(results, null, 2));
  await fs.writeFile(`${outBase}.unmatched.json`, JSON.stringify(unmatched, null, 2));

  const okCount = results.filter((r) => r.imported).length;
  const skippedCount = results.filter((r) => r.skipped).length;
  const matchedCount = results.filter((r) => r.matched).length;
  console.log(`[done] matched=${matchedCount}/${results.length} imported=${okCount} skipped=${skippedCount} unmatched=${unmatched.length}`);
  console.log(`[files] ${outBase}.results.json`);
  console.log(`[files] ${outBase}.unmatched.json`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
