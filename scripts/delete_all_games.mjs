import 'dotenv/config';

const DEFAULT_API_BASE = 'https://pyqapi.3331322.xyz';

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

async function listGames(apiBase, token, page, limit) {
  const { res, json, text } = await fetchJson(`${apiBase}/api/library/games?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`List failed: HTTP ${res.status} ${json?.error || json?.message || text || ''}`.trim());
  const items = json?.success ? json?.data?.items : json?.data?.items ?? json?.items ?? [];
  const pagination = json?.success ? json?.data?.pagination : json?.data?.pagination ?? json?.pagination ?? null;
  return { items: Array.isArray(items) ? items : [], pagination };
}

async function deleteGame(apiBase, token, id) {
  const { res, json, text } = await fetchJson(`${apiBase}/api/library/games/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.ok) return { ok: true };
  return { ok: false, status: res.status, message: json?.error || json?.message || text || `HTTP ${res.status}` };
}

async function main() {
  const apiBase = String(process.env.ML_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
  const dryRun = !!getArg('dry-run', false);
  const yes = !!getArg('yes', false);
  const sleepMs = Number(getArg('sleep-ms', '80')) || 80;

  const token =
    process.env.API_TOKEN ||
    process.env.ML_API_TOKEN ||
    process.env.ML_ACCESS_TOKEN ||
    (process.env.ML_EMAIL && process.env.ML_PASSWORD ? await login(apiBase, process.env.ML_EMAIL, process.env.ML_PASSWORD) : null);

  if (!token) {
    console.error('Missing auth. Set one of: API_TOKEN / ML_API_TOKEN / ML_ACCESS_TOKEN, or ML_EMAIL + ML_PASSWORD.');
    process.exit(1);
  }

  if (!dryRun && !yes) {
    console.error('Refusing to delete without confirmation. Re-run with --yes (or use --dry-run).');
    process.exit(2);
  }

  const limit = 1000;
  let page = 1;
  let total = 0;
  let deleted = 0;
  let failed = 0;

  while (true) {
    const { items } = await listGames(apiBase, token, page, limit);
    if (items.length === 0) break;

    total += items.length;

    for (const it of items) {
      const id = it?.id;
      if (!id) continue;
      if (dryRun) {
        continue;
      }
      const res = await deleteGame(apiBase, token, id);
      if (res.ok) deleted++;
      else {
        failed++;
        console.error(`Failed to delete id=${id}: ${res.status} ${res.message}`);
      }
      await new Promise((r) => setTimeout(r, sleepMs));
    }

    // If backend paging is stable, we can keep incrementing. If it reflows after deletions,
    // restarting from page 1 is safer. We'll do that for non-dry-run.
    if (!dryRun) {
      page = 1;
    } else {
      page++;
    }
  }

  if (dryRun) {
    console.log(`[dry-run] games_to_delete=${total}`);
  } else {
    console.log(`[done] deleted=${deleted} failed=${failed}`);
  }
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});

