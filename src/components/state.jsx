"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import * as L from "@/lib/league.js";
import { applySeed } from "@/lib/theme.js";
import { href } from "./ui.jsx";
import { Button, Icon } from "./ui.jsx";

const Ctx = createContext(null);
export const useLeague = () => useContext(Ctx);

export function useNow(ms = 1000, start) {
  const [n, s] = useState(() => start ?? Date.now());
  useEffect(() => { const i = setInterval(() => s(Date.now()), ms); return () => clearInterval(i); }, [ms]);
  return n;
}

/* visitor preferences live in cookies, so the server renders the chosen mode and palette (no flash, no script) */
const PREF_EVENT = "mfl-pref";
const onPrefs = (cb) => { addEventListener(PREF_EVENT, cb); return () => removeEventListener(PREF_EVENT, cb); };
const readPref = (k) => document.cookie.split("; ").find((c) => c.startsWith(k + "="))?.slice(k.length + 1) || null;
const writePref = (k, v) => { document.cookie = v ? `${k}=${v}; path=/; max-age=31536000; samesite=lax` : `${k}=; path=/; max-age=0`; dispatchEvent(new Event(PREF_EVENT)); };
const DARK_Q = "(prefers-color-scheme: dark)";
const useSystemDark = () => useSyncExternalStore(
  (cb) => { const q = matchMedia(DARK_Q); q.addEventListener("change", cb); return () => q.removeEventListener("change", cb); },
  () => matchMedia(DARK_Q).matches, () => false);

/** Visitor theme: the CMS color is the default; a visitor may pick another seed and light/dark/system. */
function useTheme(defaultSeed, server) {
  const usePref = (k) => useSyncExternalStore(onPrefs, () => readPref(k), () => server[k] || null);
  const seed = usePref("mfl-seed"), mode = usePref("mfl-mode") || "system", sysDark = useSystemDark();
  const dark = mode === "system" ? sysDark : mode === "dark";
  useEffect(() => {
    const el = document.documentElement;
    if (mode === "system") delete el.dataset.theme; else el.dataset.theme = mode;
    applySeed(seed && seed !== defaultSeed ? seed : null, dark);
  }, [seed, dark, mode, defaultSeed]);
  return {
    seed: seed || defaultSeed, mode, dark,
    setSeed: (v) => writePref("mfl-seed", v === defaultSeed ? null : v),
    setMode: (v) => writePref("mfl-mode", v === "system" ? null : v),
  };
}

export function LeagueProvider({ initial, user, prefs, children }) {
  const router = useRouter();
  // adopt a fresh server render (navigation refresh, login) while keeping polled updates in between
  const [d, setD] = useState(initial), [seen, setSeen] = useState(initial);
  if (initial !== seen) { setSeen(initial); setD(initial); }
  const now = useNow(1000, initial.now);
  const theme = useTheme(initial.settings.themeColor, prefs);
  const S = d.settings, pts = useMemo(() => ({ w: S.pointsWin, d: S.pointsDraw }), [S.pointsWin, S.pointsDraw]), len = S.matchMinutes;

  /* snackbar + confirm dialog */
  const [snack, setSnack] = useState(null), snackT = useRef();
  const say = (text) => { clearTimeout(snackT.current); setSnack({ text, key: Date.now() }); snackT.current = setTimeout(() => setSnack(null), 3000); };
  const [ask, setAsk] = useState(null);
  const confirm = (o) => new Promise((resolve) => setAsk({ ...o, resolve }));

  /* derived */
  const T = useMemo(() => Object.fromEntries(d.teams.map((t, i) => [t.id, { ...t, hue: (i * 47) % 360 }])), [d.teams]);
  const ms = useMemo(() => L.sortM(d.matches), [d.matches]);
  const rows = useMemo(() => L.stand(d.teams, d.matches, null, pts), [d.teams, d.matches, pts]);
  const prevRank = useMemo(() => L.prevRanks(d.teams, d.matches, pts), [d.teams, d.matches, pts]);
  const k = useMemo(() => L.stats(d.matches), [d.matches]);
  const stars = useMemo(() => L.weekStars(d.matches), [d.matches]);
  const starTeams = useMemo(() => L.weekTeams(d.matches, d.teams, pts), [d.matches, d.teams, pts]);
  const live = ms.filter((m) => m.status === "live"), next = ms.find((m) => m.status === "sched");
  const mclDoc = d.mcl[0];
  const weeks = useMemo(() => [...new Set(ms.map(L.weekOf).filter(Boolean))].sort(), [ms]);
  const role = user?.role || "", admin = role === "admin";
  const refM = role === "referee" ? ms.find((x) => x.id === user.assignedMatch) : null;

  /* live updates: poll fast while a match is live or someone is officiating, slowly otherwise */
  const fast = live.length > 0 || !!role;
  useEffect(() => {
    let stop = false;
    const pull = async () => {
      if (document.hidden) return;
      try { const r = await fetch("/data", { cache: "no-store" }); if (r.ok && !stop) setD(await r.json()); } catch { /* offline: keep last data */ }
    };
    const i = setInterval(pull, fast ? 4000 : 30000), vis = () => !document.hidden && pull();
    document.addEventListener("visibilitychange", vis);
    return () => { stop = true; clearInterval(i); document.removeEventListener("visibilitychange", vis); };
  }, [fast]);

  /** Run a server action; adopt the fresh data it returns or show its error. */
  const run = async (promise, okText) => {
    try {
      const r = await promise;
      if (!r.ok) { say(r.error || "İşlem yapılamadı"); return false; }
      if (r.league) setD(r.league);
      if (okText) say(okText);
      return true;
    } catch { say("Sunucuya ulaşılamadı"); return false; }
  };

  const login = async (email, password) => {
    const r = await fetch("/api/users/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, password }) });
    if (!r.ok) { say(r.status === 401 ? "E-posta veya şifre yanlış" : "Giriş yapılamadı"); return null; }
    const { user: u } = await r.json();
    say(u?.role === "admin" ? "Yönetici girişi yapıldı" : "Hakem girişi yapıldı");
    router.refresh();
    return u;
  };
  const logout = async () => { await fetch("/api/users/logout", { method: "POST", credentials: "include" }).catch(() => {}); router.push("/"); router.refresh(); say("Çıkış yapıldı"); };

  const value = {
    d, S, T, ms, rows, prevRank, k, stars, starTeams, live, next, mclDoc, weeks, now, len, pts,
    user, role, admin, refM, theme, say, confirm, run, login, logout,
    go: (key, id) => router.push(href(key, id)),
    roster: (t) => L.roster(d, t),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" key={snack?.key}
        className={"fixed left-1/2 bottom-24 min-[840px]:bottom-6 z-[100] min-h-12 max-w-[min(560px,calc(100vw-32px))] flex items-center px-4 py-3.5 rounded-xs bg-inverse-surface text-inverse-on-surface shadow-3 transition-all duration-300 ease-decel " + (snack ? "-translate-x-1/2 opacity-100" : "-translate-x-1/2 translate-y-6 opacity-0 pointer-events-none")}>
        {snack?.text}
      </div>
      <ConfirmDialog ask={ask} close={(v) => { ask?.resolve(v); setAsk(null); }} />
    </Ctx.Provider>
  );
}

function ConfirmDialog({ ask, close }) {
  const ref = useRef();
  useEffect(() => { const el = ref.current; if (ask && !el.open) el.showModal(); else if (!ask && el.open) el.close(); }, [ask]);
  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); close(false); }} onClick={(e) => e.target === ref.current && close(false)}
      className="m-auto border-0 p-6 rounded-xl w-[min(400px,calc(100vw-48px))] bg-surface-container-high text-on-surface shadow-3 text-center open:animate-dialog-in backdrop:bg-black/30">
      {ask && (
        <>
          <Icon n={ask.danger ? "delete" : "help"} className={ask.danger ? "text-error" : "text-secondary"} />
          <h2 className="text-headline-sm my-4">{ask.title}</h2>
          {ask.text && <p className="text-body-md text-on-surface-variant text-left">{ask.text}</p>}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="text" onClick={() => close(false)}>Vazgeç</Button>
            <Button variant={ask.danger ? "danger-text" : "text"} onClick={() => close(true)}>{ask.ok || "Tamam"}</Button>
          </div>
        </>
      )}
    </dialog>
  );
}
