"use client";
import { useState } from "react";
import Link from "next/link";
import { vote } from "@/server/actions";
import { useLeague } from "./state.jsx";
import { WinProb } from "./league.jsx";
import { Button, CardHead, Crest, cx, Empty, href, Icon, Panel, Progress, Segmented } from "./ui.jsx";
import * as L from "@/lib/league.js";

export function Upcoming() {
  const { ms, T } = useLeague(), list = ms.filter((x) => x.status === "sched").slice(0, 3);
  return (
    <Panel v="filled">
      <CardHead title="Yaklaşan maçlar" icon="event_upcoming"><Button variant="text" size="sm" href={href("fix")}>Tümü</Button></CardHead>
      {list.length ? list.map((m) => (
        <Link key={m.id} href={href("match", m.id)} className="state flex flex-col gap-3 p-3.5 rounded-lg bg-surface-container-low">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <span className="flex flex-col items-center gap-1.5 text-center"><Crest t={T[m.home]} s={40} /><span className="text-title-sm">{T[m.home]?.name}</span></span>
            <span className="text-label-lg text-on-surface-variant">VS</span>
            <span className="flex flex-col items-center gap-1.5 text-center"><Crest t={T[m.away]} s={40} /><span className="text-title-sm">{T[m.away]?.name}</span></span>
          </div>
          <WinProb m={m} />
          <div className="flex items-center gap-1.5 text-label-md text-on-surface-variant"><Icon n="calendar_today" className="text-base" />{m.date ? L.fdt(m.date) : "Tarih bekleniyor"}{m.pitch ? " · " + m.pitch : ""}</div>
        </Link>
      )) : <Empty icon="event_busy">Yaklaşan maç yok.</Empty>}
      <p className="text-body-sm text-on-surface-variant px-1">Yüzdeler puan durumundan hesaplanan tahmindir.</p>
    </Panel>
  );
}

export function TopPlayers() {
  const { k, T } = useLeague(), [mode, setMode] = useState("g");
  const val = (p) => (mode === "g" ? p.g : mode === "a" ? p.a : p.g * 2 + p.a);
  const list = L.playerTotals(k).sort((a, b) => val(b) - val(a) || b.g - a.g).slice(0, 3);
  const lab = { g: "Gol kralı", a: "Asist lideri", i: "Etki lideri" };
  return (
    <Panel v="filled">
      <CardHead title="En iyi oyuncular" icon="star" />
      <Segmented label="Sıralama ölçütü" value={mode} onChange={setMode} items={[["g", "Gol"], ["a", "Asist"], ["i", "Etki"]]} />
      {list.length ? (
        <ol className="flex flex-col gap-1">
          {list.map((p, i) => (
            <li key={mode + p.t + p.n} className={cx("flex items-center gap-3 min-h-14 py-2", i === 0 ? "bg-surface-container-low rounded-lg px-2" : "px-1")}>
              <Crest t={T[p.t]} s={i === 0 ? 48 : 36} />
              <span className="flex-1 min-w-0"><b className="text-title-sm">{p.n}</b><small className="text-body-sm text-on-surface-variant block">{i === 0 ? lab[mode] : T[p.t]?.name}</small></span>
              <span className="flex gap-2.5 text-label-md text-on-surface-variant [&_.msi]:text-base">
                <span className="inline-flex items-center gap-0.5"><Icon n="sports_soccer" />{p.g}</span>
                <span className="inline-flex items-center gap-0.5"><Icon n="assistant_navigation" />{p.a}</span>
              </span>
              <span className="min-w-8 h-8 px-2 grid place-items-center rounded-full bg-primary-container text-on-primary-container text-title-sm" title="Etki puanı: 2 × gol + asist">{p.g * 2 + p.a}</span>
            </li>
          ))}
        </ol>
      ) : <Empty icon="sports_soccer">Henüz gol ve asist yok.</Empty>}
    </Panel>
  );
}

export function Poll() {
  const { live, next, d, T, run } = useLeague(), pm = live[0] || next;
  const [busy, setBusy] = useState(false);
  if (!pm) return null;
  const c = d.votes[pm.id] || { h: 0, a: 0 }, tot = c.h + c.a, ph = tot ? Math.round((c.h / tot) * 100) : 0;
  const cast = async (s) => { setBusy(true); await run(vote(pm.id, s), "Oyunuz kaydedildi"); setBusy(false); };
  return (
    <Panel v="filled">
      <CardHead title="Taraftar anketi" icon="how_to_vote" />
      <p className="text-title-sm">{pm.status === "live" ? "Bu maçı kim kazanır?" : "Yaklaşan maçı kim kazanır?"}</p>
      {[["h", pm.home, ph], ["a", pm.away, tot ? 100 - ph : 0]].map(([s, id, pc]) => (
        <button key={s} disabled={busy} onClick={() => cast(s)} aria-pressed={c.mine === s}
          className={cx("state flex items-center gap-2.5 h-13 px-4 rounded-lg bg-surface-container-low overflow-hidden w-full disabled:opacity-70", c.mine === s && "shadow-[inset_0_0_0_2px_var(--color-primary)]")}>
          <i className="absolute inset-y-0 left-0 -z-20 bg-secondary-container rounded-[inherit] transition-[width] duration-700 ease-emph" style={{ width: pc + "%" }} />
          <Crest t={T[id]} s={24} /><span className="text-title-sm flex-1 text-left">{T[id]?.name}</span>
          {c.mine === s && <Icon n="check_circle" fill className="text-primary text-xl" />}<b className="text-title-sm">%{pc}</b>
        </button>
      ))}
      <p className="text-body-sm text-on-surface-variant px-1">{tot} oy{c.mine ? ", oyunuz kaydedildi" : ""}. Her cihaz bir oy verir; tekrar seçerek değiştirebilirsiniz.</p>
    </Panel>
  );
}

export function Kpis() {
  const { ms, k } = useLeague(), dn = ms.filter((x) => x.status !== "sched").length;
  const items = [
    ["sports", <>{dn}<small className="text-[.55em] opacity-55">/{ms.length}</small></>, "Oynanan maç", ms.length ? dn / ms.length : null],
    ["sports_soccer", k.tg, "Toplam gol"],
    ["functions", dn ? (k.tg / dn).toFixed(2).replace(".", ",") : "0", "Maç başına gol"],
    ["style", <>{k.yc}<small className="text-[.55em] opacity-55">/{k.rc}</small></>, "Sarı / kırmızı kart"],
  ];
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-3">
      {items.map(([ic, v, l, pr]) => (
        <div key={l} className="flex flex-col gap-1.5 p-5 rounded-xl bg-surface-container-lowest text-on-surface">
          <Icon n={ic} className="size-11 grid! place-items-center rounded-md bg-primary-container text-on-primary-container mb-1.5" />
          <b className="score text-[48px] leading-[52px]">{v}</b>
          <span className="text-label-lg">{l}</span>
          {pr != null && <Progress value={pr} />}
        </div>
      ))}
    </div>
  );
}

export const SeasonBand = ({ children }) => <section className="p-6 rounded-xl bg-secondary-container text-on-secondary-container [&_.text-primary]:text-current [&_.text-primary]:opacity-80">{children}</section>;
