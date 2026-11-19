"use client";
import { useState } from "react";
import { useLeague } from "@/components/state.jsx";
import { Leaders, MatchCard, Scoreboard, Standings } from "@/components/league.jsx";
import { Kpis, SeasonBand } from "@/components/panels.jsx";
import { AvatarIcon, Button, CardGlyph, CardHead, Chip, cms, Crest, cx, Empty, Icon, IconButton, List, listItem, PageTitle, Panel } from "@/components/ui.jsx";
import { MatchGrid, NoLeague, TeamGrid } from "./Home.jsx";
import { makeFinal, resetMcl } from "@/server/actions";
import * as L from "@/lib/league.js";

const grid2 = "grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4";
const byDay = (list) => { const o = {}; list.forEach((m) => (o[L.dayOf(m)] ||= []).push(m)); return o; };

const DayGroups = ({ list, tools }) => {
  const g = byDay(list);
  return Object.keys(g).sort((a, b) => (a || "9").localeCompare(b || "9")).map((day) => (
    <section key={day} className="flex flex-col gap-3">
      <h3 className="text-title-md flex items-center gap-2 px-1 first-letter:uppercase"><Icon n="calendar_today" className="text-xl text-primary" /><span className="first-letter:uppercase">{L.dl(day)}</span></h3>
      <MatchGrid list={g[day]} tools={tools} />
    </section>
  ));
};

/** Admin shortcut into the CMS for this page's content. */
const CmsLink = ({ to, children = "CMS’de yönet", icon = "edit" }) => (useLeague().admin ? <Button variant="tonal" href={to}><Icon n={icon} />{children}</Button> : null);

export function Fixtures() {
  const { ms, mclDoc } = useLeague();
  return (
    <>
      <PageTitle title="Fikstür"><CmsLink to={cms("matches", "create")} icon="add">Maç ekle</CmsLink></PageTitle>
      {!ms.length ? <NoLeague /> : (
        <>
          {mclDoc && <p className="flex items-center gap-2 text-body-sm text-on-surface-variant"><i className="size-3 rounded-xs border border-outline ml-2" />Lig maçı<i className="size-3 rounded-xs bg-tertiary-container border border-tertiary ml-2" />Master Champions League</p>}
          <DayGroups list={ms} tools />
        </>
      )}
    </>
  );
}

export function Table() {
  const { d, S } = useLeague();
  return (
    <>
      <PageTitle title="Puan durumu"><CmsLink to={cms("teams")}>Puan düzeltmeleri</CmsLink></PageTitle>
      {!d.teams.length ? <NoLeague /> : (
        <>
          <section className="rounded-md bg-surface-container-low shadow-1 px-2 pt-2 overflow-hidden"><Standings /></section>
          <p className="text-body-sm text-on-surface-variant px-1">
            O: oynanan · G/B/M: galibiyet, beraberlik, mağlubiyet · AV: averaj · P: puan (galibiyet {S.pointsWin}, beraberlik {S.pointsDraw}). Canlı maç skoru tabloya anında yansır; yönetici puan düzeltmesi P sütununa dahildir.
            Altın, gümüş ve bronz şeritler ilk üç takımı gösterir.
          </p>
        </>
      )}
    </>
  );
}

export function Stats() {
  const { k, T } = useLeague();
  return (
    <>
      <PageTitle title="İstatistikler" />
      <SeasonBand><Kpis /></SeasonBand>
      <div className={grid2}>
        <Panel><CardHead title="Gol krallığı" icon="sports_soccer" /><Leaders list={k.G} n={10} unit="GOL" /></Panel>
        <Panel><CardHead title="Asist liderleri" icon="assistant_navigation" /><Leaders list={k.A} n={10} unit="ASİST" /></Panel>
      </div>
      <Panel>
        <CardHead title="Kartlar" icon="style" />
        {k.C.length ? (
          <List>
            {k.C.map((p) => (
              <li key={p.t + p.n} className={listItem}>
                <Crest t={T[p.t]} s={32} />
                <span className="flex-1 min-w-0"><b className="text-title-sm">{p.n}</b><small className="text-body-sm text-on-surface-variant block">{T[p.t]?.name}</small></span>
                <span className="inline-flex items-center gap-1.5 min-w-10 font-medium"><CardGlyph k="Y" />{p.y}</span>
                <span className="inline-flex items-center gap-1.5 min-w-10 font-medium"><CardGlyph k="R" />{p.r}</span>
              </li>
            ))}
          </List>
        ) : <Empty icon="style">Henüz kart yok.</Empty>}
      </Panel>
    </>
  );
}

export function Calendar() {
  const { ms, S } = useLeague(), [off, setOff] = useState(0), [day, setDay] = useState("");
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + off);
  const y = base.getFullYear(), mo = base.getMonth(), first = (base.getDay() + 6) % 7, dim = new Date(y, mo + 1, 0).getDate();
  const p2 = (n) => String(n).padStart(2, "0"), kk = (dd) => y + "-" + p2(mo + 1) + "-" + p2(dd);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: S.timezone }).format(new Date());
  const by = byDay(ms.filter((m) => m.date));
  return (
    <>
      <PageTitle title="Takvim" />
      <Panel className="gap-4">
        <div className="flex items-center gap-2">
          <IconButton icon="chevron_left" label="Önceki ay" onClick={() => setOff(off - 1)} />
          <span className="text-title-lg flex-1 first-letter:uppercase">{base.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</span>
          {off !== 0 && <Button variant="text" size="sm" onClick={() => setOff(0)}>Bugün</Button>}
          <IconButton icon="chevron_right" label="Sonraki ay" onClick={() => setOff(off + 1)} />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((x) => <span key={x} className="text-center text-label-md text-on-surface-variant py-2">{x}</span>)}
          {Array.from({ length: first }, (_, i) => <span key={"e" + i} />)}
          {Array.from({ length: dim }, (_, i) => {
            const key = kk(i + 1), n = by[key]?.length;
            return (
              <button key={key} onClick={() => setDay(key)} aria-label={L.dl(key) + (n ? `, ${n} maç` : "")}
                className={cx("state relative grid place-items-center aspect-square max-h-18 rounded-full sm:aspect-auto sm:h-16 sm:rounded-lg text-body-lg",
                  day === key ? "bg-primary text-on-primary" : n ? "bg-secondary-container text-on-secondary-container" : today === key && "text-primary shadow-[inset_0_0_0_1px_var(--color-primary)]")}>
                {i + 1}{n ? <i className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full grid place-items-center not-italic text-label-sm bg-tertiary text-on-tertiary">{n}</i> : null}
              </button>
            );
          })}
        </div>
      </Panel>
      {day ? (by[day] ? <DayGroups list={by[day]} /> : <Panel v="outlined"><Empty icon="event_busy">{L.dl(day)}: bu gün maç yok.</Empty></Panel>)
        : <p className="text-body-sm text-on-surface-variant px-1">Maç olan günler renkli görünür. Bir güne dokunun.</p>}
    </>
  );
}

export function Teams() {
  const { d } = useLeague();
  return <><PageTitle title="Takımlar"><CmsLink to={cms("teams", "create")} icon="group_add">Takım ekle</CmsLink></PageTitle>{d.teams.length ? <TeamGrid detail /> : <NoLeague />}</>;
}

export function Team({ id }) {
  const { d, T, rows, ms } = useLeague(), t = T[id];
  if (!t) return <><PageTitle title="Takım" /><Panel v="outlined"><Empty icon="search_off">Takım bulunamadı.</Empty></Panel></>;
  const i = rows.findIndex((x) => x.id === id), r = rows[i], list = L.teamPlayers(d, id), tm = ms.filter((m) => m.home === id || m.away === id);
  return (
    <>
      <div className="flex justify-between items-center gap-2"><Button variant="text" href="/takimlar"><Icon n="arrow_back" />Takımlar</Button><CmsLink to={cms("teams", id)}>Takımı düzenle</CmsLink></div>
      <section className="flex items-center gap-6 flex-wrap p-7 rounded-xl bg-primary-container text-on-primary-container">
        <Crest t={t} s={96} />
        <div className="flex-1 min-w-0"><h1 className="text-headline-lg">{t.name}</h1><p className="text-body-lg">{[t.cls, i >= 0 ? i + 1 + ". sıra" : ""].filter(Boolean).join(" · ")}</p></div>
        {r && (
          <div className="flex gap-2 flex-wrap">
            {[[r.p, "puan"], [r.o, "maç"], [`${r.g}-${r.b}-${r.m}`, "G-B-M"], [`${r.ag}-${r.yg}`, "gol"]].map(([v, l]) => (
              <span key={l} className="flex flex-col items-center px-4 py-2.5 rounded-lg bg-surface/60 min-w-19"><b className="text-headline-sm score">{v}</b><small className="text-label-md">{l}</small></span>
            ))}
          </div>
        )}
      </section>
      <Panel>
        <CardHead title="Oyuncular" icon="groups"><span className="text-label-lg text-on-surface-variant">{list.length} oyuncu</span></CardHead>
        {list.length ? (
          <div className="tabular-nums" role="table">
            <div role="row" className="grid grid-cols-[32px_1fr_repeat(4,44px)] items-center gap-1 px-1 py-2.5 text-center text-label-md text-on-surface-variant [&_.msi]:text-[18px]">
              <span>#</span><span className="text-left">Oyuncu</span><span title="Gol"><Icon n="sports_soccer" /></span><span title="Asist"><Icon n="assistant_navigation" /></span><span><CardGlyph k="Y" /></span><span><CardGlyph k="R" /></span>
            </div>
            {list.map((p, j) => (
              <div key={p.n.toLowerCase()} role="row" className={cx("grid grid-cols-[32px_1fr_repeat(4,44px)] items-center gap-1 px-1 py-2.5 text-center border-t border-outline-variant", j === 0 && p.g + p.a > 0 && "bg-gold-container rounded-md border-transparent")}>
                <span className="text-label-lg text-on-surface-variant">{j + 1}</span>
                <span className="flex flex-col items-start gap-1 text-left"><b className="text-title-sm">{p.n}</b>
                  {p.og ? <small className="text-body-sm text-on-surface-variant">{p.og} kendi kalesine</small> : null}
                  {p.inj && <Chip v="error" className="h-6"><Icon n="personal_injury" />{p.inj.note || "Sakat"}{p.inj.ret ? ", dönüş: " + p.inj.ret : ""}</Chip>}
                </span>
                {[p.g, p.a, p.y, p.r].map((v, x) => <span key={x} className={v ? "text-title-sm" : "text-on-surface-variant opacity-45"}>{v}</span>)}
              </div>
            ))}
          </div>
        ) : <Empty icon="person_search">Bu takımın oyuncuları, yönetici listeyi girince veya maçlarda gol, asist ya da kart kaydı oluşunca burada görünür.</Empty>}
      </Panel>
      <p className="text-body-sm text-on-surface-variant px-1">Gol, asist ve kart sayıları hakemin ve yöneticinin girdiği maç olaylarından hesaplanır.</p>
      {tm.length > 0 && <><h3 className="text-title-lg">Maçlar</h3><MatchGrid list={tm} /></>}
    </>
  );
}

export function Match({ id }) {
  const { ms, admin } = useLeague(), m = ms.find((x) => x.id === id);
  if (!m) return <><PageTitle title="Maç detayı" /><Panel v="outlined"><Empty icon="search_off">Maç bulunamadı.</Empty></Panel></>;
  return (
    <>
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <Button variant="text" href="/fikstur"><Icon n="arrow_back" />Fikstür</Button>
        {admin && <div className="flex gap-2"><Button variant="text" href={cms("matches", m.id)}><Icon n="edit" />CMS</Button><Button variant="tonal" href={`/hakem/${m.id}`}><Icon n="scoreboard" />Yönet</Button></div>}
      </div>
      <Scoreboard m={m} />
    </>
  );
}

export function Live() {
  const { live } = useLeague();
  return (
    <>
      <PageTitle title="Canlı maçlar" />
      {live.length ? <div className={grid2}>{live.map((m) => <Scoreboard key={m.id} m={m} lim={4} link />)}</div>
        : <Panel v="outlined"><Empty icon="live_tv">Şu an canlı maç yok. Hakem maçı başlatınca burada anında görünür.</Empty></Panel>}
    </>
  );
}

export function News() {
  const { d, S } = useLeague();
  return (
    <>
      <PageTitle title="Duyurular"><CmsLink to={cms("notices", "create")} icon="add">Duyuru yaz</CmsLink></PageTitle>
      {d.notices.length ? (
        <div className="flex flex-col gap-4">
          {d.notices.map((n, i) => (
            <article key={n.id} className={cx("flex items-start gap-4 px-5 py-4 rounded-md", i === 0 ? "bg-primary-container text-on-primary-container" : "bg-surface border border-outline-variant")}>
              <Icon n="campaign" className={cx("mt-0.5", i ? "text-primary" : "")} />
              <div className="flex-1 min-w-0">
                <span className={cx("text-label-md", i && "text-on-surface-variant")}>{L.fmtAt(n.at, S.timezone)}</span>
                <p className="text-body-lg mt-1 whitespace-pre-line">{n.text}</p>
              </div>
              <CmsIcon to={cms("notices", n.id)} />
            </article>
          ))}
        </div>
      ) : <Panel v="outlined"><Empty icon="notifications_off">Henüz duyuru yok.</Empty></Panel>}
    </>
  );
}
const CmsIcon = ({ to }) => (useLeague().admin ? <IconButton icon="edit" label="CMS’de düzenle" href={to} className="[color:inherit]" /> : null);

export function Injuries() {
  const { d, T } = useLeague(), by = {};
  d.injuries.forEach((x) => (by[x.team] ||= []).push(x));
  return (
    <>
      <PageTitle title="Sakatlıklar"><CmsLink to={cms("injuries", "create")} icon="add">Sakatlık ekle</CmsLink></PageTitle>
      {d.injuries.length ? (
        <div className={grid2}>
          {Object.keys(by).map((tid) => (
            <Panel key={tid}>
              <CardHead title={T[tid]?.name}><Chip v="error">{by[tid].length} sakat</Chip></CardHead>
              <List>
                {by[tid].map((x) => (
                  <li key={x.id} className={listItem}>
                    <AvatarIcon icon="personal_injury" />
                    <span className="flex-1 min-w-0"><b className="text-title-sm">{x.player}</b><small className="text-body-sm text-on-surface-variant block">{x.note || "Sakatlık"}</small></span>
                    {x.ret && <Chip><Icon n="event_repeat" />{x.ret}</Chip>}
                    <CmsIcon to={cms("injuries", x.id)} />
                  </li>
                ))}
              </List>
            </Panel>
          ))}
        </div>
      ) : <Panel v="outlined"><Empty icon="health_and_safety">Şu an sakat oyuncu yok.</Empty></Panel>}
    </>
  );
}

export function About() {
  const { d } = useLeague();
  return (
    <>
      <PageTitle title="Hakkında"><CmsLink to={cms("globals/about")}>Sayfayı düzenle</CmsLink></PageTitle>
      <div className={grid2}>
        {d.about.sections.map((s) => (
          <Panel v="filled" key={s.id || s.title}><AvatarIcon icon={s.icon || "info"} lg /><h3 className="text-title-lg mt-1">{s.title}</h3><p className="text-body-md whitespace-pre-line">{s.body}</p></Panel>
        ))}
      </div>
      {d.about.rules.length > 0 && (
        <Panel>
          <CardHead title="Kurallar" icon="gavel" />
          <List>{d.about.rules.map((r) => <li key={r.id || r.text} className={listItem}><AvatarIcon icon={r.icon || "rule"} /><span className="text-body-md flex-1">{r.text}</span></li>)}</List>
        </Panel>
      )}
    </>
  );
}

export function Mcl() {
  const { ms, T, mclDoc, admin, run, confirm } = useLeague();
  if (!mclDoc) return <><PageTitle title="Master Champions League" /><Panel v="outlined"><Empty icon="trophy">Master Champions League lig bitince ilk 4 takımla başlar.</Empty></Panel></>;
  const M = ms.filter((x) => x.stage === "mcl"), by = (r) => M.filter((x) => x.round === r), sf = [...by("sf1"), ...by("sf2")], fin = by("f"), t3 = by("t3");
  const champ = fin[0] ? L.winnerOf(fin[0]) : null, canFinal = admin && sf.length === 2 && sf.every((x) => L.winnerOf(x)) && !fin.length;
  const reset = async () => { if (await confirm({ title: "Champions League sıfırlansın mı?", text: "Tüm MCL maçları ve sonuçları silinir.", ok: "Sıfırla", danger: true })) run(resetMcl(), "Master Champions League sıfırlandı"); };
  const col = (title, list) => <><h3 className="text-title-md">{title}</h3><div className="flex flex-col gap-4">{list.map((m) => <MatchCard key={m.id} m={m} tools />)}</div></>;
  return (
    <>
      <PageTitle title="Master Champions League" />
      <section className="relative overflow-hidden p-7 rounded-xl bg-tertiary-container text-on-tertiary-container flex flex-col gap-3">
        <Icon n="trophy" fill className="absolute -right-2.5 -top-2.5 text-[180px]! opacity-12 rotate-12" />
        <span className="text-label-lg">Lig sonunda ilk 4</span>
        <p className="text-body-lg">1. ile 4., 2. ile 3. yarı finalde eşleşir. Kazananlar finale, kaybedenler 3.lük maçına çıkar.</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 mt-2">
          {mclDoc.seeds.map((id, i) => (
            <span key={id} className="flex items-center gap-2.5 py-2 pl-2 pr-3 rounded-full bg-surface/55">
              <span className="size-7 rounded-full grid place-items-center bg-tertiary text-on-tertiary text-title-sm shrink-0">{i + 1}</span><Crest t={T[id]} s={32} /><span className="text-title-sm">{T[id]?.name}</span>
            </span>
          ))}
        </div>
      </section>
      {champ && (
        <section className="flex flex-col items-center gap-3 text-center p-8 rounded-xl bg-gold-container">
          <Crest t={T[champ]} s={88} />
          <span className="text-label-lg">Master Champions League</span>
          <h2 className="text-headline-lg"><Icon n="trophy" fill className="text-gold text-[32px]" /> Şampiyon: {T[champ]?.name}</h2>
        </section>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-6 [&>div]:flex [&>div]:flex-col [&>div]:gap-3">
        <div>{col("Yarı finaller", sf)}</div>
        <div>
          {fin.length ? col("Final", fin) : <><h3 className="text-title-md">Final</h3><p className="text-body-sm text-on-surface-variant">Final ve 3.lük maçı, iki yarı final bitince oluşturulur.</p></>}
          {t3.length > 0 && col("3.lük maçı", t3)}
        </div>
      </div>
      {admin && (
        <Panel v="filled">
          <CardHead title="Yönetici" icon="admin_panel_settings" />
          <p className="text-body-sm text-on-surface-variant">Maçların tarih ve saatini <Icon n="edit" className="text-base!" /> ile CMS’de, skorunu <Icon n="scoreboard" className="text-base!" /> ile hakem panelinde girersiniz. Yarı final berabere biterse penaltı galibini seçin.</p>
          <div className="flex justify-end gap-2 flex-wrap">
            <Button variant="danger-outlined" onClick={reset}><Icon n="restart_alt" />Sıfırla</Button>
            {canFinal && <Button onClick={() => run(makeFinal(), "Final ve 3.lük maçı oluşturuldu")}><Icon n="account_tree" />Final ve 3.lük maçını oluştur</Button>}
          </div>
        </Panel>
      )}
    </>
  );
}
