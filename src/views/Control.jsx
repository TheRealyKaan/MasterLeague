"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLeague } from "@/components/state.jsx";
import { MinuteTag, Scoreboard } from "@/components/league.jsx";
import { AvatarIcon, Button, CardGlyph, CardHead, Check, Chip, cms, Crest, cx, Empty, EvIcon, Field, Icon, IconButton, List, listItem, PageTitle, Panel, Pulse, Rank, Select } from "@/components/ui.jsx";
import { matchAction, pickMatch, startMcl } from "@/server/actions";
import * as L from "@/lib/league.js";

const label = (T, x) => (x.date ? L.fdt(x.date) + ": " : "") + T[x.home]?.name + " - " + T[x.away]?.name;
const TeamSide = ({ t }) => <span className="flex flex-col items-center gap-2.5 text-center min-w-0"><Crest t={t} s={56} /><span className="text-title-md">{t?.name}</span></span>;

function AdminFixes({ m }) {
  const { T, run, now, len } = useLeague(), g = L.sc(m), [f, setF] = useState({});
  const act = (op, msg) => run(matchAction(m.id, op), msg);
  const sh = f.sh ?? (m.so ? m.so.h : g.h), sa = f.sa ?? (m.so ? m.so.a : g.a);
  return (
    <Panel v="filled" className="gap-5">
      <CardHead title="Yönetici düzeltmeleri" icon="tune"><IconButton icon="open_in_new" label="CMS’de aç" href={cms("matches", m.id)} /></CardHead>
      <div className="flex gap-3 flex-wrap">
        <Select label="Maç durumu" value={m.status} onChange={(e) => act({ type: "status", value: e.target.value }, "Durum değişti")}>
          <option value="sched">Başlamadı</option><option value="live">Canlı</option><option value="done">Bitti</option>
        </Select>
        {m.stage === "mcl" && (
          <Select label="Beraberlikte kazanan (penaltılar)" value={m.pw || ""} onChange={(e) => act({ type: "pen", value: e.target.value }, "Penaltı galibi kaydedildi")}>
            <option value="">Belirlenmedi</option><option value="h">{T[m.home]?.name}</option><option value="a">{T[m.away]?.name}</option>
          </Select>
        )}
      </div>
      <p className="text-label-lg">Skoru elle ayarla{m.so ? ` (şu an elle: ${m.so.h}-${m.so.a})` : ""}</p>
      <div className="flex items-center gap-3">
        <Field label={T[m.home]?.name} type="number" inputMode="numeric" min="0" value={sh} onChange={(e) => setF({ ...f, sh: e.target.value })} />
        <span className="text-headline-sm">–</span>
        <Field label={T[m.away]?.name} type="number" inputMode="numeric" min="0" value={sa} onChange={(e) => setF({ ...f, sa: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2 flex-wrap">
        {m.so && <Button variant="text" onClick={() => act({ type: "clearScore" }, "Skor tekrar olaylardan hesaplanıyor").then(() => setF({}))}>Olaylardan hesapla</Button>}
        <Button variant="tonal" onClick={() => act({ type: "score", h: sh, a: sa }, "Skor değiştirildi")}>Skoru uygula</Button>
      </div>
      {m.status === "live" && (
        <div className="flex items-center gap-3">
          <Field label="Sayaç dakikası" type="number" inputMode="numeric" value={f.cm ?? L.minOf(m, now, len)} onChange={(e) => setF({ ...f, cm: e.target.value })} />
          <Button variant="tonal" onClick={() => act({ type: "clock", minute: f.cm ?? L.minOf(m, now, len) }, "Sayaç ayarlandı")}><Icon n="timer" />Ayarla</Button>
        </div>
      )}
    </Panel>
  );
}

export function Referee({ id }) {
  const { ms, T, role, admin, refM, live, roster, now, len, S, run, confirm } = useLeague();
  const router = useRouter();
  const m = refM || ms.find((x) => x.id === id) || live[0] || ms.find((x) => x.status === "sched") || ms[0];
  const [f, setF] = useState({}), [busy, setBusy] = useState(false), [cur, setCur] = useState(m?.id);
  if (m?.id !== cur) { setCur(m?.id); setF({}); } // reset the form when the match changes
  if (!m) return <><PageTitle title="Hakem paneli" /><Panel v="outlined"><Empty icon="event_note">Önce CMS’den maç ekleyin.</Empty></Panel></>;
  if (role === "referee" && m.status === "done") return (
    <><PageTitle title="Hakem paneli" /><Scoreboard m={m} /><Panel v="outlined"><Empty icon="lock">Bu maç bitti. Sonuç ve olaylarda düzeltme için yönetici gerekir.</Empty></Panel></>
  );
  const g = L.sc(m), team = f.team === m.home || f.team === m.away ? f.team : m.home, editing = f.ts != null;
  const set = (k, v) => setF({ ...f, team, [k]: v });
  const act = async (op, msg) => { setBusy(true); const ok = await run(matchAction(m.id, op), msg); setBusy(false); return ok; };
  const save = async (kind) => {
    const ok = await act({ type: "event", kind, team, player: f.player, assist: f.assist, minute: f.min ?? "", og: !!f.og, ...(editing ? { ts: f.ts } : {}) },
      editing ? "Olay güncellendi" : kind === "G" ? "Gol eklendi" : "Kart eklendi");
    if (ok) setF({ team });
  };
  const edit = (e) => setF({ team: e.k === "OG" ? e.ptm : e.team, player: e.player || "", assist: e.assist || "", min: e.min, og: e.k === "OG", ts: e.ts });
  const finish = async () => { if (await confirm({ title: "Maç bitirilsin mi?", text: `${T[m.home]?.name} ${g.h} - ${g.a} ${T[m.away]?.name}`, ok: "Maçı bitir" })) act({ type: "finish" }, "Maç bitti"); };
  const undo = S.undoMinutes * 60000;

  return (
    <>
      <PageTitle title="Hakem paneli" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          {admin && (
            <Panel v="filled">
              <Select label="Maç" value={m.id} onChange={(e) => router.push(`/hakem/${e.target.value}`)}>
                {ms.map((x) => <option key={x.id} value={x.id}>{label(T, x)}{x.status === "live" ? " (canlı)" : ""}</option>)}
              </Select>
              {live.some((x) => x.id !== m.id) && (
                <div className="flex flex-wrap gap-2">{live.map((x) => (
                  <button key={x.id} onClick={() => router.push(`/hakem/${x.id}`)} className={cx("state inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border text-label-lg", x.id === m.id ? "bg-secondary-container text-on-secondary-container border-transparent" : "border-outline-variant")}>
                    <Pulse />{T[x.home]?.name} - {T[x.away]?.name}
                  </button>
                ))}</div>
              )}
            </Panel>
          )}
          <section className="rounded-md px-4 py-6 flex flex-col items-center gap-4 bg-surface-container">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full">
              <TeamSide t={T[m.home]} /><span className="score text-[56px] leading-[64px] font-bold">{g.h} – {g.a}</span><TeamSide t={T[m.away]} />
            </div>
            {m.status === "live" && <p className="flex items-center gap-2 text-title-md text-error tabular-nums"><Pulse />{L.clockOf(m, now, len)}</p>}
            {m.status === "sched" ? <Button size="xl" className="w-full max-w-90" disabled={busy} onClick={() => act({ type: "start" }, "Maç canlı")}><Icon n="play_arrow" fill />Maçı başlat</Button>
              : m.status === "live" ? <Button size="xl" variant="danger" className="w-full max-w-90" disabled={busy} onClick={finish}><Icon n="stop" fill />Maçı bitir</Button>
              : admin ? <Button size="xl" variant="tonal" className="w-full max-w-90" disabled={busy} onClick={() => act({ type: "reopen" }, "Maç yeniden açıldı")}><Icon n="undo" />Yeniden aç</Button> : null}
          </section>
          {admin && <AdminFixes key={m.id} m={m} />}
        </div>

        <Panel className={cx("gap-5", editing && "shadow-[inset_0_0_0_2px_var(--color-primary),var(--shadow-1)]")}>
          <CardHead title={editing ? "Olayı düzenle" : "Olay ekle"} icon={editing ? "edit" : "add_circle"} />
          <div className="flex border border-outline rounded-full overflow-hidden divide-x divide-outline" role="radiogroup" aria-label="Takım">
            {[m.home, m.away].map((tid) => (
              <button key={tid} role="radio" aria-checked={team === tid} onClick={() => setF({ ...f, team: tid })}
                className={cx("state flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 h-10 px-3 text-label-lg truncate", team === tid && "bg-secondary-container text-on-secondary-container")}>
                <Crest t={T[tid]} s={22} />{T[tid]?.name}
              </button>
            ))}
          </div>
          <datalist id="pl">{roster(team).map((n) => <option key={n} value={n} />)}</datalist>
          <div className="flex gap-3">
            <Field label="Oyuncu" list="pl" value={f.player || ""} onChange={(e) => set("player", e.target.value)} placeholder="Ad Soyad" className="flex-[2]" />
            <Field label="Dakika" type="number" inputMode="numeric" value={f.min ?? L.minOf(m, now, len)} onChange={(e) => set("min", e.target.value)} className="flex-[0_0_110px]" />
          </div>
          <Field label="Asist (sadece gol için)" list="pl" value={f.assist || ""} onChange={(e) => set("assist", e.target.value)} placeholder="Asist yapan oyuncu" />
          <Check checked={!!f.og} onChange={(e) => set("og", e.target.checked)}>Kendi kalesine: seçili takımın oyuncusu attı, gol rakibe yazılır</Check>
          <div className="grid grid-cols-2 gap-2">
            <Button size="xl" className="col-span-2" disabled={busy} onClick={() => save("G")}><Icon n="sports_soccer" />{editing ? "Gol olarak kaydet" : "Gol"}</Button>
            <Button variant="yellow" disabled={busy} onClick={() => save("Y")}><CardGlyph k="Y" className="-ml-1.5" />{editing ? "Sarı olarak kaydet" : "Sarı kart"}</Button>
            <Button variant="red" disabled={busy} onClick={() => save("R")}><CardGlyph k="R" className="-ml-1.5" />{editing ? "Kırmızı olarak kaydet" : "Kırmızı kart"}</Button>
          </div>
          {editing && <Button variant="text" onClick={() => setF({ team })}>Düzenlemeden vazgeç</Button>}
          {role === "referee" && <p className="text-body-sm text-on-surface-variant">Girilen gol ve kartlar {S.undoMinutes} dakika içinde geri alınabilir. Sonrasında düzeltmeyi yalnızca yönetici yapabilir.</p>}
          <List>
            {(m.events || []).map((e) => (
              <li key={e.ts} className={cx(listItem, "min-h-13", f.ts === e.ts && "bg-secondary-container")}>
                <MinuteTag min={e.min} /><EvIcon k={e.k} />
                <span className="flex-1 min-w-0"><b className="text-title-sm">{e.player || "Gol"}{e.k === "OG" ? " (K.K.)" : ""}</b><small className="text-body-sm text-on-surface-variant block">{T[e.team]?.name}{e.assist ? " · asist " + e.assist : ""}</small></span>
                {admin && <IconButton icon="edit" label="Düzenle" onClick={() => edit(e)} />}
                {(admin || now - e.ts < undo) && <IconButton icon="delete" label="Sil" danger disabled={busy} onClick={() => act({ type: "delEvent", ts: e.ts }, "Olay silindi")} />}
              </li>
            ))}
          </List>
        </Panel>
      </div>
    </>
  );
}

const SHORTCUTS = [
  ["matches", "Maçlar", "event_note", (d) => d.matches.length],
  ["teams", "Takımlar", "groups", (d) => d.teams.length],
  ["injuries", "Sakatlıklar", "personal_injury", (d) => d.injuries.length],
  ["notices", "Duyurular", "campaign", (d) => d.notices.length],
  ["users", "Hakemler ve yöneticiler", "badge"],
  ["media", "Görseller", "image"],
  ["votes", "Taraftar oyları", "how_to_vote", (d) => Object.values(d.votes).reduce((s, v) => s + v.h + v.a, 0)],
  ["globals/settings", "Lig ayarları ve kurallar", "tune"],
  ["globals/about", "Hakkında sayfası", "info"],
  ["globals/champions-league", "Champions League", "trophy"],
];

export function Admin() {
  const { d, T, rows, mclDoc, run, confirm, go } = useLeague();
  const start = async () => {
    if (rows.length < 4) return run(Promise.resolve({ ok: false, error: "En az 4 takım gerekir" }));
    if (await confirm({ title: "Master Champions League başlasın mı?", text: "İlk 4: " + rows.slice(0, 4).map((r) => T[r.id]?.name).join(", ") + ". 1.–4. ve 2.–3. yarı finalde eşleşir.", ok: "Başlat" }))
      if (await run(startMcl(), "Master Champions League başladı")) go("mcl");
  };
  return (
    <>
      <PageTitle title="Yönetim"><Button href={cms()}><Icon n="dashboard_customize" />İçerik yönetimi</Button></PageTitle>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
        <Panel>
          <CardHead title="İçerik yönetimi (CMS)" icon="dashboard_customize" />
          <p className="text-body-sm text-on-surface-variant">Takımlar, fikstür, sonuçlar, sakatlıklar, duyurular, hakem hesapları, kurallar, puanlama, tema rengi, logo ve Hakkında sayfası CMS’den yönetilir. Değişiklikler sitede birkaç saniye içinde görünür.</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
            {SHORTCUTS.map(([c, n, ic, count]) => (
              <a key={c} href={cms(c)} className="state flex items-center gap-3 p-3 rounded-lg bg-surface-container">
                <AvatarIcon icon={ic} /><span className="text-title-sm flex-1">{n}</span>{count && <span className="text-label-lg text-on-surface-variant">{count(d)}</span>}
              </a>
            ))}
          </div>
        </Panel>
        <section className="rounded-md p-4 flex flex-col gap-3 bg-tertiary-container text-on-tertiary-container [&_.text-primary]:text-current">
          <CardHead title="Master Champions League" icon="trophy" />
          {mclDoc ? (
            <><p className="text-body-md">Başladı. İlk 4: {mclDoc.seeds.map((id) => T[id]?.name).join(", ")}.</p>
              <div className="flex justify-end"><Button variant="tonal" href="/champions-league">Sayfaya git<Icon n="arrow_forward" /></Button></div></>
          ) : (
            <>
              <p className="text-body-sm">Lig bitince puan durumundaki ilk 4 takımla başlatın. Şu anki ilk 4:</p>
              <ol className="flex flex-col divide-y divide-current/15">
                {rows.slice(0, 4).map((r, i) => <li key={r.id} className="flex items-center gap-3 min-h-11 px-1"><Rank n={i + 1} /><Crest t={T[r.id]} s={28} /><b className="text-title-sm flex-1">{T[r.id]?.name}</b><b className="text-title-sm">{r.p}</b></li>)}
              </ol>
              <div className="flex justify-end"><Button onClick={start}><Icon n="play_arrow" />Başlat</Button></div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

export function Login() {
  const { user, role, admin, refM, ms, T, login, logout, run, go } = useLeague();
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    const u = await login(email, pw);
    setBusy(false);
    if (u) { setPw(""); if (u.role === "admin") go("admin"); }
  };
  const pick = async (id) => { if (await run(pickMatch(id), "Maç seçildi")) go("ref"); };
  const open = ms.filter((x) => x.status !== "done");
  const card = "w-full max-w-[480px] gap-5";
  return (
    <>
      <PageTitle title="Giriş" />
      <div className="grid justify-items-center gap-4">
        {!user && (
          <form onSubmit={submit} className={cx("rounded-md bg-surface-container-low shadow-1 p-4 flex flex-col [--field-bg:var(--color-surface-container-low)]", card)}>
            <AvatarIcon icon="lock" lg />
            <h2 className="text-headline-sm">Hakem ve yönetici girişi</h2>
            <p className="text-body-md text-on-surface-variant">Hesaplar CMS’de, Kullanıcılar bölümünden açılır. İlk hesabı /admin adresinde oluşturan kişi yönetici olur.</p>
            <Field label="E-posta" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            <Field label="Şifre" type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
            <div className="flex justify-end"><Button disabled={busy || !email || !pw}>{busy ? <span className="size-[18px] rounded-full border-2 border-current border-r-transparent animate-spin -ml-2" /> : <Icon n="login" />}Giriş yap</Button></div>
          </form>
        )}
        {role === "referee" && (
          <Panel className={card}>
            <AvatarIcon icon="sports" lg />
            {refM && refM.status !== "done" ? (
              <><h2 className="text-headline-sm">Hakem girişi: {user.name || user.email}</h2>
                <p className="text-body-md">Yönettiğiniz maç: <b>{T[refM.home]?.name} - {T[refM.away]?.name}</b>{refM.date ? " (" + L.fdt(refM.date) + ")" : ""}</p>
                <div className="flex justify-end gap-2"><Button href="/hakem"><Icon n="scoreboard" />Hakem paneli</Button></div></>
            ) : null}
            <h3 className="text-title-md">{refM && refM.status !== "done" ? "Başka maç seç" : "Yöneteceğiniz maçı seçin"}</h3>
            {open.length ? (
              <List>{open.map((x) => (
                <li key={x.id}><button onClick={() => pick(x.id)} className={cx(listItem, "state")}>
                  <Crest t={T[x.home]} s={28} /><span className="text-title-sm flex-1">{label(T, x)}</span>{x.status === "live" && <Chip v="live">Canlı</Chip>}<Icon n="chevron_right" />
                </button></li>
              ))}</List>
            ) : <Empty icon="event_busy">Yönetilecek maç yok.</Empty>}
            <div className="flex justify-end"><Button variant="text" onClick={logout}><Icon n="logout" />Çıkış yap</Button></div>
          </Panel>
        )}
        {admin && (
          <Panel className={card}>
            <AvatarIcon icon="admin_panel_settings" lg />
            <h2 className="text-headline-sm">Yönetici: {user.name || user.email}</h2>
            <div className="flex justify-end gap-2 flex-wrap"><Button variant="text" onClick={logout}><Icon n="logout" />Çıkış yap</Button><Button variant="tonal" href={cms()}>CMS</Button><Button href="/yonetim">Yönetim</Button></div>
          </Panel>
        )}
      </div>
    </>
  );
}
