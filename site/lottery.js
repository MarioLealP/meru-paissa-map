// The housing lottery runs on a fixed 9-day cycle: 5 days of entries, then 4 days of results.
// Every phase end PaissaDB reports lands on that grid, so one timestamp from the world's data
// is enough to place the whole schedule.

const DAY = 86400;
const ENTRY = 5 * DAY;
const CYCLE = 9 * DAY;

// any known entry-period end in the data (phase 1 ends one, phases 2/3 end ENTRY before the next)
function anchor(world) {
  let best = null;
  for (const d of world.districts) {
    for (const p of d.open_plots) {
      if (!p.lotto_phase_until) continue;
      const entryEnd = p.lotto_phase === 1 ? p.lotto_phase_until : p.lotto_phase_until + ENTRY;
      if (best === null || entryEnd > best) best = entryEnd;
    }
  }
  return best;
}

// {entries: bool, start, end, next} in unix seconds, or null if the world has no lottery data
export function cycle(world, now = Date.now() / 1000) {
  const a = anchor(world);
  if (a === null) return null;
  const start = a - ENTRY + Math.floor((now - (a - ENTRY)) / CYCLE) * CYCLE;
  const entryEnd = start + ENTRY;
  return now < entryEnd
    ? { entries: true, end: entryEnd, nextEnd: start + CYCLE }
    : { entries: false, end: start + CYCLE, nextEnd: start + CYCLE + ENTRY };
}
