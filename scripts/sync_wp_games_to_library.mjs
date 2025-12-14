import 'dotenv/config';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';

const DEFAULT_API_BASE = 'https://pyqapi.3331322.xyz';
const DEFAULT_WP_INPUT = 'game_reviews_full.json';
const PLACEHOLDER_RAWG_OFFSET = 900000000;

function getArg(name, fallback = undefined) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
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

async function fetchAllGames(apiBase, token) {
  const items = [];
  let page = 1;
  const limit = 100;
  while (true) {
    const { res, json } = await fetchJson(`${apiBase}/api/library/games?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) break;
    const pageItems = json?.success ? json?.data?.items : json?.data?.items ?? json?.items ?? [];
    if (!Array.isArray(pageItems) || pageItems.length === 0) break;
    items.push(...pageItems);
    page++;
    if (page > 500) break;
  }
  return items;
}

function stripHtmlToText(html) {
  const $ = cheerio.load(html || '');
  const text = $.text();
  return text.replace(/\s+/g, ' ').trim();
}

function buildReview({ wpTitle, wpLink, wpDate, contentHtml, excerptHtml }) {
  const body = stripHtmlToText(contentHtml || '') || stripHtmlToText(excerptHtml || '');
  const parts = [];
  if (body) parts.push(body);
  if (wpDate) parts.push(`WP date: ${wpDate.slice(0, 10)}`);
  if (wpLink) parts.push(`Source: ${wpLink}`);
  return parts.join('\n\n').slice(0, 8000);
}

function guessMappingFile(mappingArg) {
  return mappingArg || null;
}

async function findLatestResultsFile() {
  const files = await fs.readdir('.');
  const candidates = files
    .filter((f) => /^igdb_wp_game_import_\d+\.results\.json$/.test(f))
    .sort();
  return candidates.length ? candidates[candidates.length - 1] : null;
}

async function updateGame(apiBase, token, id, payload) {
  const { res, json, text } = await fetchJson(`${apiBase}/api/library/games/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.ok) return { ok: true, json };
  return { ok: false, status: res.status, message: json?.error || json?.message || text || `HTTP ${res.status}` };
}

async function createGame(apiBase, token, payload) {
  const { res, json, text } = await fetchJson(`${apiBase}/api/library/games`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.ok) return { ok: true, json };
  const msg = json?.error || json?.message || text || `HTTP ${res.status}`;
  const already = typeof msg === 'string' && /already in (your )?library/i.test(msg);
  return { ok: false, already, status: res.status, message: msg };
}

function normalizeTitle(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/['’"“”()（）【】\[\]{}]/g, '')
    .replace(/[，,。.!?:;：；…]/g, ' ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const apiBase = String(process.env.ML_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
  const wpInput = String(getArg('wp', DEFAULT_WP_INPUT));
  const dryRun = !!getArg('dry-run', false);
  const sleepMs = Number(getArg('sleep-ms', '150')) || 150;
  const start = Number(getArg('start', '1')) || 1;
  const limit = Number(getArg('limit', '0')) || 0;
  const mappingArg = String(getArg('mapping', '') || '').trim();
  const mappingFile = guessMappingFile(mappingArg) || (await findLatestResultsFile());
  const createPlaceholders = !(getArg('no-placeholders', false) === true);

  const token = process.env.API_TOKEN || process.env.ML_API_TOKEN || (await login(apiBase, process.env.ML_EMAIL, process.env.ML_PASSWORD));

  const wpRaw = await fs.readFile(wpInput, 'utf-8');
  const wpItems = JSON.parse(wpRaw);
  if (!Array.isArray(wpItems)) throw new Error(`WP input is not an array: ${wpInput}`);

  let mapping = null;
  if (mappingFile) {
    try {
      mapping = JSON.parse(await fs.readFile(mappingFile, 'utf-8'));
    } catch {
      mapping = null;
    }
  }

  const wpSelected = wpItems.slice(Math.max(0, start - 1), limit ? Math.max(0, start - 1) + limit : undefined);
  console.log(`[wp] input=${wpInput} loaded=${wpItems.length} selected=${wpSelected.length}`);
  console.log(`[mapping] ${mappingFile || '(none)'}`);

  const libraryGames = await fetchAllGames(apiBase, token);
  const byRawgId = new Map();
  const byTitle = new Map();
  for (const g of libraryGames) {
    if (g?.rawg_id != null) byRawgId.set(String(g.rawg_id), g);
    const t = normalizeTitle(g?.title || g?.name || '');
    if (t && !byTitle.has(t)) byTitle.set(t, g);
  }
  console.log(`[library] games=${libraryGames.length}`);

  // Build mapping: wpTitle/wpLink -> rawg_id (igdb id stored in rawg_id) when available
  const wpKeyToRawg = new Map();
  if (Array.isArray(mapping)) {
    for (const row of mapping) {
      const rawg = row?.igdb_id;
      if (!rawg) continue;
      if (row?.wpTitle) wpKeyToRawg.set(String(row.wpTitle), String(rawg));
      if (row?.wpLink) wpKeyToRawg.set(String(row.wpLink), String(rawg));
    }
  }

  const results = [];

  for (const wp of wpSelected) {
    const wpId = wp?.id;
    const wpTitle = wp?.title || '';
    const wpLink = wp?.link || '';
    const wpDate = wp?.date || '';
    const titleZh = String(wpTitle || '').trim();

    const review = buildReview({
      wpTitle,
      wpLink,
      wpDate,
      contentHtml: wp?.content_html,
      excerptHtml: wp?.excerpt_html,
    });

    const mappedRawgId = wpKeyToRawg.get(wpTitle) || wpKeyToRawg.get(wpLink) || null;
    let target = null;

    if (mappedRawgId && byRawgId.has(mappedRawgId)) {
      target = byRawgId.get(mappedRawgId);
    } else {
      // fallback: try by existing title match (when placeholders already exist)
      const key = normalizeTitle(wpTitle);
      target = byTitle.get(key) || null;
    }

    if (target?.id) {
      const payload = {
        title_zh: titleZh || null,
        my_review: review || null,
        review: review || null,
      };

      if (dryRun) {
        results.push({ action: 'update', wpTitle, wpLink, id: target.id, rawg_id: target.rawg_id, ok: true, dryRun: true });
        continue;
      }

      const r = await updateGame(apiBase, token, target.id, payload);
      results.push({ action: 'update', wpTitle, wpLink, id: target.id, rawg_id: target.rawg_id, ok: r.ok, status: r.status, error: r.message });
      await new Promise((res) => setTimeout(res, sleepMs));
      continue;
    }

    if (!createPlaceholders) {
      results.push({ action: 'skip', wpTitle, wpLink, ok: false, reason: 'not_found_no_placeholders' });
      continue;
    }

    const placeholderRawgId = typeof wpId === 'number' ? PLACEHOLDER_RAWG_OFFSET + wpId : null;
    if (!placeholderRawgId) {
      results.push({ action: 'skip', wpTitle, wpLink, ok: false, reason: 'missing_wp_id_for_placeholder' });
      continue;
    }

    // If placeholder already exists (e.g. rerun), update it instead of re-creating.
    const existingPlaceholder = byRawgId.get(String(placeholderRawgId));
    if (existingPlaceholder?.id) {
      const payload = {
        title_zh: titleZh || null,
        my_review: review || null,
        review: review || null,
      };

      if (dryRun) {
        results.push({ action: 'update_placeholder', wpTitle, wpLink, id: existingPlaceholder.id, rawg_id: placeholderRawgId, ok: true, dryRun: true });
        continue;
      }

      const r = await updateGame(apiBase, token, existingPlaceholder.id, payload);
      results.push({ action: 'update_placeholder', wpTitle, wpLink, id: existingPlaceholder.id, rawg_id: placeholderRawgId, ok: r.ok, status: r.status, error: r.message });
      await new Promise((res) => setTimeout(res, sleepMs));
      continue;
    }

    const payload = {
      rawg_id: placeholderRawgId,
      title: titleZh || `WP Game ${wpId}`,
      title_zh: titleZh || null,
      status: 'played',
      my_rating: 0,
      completed_date: wpDate ? wpDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      my_review: review || '[PLACEHOLDER] No content',
      review: review || '[PLACEHOLDER] No content',
      platform: '',
      playtime_hours: 0,
    };

    if (dryRun) {
      results.push({ action: 'create_placeholder', wpTitle, wpLink, rawg_id: placeholderRawgId, ok: true, dryRun: true });
      continue;
    }

    const r = await createGame(apiBase, token, payload);
    results.push({ action: 'create_placeholder', wpTitle, wpLink, rawg_id: placeholderRawgId, ok: r.ok, status: r.status, error: r.message });
    await new Promise((res) => setTimeout(res, sleepMs));
  }

  const out = `wp_game_sync_${Date.now()}.results.json`;
  await fs.writeFile(out, JSON.stringify(results, null, 2));

  const tsvEscape = (v) => String(v ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ').trim();
  const updatesTsv = out.replace(/\.results\.json$/, '.updated.tsv');
  const placeholdersTsv = out.replace(/\.results\.json$/, '.placeholders.tsv');

  const updateRows = results
    .filter((r) => (r.action === 'update' || r.action === 'update_placeholder') && r.ok)
    .map((r) => [r.action, r.id ?? '', r.rawg_id ?? '', r.wpTitle ?? '', r.wpLink ?? ''].map(tsvEscape).join('\t'))
    .join('\n');
  const placeholderRows = results
    .filter((r) => r.action === 'create_placeholder' && r.ok)
    .map((r) => [r.rawg_id ?? '', r.wpTitle ?? '', r.wpLink ?? ''].map(tsvEscape).join('\t'))
    .join('\n');

  await fs.writeFile(updatesTsv, `action\tid\trawg_id\twpTitle\twpLink\n${updateRows}\n`);
  await fs.writeFile(placeholdersTsv, `placeholder_rawg_id\twpTitle\twpLink\n${placeholderRows}\n`);

  const updated = results.filter((r) => r.action === 'update' && r.ok).length;
  const created = results.filter((r) => r.action === 'create_placeholder' && r.ok).length;
  const failed = results.filter((r) => r.ok === false).length;
  console.log(`[done] updated=${updated} created=${created} failed=${failed} dryRun=${dryRun ? 'yes' : 'no'}`);
  console.log(`[file] ${out}`);
  console.log(`[file] ${updatesTsv}`);
  console.log(`[file] ${placeholdersTsv}`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
