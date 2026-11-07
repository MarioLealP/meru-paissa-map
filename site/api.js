// PaissaDB client with a browser cache - their backend is a free community service,
// so each world is fetched at most once per TTL unless the Refresh button forces it.

const API = "https://paissadb.zhu.codes";
const TTL_MS = 12 * 60 * 60 * 1000;

function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  const entry = { at: Date.now(), data };
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // storage full or blocked - still works, just uncached
  }
  return entry;
}

async function cached(path, force) {
  const key = `paissa:${path}`;
  const hit = readCache(key);
  if (hit && !force && Date.now() - hit.at < TTL_MS) return hit;
  const res = await fetch(API + path);
  if (!res.ok) {
    if (hit) return hit; // serve stale rather than nothing
    throw new Error(`PaissaDB ${res.status}`);
  }
  return writeCache(key, await res.json());
}

export const getWorlds = () => cached("/worlds", false);
export const getWorld = (id, force = false) => cached(`/worlds/${id}`, force);
