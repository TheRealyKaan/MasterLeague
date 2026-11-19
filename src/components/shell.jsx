"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLeague } from "./state.jsx";
import { Poll, TopPlayers, Upcoming } from "./panels.jsx";
import { Button, Chip, cms, Crest, cx, href, Icon, IconButton, Logo, Pulse, Segmented } from "./ui.jsx";
import { SEEDS } from "@/lib/theme.js";
import * as L from "@/lib/league.js";

const TITLE = { live: "Canlı maçlar", table: "Puan durumu", fix: "Fikstür", cal: "Takvim", teams: "Takımlar", news: "Duyurular", stats: "İstatistikler", injury: "Sakatlıklar", about: "Hakkında", ref: "Hakem paneli", admin: "Yönetim", login: "Giriş", mcl: "Master Champions League", home: "Ana sayfa" };

/** All destinations, filtered by what exists and who is signed in. */
function useDestinations() {
  const { live, mclDoc, role, admin } = useLeague();
  return [
    ["home", "Ana sayfa", "home"],
    live.length && ["live", "Canlı", "live_tv", live.length],
    ["table", "Puan", "leaderboard"],
    ["fix", "Fikstür", "event_note"],
    mclDoc && ["mcl", "Champions", "trophy"],
    ["stats", "İstatistik", "query_stats"],
    ["cal", "Takvim", "calendar_month"],
    ["teams", "Takımlar", "groups"],
    ["news", "Duyurular", "campaign"],
    ["injury", "Sakatlıklar", "personal_injury"],
    ["about", "Hakkında", "info"],
    role && ["ref", "Hakem", "sports"],
    admin && ["admin", "Yönetim", "admin_panel_settings"],
    ["login", role ? (admin ? "Yönetici" : "Hakem") : "Giriş", role ? "lock_open" : "lock"],
  ].filter(Boolean);
}

/** Which destination the current URL belongs to (team and match pages light up their parent). */
function useActive() {
  const path = usePathname();
  const seg = path.split("/")[1] || "";
  const map = { "": "home", canli: "live", "puan-durumu": "table", fikstur: "fix", mac: "fix", "champions-league": "mcl", takvim: "cal", takimlar: "teams", duyurular: "news", istatistikler: "stats", sakatliklar: "injury", hakkinda: "about", hakem: "ref", yonetim: "admin", giris: "login" };
  return map[seg] ?? "";
}

const Indicator = ({ on, icon, badge }) => (
  <span className={cx("relative grid place-items-center w-14 h-8 rounded-full transition-colors", on ? "bg-secondary-container text-on-secondary-container" : "group-hover:bg-on-surface/8")}>
    <Icon n={icon} fill={on} />
    {badge ? <span className="absolute -top-0.5 left-8 min-w-4 h-4 px-1 rounded-full bg-error text-on-error text-[11px] font-medium leading-4 text-center">{badge}</span> : null}
  </span>
);

function Rail({ onMenu }) {
  const { S } = useLeague(), all = useDestinations(), act = useActive();
  const main = all.filter(([k]) => ["home", "live", "table", "fix", "mcl", "stats", "teams"].includes(k));
  return (
    <nav aria-label="Ana gezinme" className="hidden min-[840px]:flex flex-col items-center gap-1 sticky top-0 h-screen py-3 bg-surface z-40">
      <IconButton icon="menu" label="Menüyü aç" onClick={onMenu} />
      <Link href="/" aria-label="Ana sayfa" className="state grid place-items-center size-14 rounded-lg bg-primary-container shadow-1 mt-1 mb-5"><Logo src={S.logo} s={36} /></Link>
      <div className="flex flex-col gap-3">
        {main.map(([k, n, ic, badge]) => (
          <Link key={k} href={href(k)} aria-current={act === k ? "page" : undefined}
            className={cx("group flex flex-col items-center gap-1", act === k ? "text-on-surface [&>span:last-child]:font-bold" : k === "live" ? "text-error" : "text-on-surface-variant")}>
            <Indicator on={act === k} icon={ic} badge={badge} /><span className="text-label-md">{n}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function BottomBar({ onMenu }) {
  const { live } = useLeague(), act = useActive();
  const items = [["home", "Ana sayfa", "home"], live.length ? ["live", "Canlı", "live_tv", live.length] : ["table", "Puan", "leaderboard"], ["fix", "Fikstür", "event_note"], ["stats", "İstatistik", "query_stats"]];
  const inMenu = !items.some(([k]) => k === act);
  const cls = (on) => cx("group flex-1 min-w-0 flex flex-col items-center gap-1", on ? "text-on-surface [&>span:last-child]:font-bold" : "text-on-surface-variant");
  return (
    <nav aria-label="Ana gezinme" className="min-[840px]:hidden fixed inset-x-0 bottom-0 z-40 flex h-[calc(80px+env(safe-area-inset-bottom,0px))] px-2 pt-3 pb-[env(safe-area-inset-bottom,0px)] bg-surface-container">
      {items.map(([k, n, ic, badge]) => (
        <Link key={k} href={href(k)} className={cls(act === k)} aria-current={act === k ? "page" : undefined}><Indicator on={act === k} icon={ic} badge={badge} /><span className="text-label-md truncate max-w-full">{n}</span></Link>
      ))}
      <button className={cls(inMenu)} onClick={onMenu}><Indicator on={inMenu} icon="menu" /><span className="text-label-md">Diğer</span></button>
    </nav>
  );
}

function Drawer({ open, onClose }) {
  const { S, admin } = useLeague(), all = useDestinations(), act = useActive(), ref = useRef();
  useEffect(() => { const el = ref.current; if (open && !el.open) el.showModal(); else if (!open && el.open) el.close(); }, [open]);
  const item = (on) => cx("state flex items-center gap-3 w-full h-14 pl-4 pr-6 rounded-full", on ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant");
  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 h-full max-h-full w-[min(360px,calc(100vw-56px))] p-3 border-0 rounded-r-lg bg-surface-container-low text-on-surface shadow-1 overflow-y-auto open:animate-drawer-in backdrop:bg-black/30">
      <div className="flex items-center gap-3 px-4 pt-4 pb-5"><Logo src={S.logo} s={40} /><div><b className="text-title-lg block">{S.leagueName}</b><span className="text-label-md text-on-surface-variant">{S.season}</span></div></div>
      {all.map(([k, n, ic, badge], i) => (
        <div key={k}>
          {(k === "cal" || k === "login") && i > 0 && <hr className="border-outline-variant mx-4 my-2" />}
          <Link href={href(k)} onClick={onClose} className={item(act === k)} aria-current={act === k ? "page" : undefined}>
            <Icon n={ic} fill={act === k} /><span className="text-label-lg flex-1">{TITLE[k] || n}</span>{badge ? <span className="text-label-lg">{badge}</span> : null}
          </Link>
        </div>
      ))}
      {admin && <a href={cms()} className={item(false)}><Icon n="dashboard_customize" /><span className="text-label-lg flex-1">İçerik yönetimi (CMS)</span><Icon n="open_in_new" className="text-[18px]" /></a>}
    </dialog>
  );
}

function ThemeMenu() {
  const { theme } = useLeague(), [open, setOpen] = useState(false), ref = useRef();
  useEffect(() => {
    if (!open) return;
    const h = (e) => !ref.current.contains(e.target) && setOpen(false), k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("pointerdown", h); document.removeEventListener("keydown", k); };
  }, [open]);
  const seeds = SEEDS.some((s) => s.hex.toLowerCase() === theme.seed.toLowerCase()) ? SEEDS : [{ hex: theme.seed, name: "Lig rengi" }, ...SEEDS];
  return (
    <div className="relative" ref={ref}>
      <IconButton icon="palette" label="Tema" aria-expanded={open} onClick={() => setOpen(!open)} />
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+4px)] z-50 w-72 p-4 flex flex-col gap-3 rounded-lg bg-surface-container shadow-2 origin-top-right animate-menu-in">
          <span className="text-label-lg text-on-surface-variant">Renk</span>
          <div className="flex gap-2.5 flex-wrap">
            {seeds.map((s) => {
              const on = theme.seed.toLowerCase() === s.hex.toLowerCase();
              return <button key={s.hex} aria-label={s.name} aria-pressed={on} onClick={() => theme.setSeed(s.hex)} style={{ background: s.hex }}
                className={cx("size-10 grid place-items-center text-white outline-2 outline-offset-2 transition-[border-radius] duration-300", on ? "outline-on-surface rounded-md" : "outline-transparent rounded-full")}>{on && <Icon n="check" />}</button>;
            })}
          </div>
          <span className="text-label-lg text-on-surface-variant">Görünüm</span>
          <Segmented full value={theme.mode} onChange={theme.setMode} label="Görünüm" items={[["light", "Açık", "light_mode"], ["system", "Sistem", "contrast"], ["dark", "Koyu", "dark_mode"]]} />
        </div>
      )}
    </div>
  );
}

const abbr = (n = "") => L.trUp(n.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9 ]/g, "").trim().slice(0, 3));

function Ticker() {
  const { ms, T, live, weeks } = useLeague();
  const list = ms.filter((m) => m.status !== "sched").reverse().slice(0, 10);
  if (!list.length) return null;
  const cur = live[0] || ms.find((m) => m.status === "sched") || list[0], wk = cur ? weeks.indexOf(L.weekOf(cur)) + 1 : 0;
  return (
    <div aria-label="Son skorlar" className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3 max-w-[1560px] mx-auto [mask-image:linear-gradient(90deg,#000_92%,transparent)]">
      {live.length ? <Chip v="live"><Pulse />Canlı</Chip> : <Chip v="tonal">{wk ? wk + ". Hafta" : "Sonuçlar"}</Chip>}
      {list.map((m) => {
        const g = L.sc(m);
        return (
          <Link key={m.id} href={href("match", m.id)} className="state inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-outline-variant text-label-md shrink-0">
            <Crest t={T[m.home]} s={18} />{abbr(T[m.home]?.name)}
            <b className={cx("px-2 py-0.5 rounded-xs text-[13px] tabular-nums", m.status === "live" ? "bg-error text-on-error" : "bg-surface-container-highest")}>{g.h}–{g.a}</b>
            {abbr(T[m.away]?.name)}<Crest t={T[m.away]} s={18} />
          </Link>
        );
      })}
    </div>
  );
}

function TopBar({ onMenu }) {
  const { S, role, admin } = useLeague(), [scrolled, setScrolled] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 4); h(); window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h); }, []);
  return (
    <header className={cx("sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)] transition-colors duration-300", scrolled ? "bg-surface-container" : "bg-surface")}>
      <div className="flex items-center gap-1 h-16 pl-1 pr-2 min-[840px]:pl-4 max-w-[1560px] mx-auto">
        <IconButton icon="menu" label="Menüyü aç" onClick={onMenu} className="min-[840px]:hidden" />
        <Link href="/" className="state flex items-center gap-3 py-1 pl-1 pr-3 rounded-full">
          <Logo src={S.logo} s={36} /><span><b className="text-title-lg font-medium leading-6 block">{S.leagueName}</b><span className="text-label-sm text-on-surface-variant">{S.season}</span></span>
        </Link>
        <span className="flex-1" />
        {admin && <IconButton icon="dashboard_customize" label="İçerik yönetimi (CMS)" href={cms()} />}
        <ThemeMenu />
        <IconButton icon={admin ? "admin_panel_settings" : role ? "sports" : "account_circle"} fill={!!role} tonal={!!role} label={role ? "Hesap" : "Giriş"} href={href("login")} />
      </div>
      <Ticker />
    </header>
  );
}

function Footer() {
  const { S, ms } = useLeague();
  const lastUp = Math.max(0, ...ms.flatMap((m) => [m.startedAt || 0, ...(m.events || []).map((e) => e.ts || 0)]));
  const col = (h, links) => (
    <div className="flex flex-col items-start gap-0.5"><h4 className="text-title-sm mx-3 mb-2">{h}</h4>{links.map(([k, n]) => <Button key={k} variant="text" size="sm" href={href(k)}>{n}</Button>)}</div>
  );
  return (
    <footer className="mt-4 px-6 pt-8 pb-6 rounded-t-xl bg-surface-container">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr] gap-6">
        <div className="col-span-2 sm:col-span-1 flex items-center gap-3 self-start"><Logo src={S.logo} s={48} /><b className="text-title-lg">{S.leagueName}</b></div>
        {col("Lig", [["table", "Puan durumu"], ["fix", "Fikstür ve sonuçlar"], ["cal", "Maç takvimi"], ["stats", "İstatistikler"]])}
        {col("Kulüp", [["teams", "Takımlar"], ["about", "Lig hakkında"], ["injury", "Sakatlıklar"], ["news", "Duyurular"]])}
      </div>
      <div className="max-w-[1200px] mx-auto mt-6 pt-4 border-t border-outline-variant flex justify-between flex-wrap gap-2 text-body-sm text-on-surface-variant">
        <span>{S.footerNote}</span>
        {lastUp > 0 && <span>Son güncelleme: {L.fmtAt(lastUp, S.timezone, { day: "numeric", month: "long", weekday: "long", hour: "2-digit", minute: "2-digit" })}</span>}
      </div>
    </footer>
  );
}

export function Shell({ children }) {
  const { d } = useLeague(), [menu, setMenu] = useState(false), path = usePathname();
  return (
    <div className="min-h-screen pb-20 min-[840px]:pb-0 min-[840px]:grid min-[840px]:grid-cols-[80px_1fr]">
      <Rail onMenu={() => setMenu(true)} />
      <div className="min-w-0 flex flex-col min-h-screen">
        <TopBar onMenu={() => setMenu(true)} />
        <div className="flex-1 flex gap-6 w-full max-w-[1560px] mx-auto px-4 pt-4 pb-8 min-[840px]:px-6 min-[840px]:pb-12 items-start">
          <main key={path} className="flex-1 min-w-0 flex flex-col gap-6 animate-enter">{children}</main>
          {d.teams.length > 0 && (
            <aside aria-label="Öne çıkanlar" className="hidden min-[1500px]:flex flex-col gap-4 w-[340px] shrink-0 sticky top-[132px] max-h-[calc(100vh-148px)] overflow-auto no-scrollbar">
              <Upcoming /><TopPlayers /><Poll />
            </aside>
          )}
        </div>
        <Footer />
      </div>
      <BottomBar onMenu={() => setMenu(true)} />
      <Drawer open={menu} onClose={() => setMenu(false)} />
    </div>
  );
}
