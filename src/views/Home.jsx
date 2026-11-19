"use client";
import { useState } from "react";
import Link from "next/link";
import { useLeague } from "@/components/state.jsx";
import { Leaders, MatchCard, Scoreboard, Standings } from "@/components/league.jsx";
import { Kpis, Poll, SeasonBand, TopPlayers, Upcoming } from "@/components/panels.jsx";
import { Button, CardHead, Chip, cms, Crest, cx, Empty, href, Icon, LiveChip, Logo, Panel, Rank, SectionHead, Segmented } from "@/components/ui.jsx";
import * as L from "@/lib/league.js";

export function NoLeague() {
  const { admin } = useLeague();
  return (
    <Panel v="outlined">
      <Empty icon="stadium">
        <p>Lig henüz kurulmadı. {admin ? "İçerik yönetiminden takımları ve maçları ekleyin." : "Yönetici takımları ve maçları ekleyince burada görünür."}</p>
        {admin ? <Button variant="tonal" href={cms("teams", "create")} className="mt-3"><Icon n="group_add" />Takım ekle</Button> : null}
      </Empty>
    </Panel>
  );
}

function TeamBoard() {
  const { rows, T } = useLeague(), [mode, setMode] = useState("p");
  const val = (r) => (mode === "ag" ? r.ag : mode === "yg" ? r.yg : r.p);
  const base = rows.filter((r) => r.o > 0), list = [...base].sort((a, b) => (mode === "yg" ? a.yg - b.yg || b.o - a.o : val(b) - val(a))).slice(0, 5), mx = Math.max(1, ...base.map(val));
  return (
    <Panel>
      <CardHead title="Liderlik tablosu" icon="bar_chart" />
      <Segmented label="Ölçüt" value={mode} onChange={setMode} items={[["p", "Puan"], ["ag", "Atılan gol"], ["yg", "Az yenilen"]]} />
      <ol className="flex flex-col divide-y divide-outline-variant">
        {list.map((r, i) => {
          const v = val(r), w = mode === "yg" ? ((mx - v) / mx) * 100 : (v / mx) * 100;
          return (
            <li key={mode + r.id} className="flex items-center gap-3 min-h-14 px-1 py-2">
              <Rank n={i + 1} /><Crest t={T[r.id]} s={32} />
              <span className="flex-1 min-w-0">
                <b className="text-title-sm">{T[r.id]?.name}</b>
                <span className="block h-2 mt-1.5 rounded bg-surface-container-highest overflow-hidden">
                  <i className={cx("block h-full rounded origin-left animate-grow", i === 0 ? "bg-gold" : "bg-primary")} style={{ width: Math.max(6, w) + "%", animationDelay: i * 0.07 + "s" }} />
                </span>
              </span>
              <b className="text-title-md score">{v}</b>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/** Player / team of the week spotlight. */
function Spotlight({ over, title, icon, lead, rest, empty }) {
  return (
    <section className="rounded-md p-5 flex flex-col gap-3 overflow-hidden bg-gold-container text-on-surface">
      <span className="text-label-lg opacity-75">{over}</span>
      <h3 className="text-title-lg">{title}</h3>
      {lead ? (
        <>
          <div className="flex items-center gap-4 py-3">
            <span className="grid place-items-center rounded-full p-1 bg-[conic-gradient(var(--color-gold),color-mix(in_srgb,var(--color-gold)_30%,transparent),var(--color-gold))] animate-spin-slow [&>*]:animate-spin-slow [&>*]:[animation-direction:reverse]">{lead.crest}</span>
            <div className="flex-1 min-w-0"><div className="text-headline-sm">{lead.name}</div><div className="text-body-md">{lead.sub}</div></div>
            <div className="flex flex-col items-center text-center"><Icon n={icon} fill className="text-gold text-[28px]" /><span className="text-title-md">{lead.a}</span><span className="text-body-sm">{lead.b}</span></div>
          </div>
          {rest.map((r) => <div key={r.key} className="flex items-center gap-3 py-2.5 border-t border-current/12">{r.crest}<span className="text-title-sm flex-1">{r.name}</span><span className="text-body-sm">{r.sub}</span></div>)}
        </>
      ) : <p className="text-body-md">{empty}</p>}
    </section>
  );
}

const TeamCol = ({ t, s, cls = "text-title-md" }) => (
  <span className="flex flex-col items-center gap-2.5 text-center min-w-0"><Crest t={t} s={s} /><span className={cls}>{t?.name}</span></span>
);

export function TeamGrid({ detail }) {
  const { d, T, rows } = useLeague();
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
      {d.teams.map((t) => {
        const i = rows.findIndex((r) => r.id === t.id);
        return (
          <Link key={t.id} href={href("team", t.id)} className="group state flex flex-col items-center gap-2 px-3 py-5 text-center rounded-md bg-surface border border-outline-variant transition-shadow hover:shadow-2">
            <span className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-4"><Crest t={T[t.id]} s={64} /></span>
            <b className="text-title-md">{t.name}</b>
            {t.cls && <Chip>{t.cls}</Chip>}
            {detail && <span className="text-body-sm text-on-surface-variant">{i + 1}. sıra · {rows[i]?.p} puan</span>}
          </Link>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { d, S, ms, T, rows, k, live, next, mclDoc, weeks, stars, starTeams, now } = useLeague();
  const doneL = ms.filter((x) => x.status === "done").reverse(), a0 = doneL[0];
  const fm = live[0] || next || a0, wk = fm ? L.weekOf(fm) : "", wkMs = wk ? ms.filter((x) => L.weekOf(x) === wk) : [];
  const dts = wkMs.map(L.dayOf).filter(Boolean).sort(), wkNo = weeks.indexOf(wk) + 1, notice = d.notices[0];
  const has = d.teams.length > 0;
  const fin = ms.find((x) => x.stage === "mcl" && x.round === "f"), champ = L.winnerOf(fin);
  const st = stars[0], stt = starTeams[0];

  return (
    <>
      <section className="relative overflow-hidden grid grid-cols-1 md:grid-cols-[1.3fr_.7fr] items-center gap-6 px-6 py-7 md:p-12 rounded-xl bg-primary-container text-on-primary-container
        before:absolute before:rounded-full before:pointer-events-none before:border-2 before:border-current/14 before:size-[260px] before:-right-[120px] before:top-20 md:before:size-[420px] md:before:-right-[60px] md:before:top-1/2 md:before:-translate-y-1/2
        md:after:absolute md:after:w-0.5 md:after:h-[140%] md:after:right-[150px] md:after:-top-[20%] md:after:bg-current/10">
        <div className="relative z-10 flex flex-col gap-4 animate-enter">
          <span className="text-label-lg inline-flex items-center gap-1.5"><Icon n="sports_soccer" className="text-[18px]" />{S.season}</span>
          <h1 className="text-[clamp(48px,8vw,88px)] leading-none font-extrabold wide -tracking-[1px]">{S.leagueName}</h1>
          <p className="text-body-lg max-w-xl">{S.tagline}</p>
          <div className="flex flex-wrap gap-2 [&_.border-outline]:border-current/35 [&_.text-primary]:text-current">
            <Chip v="assist"><Icon n="groups" />{d.teams.length} takım</Chip>
            <Chip v="assist"><Icon n="event" />{ms.length} maç</Chip>
            {live.length > 0 && <LiveChip>{live.length} canlı maç</LiveChip>}
          </div>
          <div className="flex gap-3 flex-wrap mt-2">
            <Button href={href("table")}><Icon n="leaderboard" />Puan durumu</Button>
            <Button variant="outlined" href={href("fix")} className="border-current/40 text-current">Fikstür</Button>
          </div>
        </div>
        <div className="relative z-10 grid place-items-center row-start-1 md:row-start-auto justify-self-start md:justify-self-center">
          <Logo src={S.logo} s={260} className="w-24 h-24 md:w-[260px] md:h-[260px] drop-shadow-[0_16px_32px_rgb(0_0_0/.3)] animate-float" />
        </div>
      </section>

      {mclDoc && (
        <Link href={href("mcl")} className="state flex items-center gap-4 px-5 py-4 rounded-md bg-tertiary-container text-on-tertiary-container">
          <Icon n="trophy" fill className="text-[36px] text-gold" />
          <span className="flex-1"><b className="text-title-md block">Master Champions League</b>
            <span className="text-body-md">{champ ? "Şampiyon: " + T[champ]?.name : "İlk 4: " + mclDoc.seeds.map((id) => T[id]?.name).join(", ")}</span></span>
          <Icon n="arrow_forward" />
        </Link>
      )}
      {notice && <Link href={href("news")} className="state flex items-center gap-4 px-5 py-4 rounded-md bg-secondary-container text-on-secondary-container"><Icon n="campaign" /><span className="text-body-lg flex-1">{notice.text}</span></Link>}

      {live.length > 0 && <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">{live.map((m) => <Scoreboard key={m.id} m={m} lim={3} link />)}</div>}

      {has ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
          <Panel>
            <CardHead title="Sıradaki maç" icon="sports" />
            {next ? (
              <Link href={href("match", next.id)} className="state grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-2 py-4 rounded-lg text-center">
                <TeamCol t={T[next.home]} s={72} />
                <span className="flex flex-col items-center gap-1"><span className="text-headline-md font-extrabold wide text-primary">VS</span><span className="text-label-md text-on-surface-variant">{next.date ? L.fdt(next.date) : ""}{next.pitch ? " · " + next.pitch : ""}</span></span>
                <TeamCol t={T[next.away]} s={72} />
                <span className="col-span-3 justify-self-center"><Chip v="tonal" className="h-8 text-label-lg"><Icon n="timer" />{L.fromNow(next, now)}</Chip></span>
              </Link>
            ) : rows[0] ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center"><TeamCol t={T[rows[0].id]} s={84} /><p className="text-body-md text-on-surface-variant">Sezonun lideri. Yeni maçlar yakında fikstüre eklenecek.</p></div>
            ) : null}
          </Panel>
          <Panel>
            <CardHead title="Son sonuçlar" icon="history"><Button variant="text" size="sm" href={href("fix")}>Tümü</Button></CardHead>
            {a0 ? (
              <>
                <Link href={href("match", a0.id)} className="state flex flex-col gap-3 p-4 rounded-lg bg-surface-container text-center">
                  <span className="text-label-md text-on-surface-variant">{a0.date ? L.shortDay(a0.date) : ""}</span>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <TeamCol t={T[a0.home]} s={48} cls="text-title-sm" />
                    <span className="score text-[44px] leading-[48px] font-bold">{L.sc(a0).h} – {L.sc(a0).a}</span>
                    <TeamCol t={T[a0.away]} s={48} cls="text-title-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-body-sm text-on-surface-variant">
                    <div>{L.scorers(a0, a0.home).map((x) => <div key={x}>{x}</div>)}</div>
                    <div>{L.scorers(a0, a0.away).map((x) => <div key={x}>{x}</div>)}</div>
                  </div>
                </Link>
                <ul className="flex flex-col divide-y divide-outline-variant">
                  {doneL.slice(1, 5).map((m) => {
                    const g = L.sc(m);
                    return (
                      <li key={m.id}><Link href={href("match", m.id)} className="state grid grid-cols-[1fr_auto_1fr] items-center gap-3 min-h-11 px-1 rounded-md">
                        <span className={cx("text-title-sm text-right", g.h < g.a && "text-on-surface-variant")}>{T[m.home]?.name}</span>
                        <span className="min-w-16 h-8 grid place-items-center rounded-sm bg-primary text-on-primary text-[16px] font-semibold tabular-nums">{g.h} – {g.a}</span>
                        <span className={cx("text-title-sm", g.a < g.h && "text-on-surface-variant")}>{T[m.away]?.name}</span>
                      </Link></li>
                    );
                  })}
                </ul>
              </>
            ) : <Empty icon="hourglass_empty">Henüz biten maç yok.</Empty>}
          </Panel>
        </div>
      ) : <NoLeague />}

      {wkMs.length > 0 && (
        <section>
          <SectionHead over={dts.length ? L.rng(dts[0], dts[dts.length - 1]) : "Maçlar"} title={wkNo ? wkNo + ". Hafta" : "Maçlar"} to={href("fix")} toLabel="Fikstür" />
          <MatchGrid list={wkMs} />
        </section>
      )}

      {has && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4 items-start min-[1500px]:hidden"><Upcoming /><TopPlayers /><Poll /></div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-start">
            <Panel>
              <CardHead title="Puan durumu" icon="leaderboard"><Button variant="text" size="sm" href={href("table")}>Tam tablo</Button></CardHead>
              <Standings compact />
            </Panel>
            <div className="flex flex-col gap-4 min-w-0">
              <Panel><CardHead title="Gol krallığı" icon="sports_soccer"><Button variant="text" size="sm" href={href("stats")}>Tümü</Button></CardHead><Leaders list={k.G} n={3} unit="GOL" /></Panel>
              <Panel><CardHead title="Asist liderleri" icon="assistant_navigation"><Button variant="text" size="sm" href={href("stats")}>Tümü</Button></CardHead><Leaders list={k.A} n={3} unit="ASİST" /></Panel>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4 items-start">
            {rows[0]?.o > 0 && <TeamBoard />}
            <Spotlight over="Gol ve asist puanı" title="Haftanın yıldızı" icon="star"
              lead={st && { crest: <Crest t={T[st.t]} s={64} />, name: st.n, sub: T[st.t]?.name + ", " + L.weekLabel(st.w), a: st.g + " gol", b: st.a + " asist" }}
              rest={stars.slice(1, 3).map((p) => ({ key: p.t + p.n, crest: <Crest t={T[p.t]} s={28} />, name: p.n, sub: p.g + " gol, " + p.a + " asist" }))}
              empty="Haftanın yıldızı, bu hafta ilk gol girilince burada belirecek." />
            <Spotlight over="Puan, averaj ve gol" title="Haftanın takımı" icon="trophy"
              lead={stt && { crest: <Crest t={T[stt.id]} s={64} />, name: T[stt.id]?.name, sub: `${L.weekLabel(stt.w)}, ${stt.o} maç, ${stt.g}G ${stt.b}B ${stt.m}M`, a: stt.p + " puan", b: stt.ag + "-" + stt.yg + " gol" }}
              rest={starTeams.slice(1, 3).map((p) => ({ key: p.id, crest: <Crest t={T[p.id]} s={28} />, name: T[p.id]?.name, sub: `${p.p} puan, averaj ${p.ag - p.yg > 0 ? "+" : ""}${p.ag - p.yg}` }))}
              empty="Haftanın takımı, bu hafta ilk maç oynanınca burada belirecek." />
          </div>

          <SeasonBand><SectionHead over={S.season} title="Sezon rakamları" to={href("stats")} toLabel="İstatistikler" /><Kpis /></SeasonBand>

          <section><SectionHead over={d.teams.length + " takım"} title="Takımlar" to={href("teams")} /><TeamGrid /></section>
        </>
      )}
    </>
  );
}

export const MatchGrid = ({ list, tools }) => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3">{list.map((m) => <MatchCard key={m.id} m={m} tools={tools} />)}</div>
);
