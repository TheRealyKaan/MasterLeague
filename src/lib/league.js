/* Master Lig: pure league logic, ported from the original single-file app. No React here. */

export const MATCH_MIN = 60; // total match length incl. stoppage
export const RN = { sf1: "Yarı final", sf2: "Yarı final", f: "Final", t3: "3.lük maçı" };

export const trUp = (s) => String(s).toLocaleUpperCase("tr");
export const initials = (name = "") => trUp(name.split(/\s+/).map((x) => x[0]).join("").slice(0, 2));
export const isGoal = (e) => e.k === "G" || e.k === "OG";

/** Score: manual override (so) wins, otherwise counted from goal events. */
export const sc = (m) => {
  if (m.so) return { h: m.so.h, a: m.so.a };
  let h = 0, a = 0;
  (m.events || []).forEach((e) => { if (isGoal(e)) (e.team === m.home ? h++ : a++); });
  return { h, a };
};

export const sortM = (ms) => [...ms].sort((a, b) => (a.date || "9").localeCompare(b.date || "9") || a.id.localeCompare(b.id));
export const dayOf = (m) => (m.date || "").slice(0, 10);
const p2 = (n) => String(n).padStart(2, "0");
/** Monday of the match's week as YYYY-MM-DD. */
export const weekOf = (m) => {
  if (!m.date) return "";
  const x = new Date(m.date.slice(0, 10) + "T12:00");
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.getFullYear() + "-" + p2(x.getMonth() + 1) + "-" + p2(x.getDate());
};

/* ---------- formatting (tr-TR) ---------- */
const valid = (v) => { const x = new Date(v); return isNaN(x) ? null : x; };
export const fdt = (v) => valid(v)?.toLocaleString("tr-TR", { day: "numeric", month: "short", weekday: "short", hour: "2-digit", minute: "2-digit" }) || "";
export const shortDay = (v) => valid(v)?.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "short" }) || "";
export const hhmm = (v) => valid(v)?.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) || "";
export const dl = (k) => (k ? new Date(k + "T12:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }) : "Tarihi belirlenmemiş");
export const weekLabel = (w) => (w ? new Date(w + "T12:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) + " haftası" : "bu hafta");
export const fromNow = (m, now) => {
  if (!m.date) return "Oynanmadı";
  const x = (m.at ?? new Date(m.date).getTime()) - now;
  if (isNaN(x)) return "Oynanmadı";
  if (x <= 0) return "Saati geldi";
  const mi = Math.floor(x / 60000), h = Math.floor(mi / 60), dd = Math.floor(h / 24);
  return dd ? dd + " gün sonra" : h ? h + " sa " + (mi % 60) + " dk sonra" : mi + " dk sonra";
};
export const rng = (a, b) => {
  const x = new Date(a + "T12:00"), y = new Date(b + "T12:00"), L = { day: "numeric", month: "long", year: "numeric" };
  if (a === b) return y.toLocaleDateString("tr-TR", L);
  return x.getMonth() === y.getMonth()
    ? x.getDate() + "–" + y.toLocaleDateString("tr-TR", L)
    : x.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) + " – " + y.toLocaleDateString("tr-TR", L);
};
/** Goal scorers for one side: ["Ali 12’, 40’", ...] */
export const scorers = (m, t) => {
  const o = {};
  (m.events || []).filter((e) => isGoal(e) && e.team === t).forEach((e) => {
    const n = (e.player || "Gol") + (e.k === "OG" ? " (K.K.)" : "");
    (o[n] = o[n] || []).push(e.min + "’");
  });
  return Object.entries(o).map(([n, v]) => n + " " + v.join(", "));
};

/** Format an epoch instant in the league time zone (same text on server and browser). */
export const fmtAt = (ms, tz, o = { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) => new Date(ms).toLocaleString("tr-TR", { ...o, timeZone: tz });

/* ---------- clock ---------- */
export const minOf = (m, now, len = MATCH_MIN) => (m.startedAt ? Math.min(len, Math.floor((now - m.startedAt) / 60000) + 1) : "");
export const clockOf = (m, now, len = MATCH_MIN) => {
  if (!m.startedAt) return "";
  const x = Math.min(len * 60, Math.max(0, Math.floor((now - m.startedAt) / 1000)));
  return p2(Math.floor(x / 60)) + ":" + p2(x % 60);
};
export const progressOf = (m, now, len = MATCH_MIN) => (m.startedAt ? Math.min(1, Math.max(0, (now - m.startedAt) / (len * 60000))) : 0);

/* ---------- standings ---------- */
export const PTS = { w: 3, d: 1 };

/** League table. MCL matches and scheduled ones are ignored; live scores count immediately. pts: points for a win / draw. */
export function stand(teams, matches, flt, pts = PTS) {
  const o = {};
  teams.forEach((t) => (o[t.id] = { id: t.id, o: 0, g: 0, b: 0, m: 0, ag: 0, yg: 0, p: t.adj || 0, f: [] }));
  sortM(matches).forEach((x) => {
    if (x.status === "sched" || x.stage === "mcl" || (flt && !flt(x))) return;
    const g = sc(x), h = o[x.home], a = o[x.away];
    if (!h || !a) return;
    h.o++; a.o++;
    h.ag += g.h; h.yg += g.a; a.ag += g.a; a.yg += g.h;
    const r = g.h > g.a ? "GM" : g.h < g.a ? "MG" : "BB";
    [[h, r[0]], [a, r[1]]].forEach(([t, k]) => {
      t.p += k === "G" ? pts.w : k === "B" ? pts.d : 0;
      t[k.toLowerCase()]++;
      if (x.status === "done") t.f.push(k);
    });
  });
  const nm = (id) => teams.find((t) => t.id === id)?.name || "";
  return Object.values(o).sort((a, b) => b.p - a.p || b.ag - b.yg - (a.ag - a.yg) || b.ag - a.ag || nm(a.id).localeCompare(nm(b.id), "tr"));
}

/** Rank of each team before the latest played match day (for ▲▼ arrows). */
export function prevRanks(teams, matches, pts = PTS) {
  const st = matches.filter((m) => m.status !== "sched"), lw = st.length ? st.map(dayOf).sort().pop() : "", o = {};
  if (lw) {
    const P = stand(teams, matches, (x) => dayOf(x) < lw, pts);
    if (P.some((r) => r.o)) P.forEach((r, i) => (o[r.id] = i + 1));
  }
  return o;
}

/** Goals (G), assists (A), cards (C) and totals. */
export function stats(matches) {
  const G = {}, A = {}, C = {};
  let tg = 0, yc = 0, rc = 0;
  matches.forEach((m) => m.status !== "sched" && (m.events || []).forEach((e) => {
    if (isGoal(e)) tg++;
    if (e.k === "Y" || e.k === "R") {
      e.k === "R" ? rc++ : yc++;
      const n = (e.player || "").trim();
      if (n) {
        const k = e.team + "|" + n.toLowerCase(), p = (C[k] = C[k] || { n, t: e.team, y: 0, r: 0 });
        e.k === "R" ? p.r++ : p.y++;
      }
    }
    if (e.k !== "G") return;
    [[G, e.player], [A, e.assist]].forEach(([M, n]) => {
      n = (n || "").trim();
      if (!n) return;
      const k = e.team + "|" + n.toLowerCase();
      (M[k] = M[k] || { n, t: e.team, c: 0 }).c++;
    });
  }));
  const so = (M) => Object.values(M).sort((a, b) => b.c - a.c || a.n.localeCompare(b.n, "tr"));
  return { G: so(G), A: so(A), tg, yc, rc, C: Object.values(C).sort((a, b) => b.r - a.r || b.y - a.y) };
}

/** Merged goal+assist list with impact score (2×goal + assist). */
export function playerTotals(k) {
  const PM = {};
  k.G.forEach((p) => { PM[p.t + "|" + p.n.toLowerCase()] = { n: p.n, t: p.t, g: p.c, a: 0 }; });
  k.A.forEach((p) => { const key = p.t + "|" + p.n.toLowerCase(); (PM[key] = PM[key] || { n: p.n, t: p.t, g: 0, a: 0 }).a = p.c; });
  return Object.values(PM);
}

const lastWeekBase = (matches, needEvents) => {
  const st = matches.filter((m) => m.status !== "sched" && (!needEvents || (m.events || []).length)), dated = st.filter((m) => m.date), base = dated.length ? dated : st;
  const lw = base.length ? base.map(weekOf).sort().pop() : "";
  return { lw, list: base.filter((m) => weekOf(m) === lw) };
};

/** Player of the week: most goals*2 + assists in the latest played week. */
export function weekStars(matches) {
  const { lw, list } = lastWeekBase(matches, true), Q = {};
  list.forEach((m) => (m.events || []).forEach((e) => {
    if (e.k !== "G") return;
    [[e.player, "g"], [e.assist, "a"]].forEach(([n, key]) => {
      n = (n || "").trim();
      if (!n) return;
      const k = e.team + "|" + n.toLowerCase(), p = (Q[k] = Q[k] || { n, t: e.team, g: 0, a: 0, w: lw });
      p[key]++;
    });
  }));
  return Object.values(Q).sort((a, b) => b.g * 2 + b.a - (a.g * 2 + a.a) || b.g - a.g);
}

/** Team of the week: points, goal difference, goals scored in the latest played week. */
export function weekTeams(matches, teams, pts = PTS) {
  const { lw, list } = lastWeekBase(matches, false), Q = {};
  list.forEach((m) => {
    const g = sc(m);
    [[m.home, g.h, g.a], [m.away, g.a, g.h]].forEach(([t, f, a]) => {
      const x = (Q[t] = Q[t] || { id: t, o: 0, g: 0, b: 0, m: 0, ag: 0, yg: 0, p: 0, w: lw });
      x.o++; x.ag += f; x.yg += a;
      if (f > a) { x.g++; x.p += pts.w; } else if (f === a) { x.b++; x.p += pts.d; } else x.m++;
    });
  });
  const nm = (id) => teams.find((t) => t.id === id)?.name || "";
  return Object.values(Q).filter((x) => nm(x.id)).sort((a, b) => b.p - a.p || (b.ag - b.yg) - (a.ag - a.yg) || b.ag - a.ag || nm(a.id).localeCompare(nm(b.id), "tr"));
}

/** Win / draw / win % estimate from the standings (home edge +0.12). */
export function predict(rows, m) {
  const r = (id) => { const x = rows.find((y) => y.id === id); return x ? (x.p + 1.5) / (x.o + 3) + (x.o ? ((x.ag - x.yg) / x.o) * 0.08 : 0) : 1; };
  const df = r(m.home) - r(m.away) + 0.12, pw = 1 / (1 + Math.exp(-1.6 * df)), dr = Math.max(0.12, 0.3 - Math.abs(df) * 0.1);
  const h = Math.round((1 - dr) * pw * 100), a = Math.round((1 - dr) * (1 - pw) * 100);
  return [h, 100 - h - a, a];
}

/** Knockout winner; a draw is decided by the penalty winner (pw: "h" | "a"). */
export const winnerOf = (m) => {
  if (!m || m.status !== "done") return null;
  const g = sc(m);
  return g.h > g.a ? m.home : g.h < g.a ? m.away : m.pw === "h" ? m.home : m.pw === "a" ? m.away : null;
};

/** Known player names of a team: roster list + anyone seen in events. */
export function roster(d, t) {
  const s = new Set(d.teams.find((x) => x.id === t)?.pl || []);
  d.matches.forEach((m) => (m.events || []).forEach((e) => {
    if ((e.k === "OG" ? e.ptm : e.team) === t && e.player) s.add(e.player);
    if (e.k === "G" && e.team === t && e.assist) s.add(e.assist);
  }));
  return [...s];
}

/** Per-player season line for one team, incl. injury note. */
export function teamPlayers(d, tid) {
  const t = d.teams.find((x) => x.id === tid), P = Object.create(null);
  const get = (n) => { n = (n || "").trim(); if (!n) return null; const k = n.toLowerCase(); return (P[k] = P[k] || { n, g: 0, a: 0, y: 0, r: 0, og: 0, inj: null }); };
  (t?.pl || []).forEach(get);
  d.matches.forEach((m) => m.status !== "sched" && (m.events || []).forEach((e) => {
    if (e.k === "G" && e.team === tid) { const p = get(e.player), q = get(e.assist); if (p) p.g++; if (q) q.a++; }
    else if (e.k === "OG" && e.ptm === tid) { const p = get(e.player); if (p) p.og++; }
    else if ((e.k === "Y" || e.k === "R") && e.team === tid) { const p = get(e.player); if (p) e.k === "R" ? p.r++ : p.y++; }
  }));
  (d.injuries || []).filter((x) => x.team === tid).forEach((x) => { const p = get(x.player); if (p) p.inj = x; });
  return Object.values(P).sort((a, b) => b.g + b.a - (a.g + a.a) || b.g - a.g || a.n.localeCompare(b.n, "tr"));
}
