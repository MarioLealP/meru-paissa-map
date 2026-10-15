// Turns PaissaDB plot fields into display text.
// PaissaDB numbers wards and plots from 0; plots 30-59 are the subdivision,
// laid out exactly like plots 0-29 of the main division.

const SIZES = ["S", "M", "L"];
const LOTTERY = 1;
const FC = 2;
const PERSONAL = 4;

export const mainPlot = (p) => (p.plot_number % 30) + 1;
export const isSub = (p) => p.plot_number >= 30;

// open > results > closed: what a marker shows when several wards share a plot
export function status(p) {
  if (!(p.purchase_system & LOTTERY)) return "open"; // first come, first served
  if (p.lotto_phase === 1) return "open";
  if (p.lotto_phase === 2) return "results";
  return "closed";
}

const RANK = { open: 0, results: 1, closed: 2 };
export const bestStatus = (plots) =>
  plots.map(status).sort((a, b) => RANK[a] - RANK[b])[0];

function who(ps) {
  if (ps & FC && ps & PERSONAL) return "FC or personal";
  return ps & FC ? "FC only" : "Personal only";
}

function until(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const hours = Math.round((ts * 1000 - Date.now()) / 3.6e6);
  const rel = hours >= 48 ? `${Math.round(hours / 24)}d` : `${hours}h`;
  return ` until ${d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} (${rel})`;
}

function phase(p) {
  if (!(p.purchase_system & LOTTERY)) return "First come, first served";
  if (p.lotto_phase === 1) return `Lottery: entries open${until(p.lotto_phase_until)}`;
  if (p.lotto_phase === 2) return `Lottery: results${until(p.lotto_phase_until)}`;
  if (p.lotto_phase === 3) return `Lottery: unavailable${until(p.lotto_phase_until)}`;
  return "Lottery: phase unknown (not swept recently)";
}

export const ago = (ms) => {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min}m ago`;
  if (min < 48 * 60) return `${Math.round(min / 60)}h ago`;
  return `${Math.round(min / 1440)}d ago`;
};

export function describe(p) {
  const where = isSub(p) ? `Ward ${p.ward_number + 1} · Sub plot ${p.plot_number + 1}` : `Ward ${p.ward_number + 1} · Plot ${p.plot_number + 1}`;
  const entries = p.lotto_entries != null ? ` · ${p.lotto_entries} entries` : "";
  return {
    title: where,
    lines: [
      `${SIZES[p.size]} · ${p.price.toLocaleString()} gil · ${who(p.purchase_system)}`,
      phase(p) + entries,
      `Seen ${ago(Date.now() - p.last_updated_time * 1000)}`,
    ],
  };
}
