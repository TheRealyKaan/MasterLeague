"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLeague } from "./state.jsx";
import { Chip, cms, Crest, cx, Empty, EvIcon, href, Icon, IconButton, LiveChip, Progress, Rank } from "./ui.jsx";
import * as L from "@/lib/league.js";

export function Status({ m }) {
  const { now, len } = useLeague();
  if (m.status === "live") return <LiveChip>Canlı {L.clockOf(m, now, len)}</LiveChip>;
  if (m.status === "done") return <Chip>Bitti</Chip>;
  return <Chip>{m.date ? L.hhmm(m.date) : "Saat yok"}</Chip>;
}

/** Compact match card used in fixtures, week lists, team pages, MCL. */
export function MatchCard({ m, tools }) {
  const { T, admin, now } = useLeague();
  const g = L.sc(m), on = m.status !== "sched", w = g.h === g.a ? (m.pw === "h" ? 1 : m.pw === "a" ? 2 : 0) : g.h > g.a ? 1 : 2;
  const mcl = m.stage === "mcl", live = m.status === "live";
  const line = (id, n, side) => (
    <div className={cx("flex items-center gap-3 transition-opacity", on && w && w !== side && "opacity-60")}>
      <Crest t={T[id]} s={28} /><span className="text-title-sm flex-1 min-w-0 truncate">{T[id]?.name}</span>
      <span className={cx("min-w-9 h-8 px-2 grid place-items-center rounded-sm text-[16px] font-semibold tabular-nums shrink-0",
        on && w === side ? (mcl ? "bg-tertiary text-on-tertiary" : "bg-primary text-on-primary") : mcl ? "bg-on-tertiary-container/10" : "bg-surface-container-high")}>{on ? n : "–"}</span>
    </div>
  );
  return (
    <article className={cx("state relative rounded-md px-4 pt-3 pb-3.5 flex flex-col gap-2 transition-shadow hover:shadow-2",
      mcl ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface border border-outline-variant",
      live && !mcl && "border-error shadow-[inset_4px_0_var(--color-error)]")}>
      <Link href={href("match", m.id)} className="absolute inset-0 rounded-md z-0" aria-label={`${T[m.home]?.name} - ${T[m.away]?.name}`} />
      <div className={cx("flex items-center gap-1.5 min-h-7 text-label-md", mcl ? "opacity-85" : "text-on-surface-variant")}>
        <span className="flex-1 min-w-0 truncate">{m.date ? L.shortDay(m.date) : "Tarih yok"}{m.pitch ? " · " + m.pitch : ""}</span>
        {mcl && <Chip v="gold"><Icon n="trophy" fill />{L.RN[m.round] || "MCL"}</Chip>}
        {m.pw && on && g.h === g.a && <Chip>Pen.</Chip>}
        <Status m={m} />
      </div>
      {line(m.home, g.h, 1)}
      {line(m.away, g.a, 2)}
      {m.status === "sched" && m.date && <div className={cx("flex items-center gap-1.5 text-label-md", !mcl && "text-on-surface-variant")}><Icon n="schedule" className="text-base" />{L.fromNow(m, now)}</div>}
      {tools && admin && (
        <div className={cx("relative z-10 flex justify-end gap-1 -mr-2 -mb-1.5 pt-1 border-t", mcl ? "border-current/20 [&_.text-on-surface-variant]:text-inherit" : "border-outline-variant")}>
          <IconButton icon="scoreboard" label="Skor ve olaylar" href={href("ref", m.id)} />
          <IconButton icon="edit" label="CMS’de düzenle" href={cms("matches", m.id)} />
        </div>
      )}
    </article>
  );
}

/** Event timeline, newest first */
export function Feed({ m, lim }) {
  const { T } = useLeague();
  const ev = [...(m.events || [])].sort((a, b) => (+b.min || 0) - (+a.min || 0) || (b.ts || 0) - (a.ts || 0));
  if (!ev.length) return <p className="text-body-md text-on-surface-variant px-1">Henüz olay yok.</p>;
  return (
    <ul className="flex flex-col border-t border-outline-variant divide-y divide-outline-variant">
      {(lim ? ev.slice(0, lim) : ev).map((e) => (
        <li key={e.ts + e.k + e.player} className="flex items-center gap-3 px-1 py-2.5 animate-enter">
          <MinuteTag min={e.min} />
          <EvIcon k={e.k} />
          <span className="flex-1 min-w-0"><b className="text-title-sm">{e.player || "Gol"}</b>{e.k === "OG" && " (K.K.)"}{e.assist && <small className="text-on-surface-variant"> · asist {e.assist}</small>}</span>
          <Crest t={T[e.team]} s={22} />
        </li>
      ))}
    </ul>
  );
}
export const MinuteTag = ({ min }) => <span className="min-w-9 text-center px-1.5 py-0.5 rounded-sm bg-surface-container-highest text-label-lg tabular-nums shrink-0">{min}’</span>;

const CONFETTI = ["var(--color-primary)", "var(--color-gold)", "var(--color-tertiary)", "var(--color-secondary-container)", "var(--color-win)"];

/** Live scoreboard: ticking clock, time progress, goal celebration when a new goal arrives. */
export function Scoreboard({ m, lim, link }) {
  const { T, len, now } = useLeague();
  const g = L.sc(m), ev = m.events || [], live = m.status === "live", clk = L.clockOf(m, now, len);
  const [burst, setBurst] = useState(null), [scored, setScored] = useState(null), prev = useRef(ev.length);
  useEffect(() => {
    const grew = ev.length > prev.current, e = ev[ev.length - 1];
    prev.current = ev.length;
    if (!grew || !L.isGoal(e)) return;
    setBurst({ ...e, key: Date.now() }); setScored(e.team);
    const a = setTimeout(() => setBurst(null), 3200), b = setTimeout(() => setScored(null), 1200);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [ev.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const bits = useMemo(() => Array.from({ length: 28 }, (_, i) => ({ l: (i * 37) % 100, d: ((i * 13) % 7) / 10, r: (i * 53) % 360, c: CONFETTI[i % 5] })), []);
  const side = (id) => (
    <div className={cx("flex flex-col items-center gap-2.5 text-center transition-transform duration-500 ease-decel", scored === id && "scale-110 [&>:first-child]:ring-4 [&>:first-child]:ring-gold [&>:first-child]:ring-offset-4 [&>:first-child]:ring-offset-surface-container")}>
      <Crest t={T[id]} s={60} /><span className="text-title-md">{T[id]?.name}</span>
    </div>
  );
  return (
    <article className={cx("relative overflow-hidden rounded-md p-4 flex flex-col gap-4 bg-surface-container", live && "bg-linear-160 from-primary-container to-surface-container to-70%", link && "state transition-shadow hover:shadow-2")}>
      {link && <Link href={href("match", m.id)} className="absolute inset-0 z-0" aria-label="Maç detayı" />}
      <div className="flex items-center gap-2 text-label-lg">
        {live ? <LiveChip /> : <Chip>{m.status === "done" ? "Maç bitti" : m.date ? L.fdt(m.date) : "Başlamadı"}</Chip>}
        {m.stage === "mcl" && <Chip v="gold"><Icon n="trophy" fill />{L.RN[m.round]}</Chip>}
        <span className="flex-1" />
        {m.pitch && <span className="text-on-surface-variant"><Icon n="location_on" className="text-[18px] mr-0.5" />{m.pitch}</span>}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {side(m.home)}
        <div className="grid grid-cols-[auto_auto_auto] items-center gap-1.5 justify-items-center">
          <span className="score text-[64px] leading-[72px] font-bold"><span className="inline-block animate-pop" key={"h" + g.h}>{g.h}</span></span>
          <span className="text-[40px] font-light text-on-surface-variant -mt-1.5">:</span>
          <span className="score text-[64px] leading-[72px] font-bold"><span className="inline-block animate-pop" key={"a" + g.a}>{g.a}</span></span>
          {live && clk && <span className="col-span-3 px-3 py-0.5 rounded-full bg-error text-on-error text-title-md tabular-nums">{clk === String(len).padStart(2, "0") + ":00" ? "Süre doldu" : clk}</span>}
        </div>
        {side(m.away)}
      </div>
      {live && m.startedAt && <Progress value={L.progressOf(m, now, len)} label="Maç süresi" />}
      <Feed m={m} lim={lim} />
      {burst && (
        <div key={burst.key} aria-live="assertive" className="absolute inset-0 z-20 grid place-items-center overflow-hidden rounded-[inherit] bg-primary/90 text-on-primary animate-goal-out">
          {bits.map((c, i) => <span key={i} className="absolute -top-3 w-2 h-3.5 rounded-[2px] animate-confetti" style={{ left: c.l + "%", background: c.c, animationDelay: c.d + "s", rotate: c.r + "deg" }} />)}
          <div className="flex flex-col items-center gap-1 text-center animate-goal-in">
            <span className="text-display-md font-extrabold wide tracking-widest">GOOOL!</span>
            <span className="text-title-lg">{burst.player || T[burst.team]?.name}{burst.k === "OG" ? " (K.K.)" : ""}</span>
            <span className="text-label-lg">{T[burst.team]?.name}</span>
          </div>
        </div>
      )}
    </article>
  );
}

/** Standings: rows slide to their new position when the order changes. */
export function Standings({ compact }) {
  const { rows, T, prevRank } = useLeague();
  const H = compact ? 48 : 56;
  const cols = compact
    ? "grid-cols-[36px_minmax(0,1fr)_32px_40px_40px] sm:grid-cols-[36px_minmax(0,1fr)_32px_40px_40px_98px]"
    : "grid-cols-[36px_minmax(0,1fr)_32px_40px_40px] sm:grid-cols-[44px_minmax(0,1fr)_36px_32px_32px_32px_44px_44px_112px]";
  const full = compact ? "hidden" : "hidden sm:block";
  const row = cx("grid items-center text-center px-2", cols);
  const medal = ["before:bg-gold", "before:bg-silver", "before:bg-bronze"];
  return (
    <div className="tabular-nums" role="table" aria-label="Puan durumu">
      <div className={cx(row, "h-10 text-label-md text-on-surface-variant border-b border-outline-variant")} role="row">
        <span>#</span><span className="text-left">Takım</span><span>O</span><span className={full}>G</span><span className={full}>B</span><span className={full}>M</span><span>AV</span><span>P</span><span className="hidden sm:block">Form</span>
      </div>
      <div className="relative" style={{ height: rows.length * H }}>
        {rows.map((r, i) => {
          const dlt = prevRank[r.id] ? prevRank[r.id] - (i + 1) : 0, av = r.ag - r.yg;
          return (
            <div key={r.id} role="row" style={{ transform: `translateY(${i * H}px)`, height: H }}
              className={cx(row, "absolute inset-x-0 border-b border-outline-variant transition-transform duration-700 ease-emph", i < 3 && "before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-r", medal[i])}>
              <span className="inline-flex items-center justify-center text-title-sm">
                {i + 1}
                {dlt ? <small className={cx("inline-flex items-center text-[10px] font-semibold -ml-0.5", dlt > 0 ? "text-win" : "text-error")}><Icon n={dlt > 0 ? "arrow_drop_up" : "arrow_drop_down"} className="text-[18px] -mr-1" />{Math.abs(dlt)}</small> : null}
              </span>
              <Link href={href("team", r.id)} className="state flex items-center gap-2.5 min-w-0 h-10 px-2 -ml-2 rounded-full text-left">
                <Crest t={T[r.id]} s={28} /><span className="text-title-sm truncate">{T[r.id]?.name}</span>
              </Link>
              <span>{r.o}</span><span className={full}>{r.g}</span><span className={full}>{r.b}</span><span className={full}>{r.m}</span>
              <span>{av > 0 ? "+" : ""}{av}</span>
              <b className="text-title-md grid place-items-center"><span className="inline-block animate-pop" key={r.p}>{r.p}</span></b>
              <span className="hidden sm:flex gap-1 justify-center">
                {r.f.slice(-5).map((x, j) => (
                  <i key={j} title={{ G: "Galibiyet", B: "Beraberlik", M: "Mağlubiyet" }[x]}
                    className={cx("size-[18px] rounded-full grid place-items-center text-[10px] not-italic font-bold text-white", x === "G" ? "bg-win" : x === "M" ? "bg-error text-on-error" : "bg-outline")}>{x}</i>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Leader spotlight + ranked list (scorers / assists). */
export function Leaders({ list, n, unit }) {
  const { T } = useLeague();
  if (!list.length) return <Empty icon="leaderboard">Henüz veri yok.</Empty>;
  const f = list[0];
  return (
    <>
      <div className="flex items-center gap-4 p-4 rounded-lg bg-primary-container text-on-primary-container">
        <Crest t={T[f.t]} s={56} />
        <div className="flex-1 min-w-0"><span className="text-label-md opacity-80">LİDER</span><div className="text-title-lg">{f.n}</div><div className="text-body-sm">{T[f.t]?.name}</div></div>
        <div className="flex flex-col items-center"><span className="score text-[48px] leading-[48px]">{f.c}</span><span className="text-label-sm">{unit}</span></div>
      </div>
      <ol className="flex flex-col divide-y divide-outline-variant">
        {list.slice(1, n).map((p, i) => (
          <li key={p.t + p.n} className="flex items-center gap-3 min-h-14 px-1 py-2">
            <Rank n={i + 2} /><Crest t={T[p.t]} s={32} />
            <span className="flex-1 min-w-0"><b className="text-title-sm">{p.n}</b><small className="text-body-sm text-on-surface-variant block">{T[p.t]?.name}</small></span>
            <b className="text-title-md score">{p.c}</b>
          </li>
        ))}
      </ol>
    </>
  );
}

/** Win / draw / win probability, shown as a three-part bar. */
export function WinProb({ m }) {
  const { rows } = useLeague(), [h, dr, a] = L.predict(rows, m);
  return (
    <div className="flex flex-col gap-1.5" aria-label={`Galibiyet %${h}, beraberlik %${dr}, galibiyet %${a}`}>
      <div className="flex gap-[3px] h-2">
        <i className="rounded min-w-1 bg-primary" style={{ flex: h }} /><i className="rounded min-w-1 bg-outline-variant" style={{ flex: dr }} /><i className="rounded min-w-1 bg-tertiary" style={{ flex: a }} />
      </div>
      <div className="flex justify-between text-label-md text-on-surface-variant"><span>%{h}</span><span>Beraberlik %{dr}</span><span>%{a}</span></div>
    </div>
  );
}
