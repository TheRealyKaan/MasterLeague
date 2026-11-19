"use client";
import Link from "next/link";
import { crestColors } from "@/lib/theme.js";
import { initials } from "@/lib/league.js";

export const cx = (...a) => a.filter(Boolean).join(" ");

/* ---------- routes ---------- */
const PATHS = {
  home: "/", live: "/canli", table: "/puan-durumu", fix: "/fikstur", mcl: "/champions-league", cal: "/takvim", teams: "/takimlar",
  team: "/takimlar", match: "/mac", news: "/duyurular", stats: "/istatistikler", injury: "/sakatliklar", about: "/hakkinda",
  ref: "/hakem", admin: "/yonetim", login: "/giris",
};
export const href = (k, id) => (PATHS[k] || "/") + (id ? "/" + encodeURIComponent(id) : "");
/** CMS (Payload admin) deep links */
export const cms = (collection, id) => "/admin" + (collection ? (collection.startsWith("globals/") ? "/" : "/collections/") + collection + (id ? "/" + id : "") : "");

/* ---------- icons ---------- */
export const Icon = ({ n, fill, className = "", ...p }) => <span className={cx("msi", fill && "msi-fill", className)} aria-hidden="true" {...p}>{n}</span>;

/* ---------- buttons ---------- */
const BTN = {
  base: "state inline-flex items-center justify-center gap-2 h-10 px-6 rounded-full text-label-lg whitespace-nowrap transition-shadow duration-200 disabled:opacity-40 disabled:pointer-events-none [&>.msi]:text-[18px] [&>.msi:first-child]:-ml-2 [&>.msi:last-child:not(:first-child)]:-mr-2",
  filled: "bg-primary text-on-primary hover:shadow-1",
  tonal: "bg-secondary-container text-on-secondary-container",
  outlined: "border border-outline text-primary",
  text: "px-3 text-primary [&>.msi:first-child]:-ml-1",
  danger: "bg-error text-on-error",
  "danger-text": "px-3 text-error",
  "danger-outlined": "border border-error text-error",
  yellow: "bg-[color-mix(in_srgb,var(--color-card-yellow)_30%,var(--color-surface-container-highest))]",
  red: "bg-[color-mix(in_srgb,var(--color-card-red)_22%,var(--color-surface-container-highest))]",
};
const SIZE = { sm: "h-8 px-3", xl: "h-14 px-7 text-[16px] rounded-lg [&>.msi]:text-2xl" };
export function Button({ variant = "filled", size, className, href: to, ...p }) {
  const c = cx(BTN.base, BTN[variant], SIZE[size], className);
  if (to) return /^\/admin|^https?:/.test(to) ? <a className={c} href={to} {...p} /> : <Link className={c} href={to} {...p} />;
  return <button className={c} {...p} />;
}
export function IconButton({ icon, label, danger, tonal, fill, className, href: to, ...p }) {
  const c = cx("state inline-grid place-items-center size-10 rounded-full shrink-0", danger ? "text-error" : tonal ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant", className);
  const inner = <Icon n={icon} fill={fill} />;
  if (to) return <a className={c} href={to} aria-label={label} title={label} {...p}>{inner}</a>;
  return <button className={c} aria-label={label} title={label} {...p}>{inner}</button>;
}

/* ---------- chips ---------- */
const CHIP = {
  base: "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-sm text-label-md whitespace-nowrap shrink-0 [&>.msi]:text-base",
  default: "border border-outline-variant text-on-surface-variant",
  assist: "h-8 px-3 text-label-lg border border-outline [&>.msi]:text-[18px] [&>.msi]:text-primary",
  tonal: "bg-secondary-container text-on-secondary-container",
  live: "bg-error text-on-error tabular-nums",
  gold: "bg-gold text-on-gold",
  error: "bg-error-container text-on-error-container",
};
export const Chip = ({ v = "default", className, ...p }) => <span className={cx(CHIP.base, CHIP[v], className)} {...p} />;
export const Pulse = () => <i className="size-2 rounded-full bg-current animate-pulse-dot shrink-0" />;
export const LiveChip = ({ children = "Canlı" }) => <Chip v="live"><Pulse />{children}</Chip>;

/* ---------- cards ---------- */
const CARD = {
  base: "relative block w-full rounded-md",
  elevated: "bg-surface-container-low shadow-1 [--field-bg:var(--color-surface-container-low)]",
  filled: "bg-surface-container-highest [--field-bg:var(--color-surface-container-highest)]",
  outlined: "bg-surface border border-outline-variant",
  plain: "",
};
export const cardCls = (v = "elevated", { interactive, panel } = {}) =>
  cx(CARD.base, CARD[v], interactive && "state cursor-pointer text-left transition-shadow duration-200 hover:shadow-2", panel && "p-4 flex flex-col gap-3");
export const Card = ({ v, interactive, panel, className, as: As = "section", ...p }) => <As className={cx(cardCls(v, { interactive, panel }), className)} {...p} />;
export const Panel = (p) => <Card panel {...p} />;

export const CardHead = ({ title, icon, children }) => (
  <div className="flex items-center gap-2.5 min-h-10 -mt-1">
    {icon && <Icon n={icon} className="text-primary text-[22px]" />}
    <h3 className="text-title-md">{title}</h3>
    <span className="flex-1" />
    {children}
  </div>
);

export function SectionHead({ over, title, to, toLabel = "Tümü" }) {
  return (
    <div className="flex items-end justify-between gap-3 mx-1 mb-3">
      <div>{over && <span className="text-label-lg text-primary first-letter:uppercase block">{over}</span>}<h2 className="text-headline-sm">{title}</h2></div>
      {to && <Button variant="text" href={to}>{toLabel}<Icon n="arrow_forward" /></Button>}
    </div>
  );
}

export const PageTitle = ({ title, over = "Master Lig", children }) => (
  <div className="px-1 pt-2 flex items-end justify-between gap-3 flex-wrap">
    <div><span className="text-label-lg text-primary">{over}</span><h1 className="text-headline-lg mt-0.5">{title}</h1></div>
    {children}
  </div>
);

export const Empty = ({ icon = "sports_soccer", children }) => (
  <div className="flex flex-col items-center gap-3 px-4 py-8 text-center text-on-surface-variant">
    <Icon n={icon} className="text-[40px] p-4 rounded-xl bg-surface-container-high text-primary" />
    <div className="max-w-md">{children}</div>
  </div>
);

/* ---------- lists ---------- */
export const listItem = "flex items-center gap-3 min-h-14 px-1 py-2 rounded-md w-full text-left";
export const List = ({ className, ...p }) => <ul className={cx("flex flex-col divide-y divide-outline-variant", className)} {...p} />;
export const Rank = ({ n }) => <span className="w-6 text-center text-label-lg text-on-surface-variant shrink-0">{n}</span>;
export const AvatarIcon = ({ icon, lg }) => (
  <span className={cx("grid place-items-center shrink-0 bg-secondary-container text-on-secondary-container", lg ? "size-14 rounded-lg [&>.msi]:text-[28px]" : "size-10 rounded-full")}><Icon n={icon} /></span>
);

/* ---------- segmented buttons ---------- */
export function Segmented({ value, onChange, items, label, full }) {
  return (
    <div className={cx("border border-outline rounded-full overflow-hidden max-w-full divide-x divide-outline", full ? "flex" : "inline-flex self-start")} role="radiogroup" aria-label={label}>
      {items.map(([k, n, icon]) => (
        <button key={k} role="radio" aria-checked={value === k} onClick={() => onChange(k)}
          className={cx("state flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 h-10 px-3.5 text-label-lg whitespace-nowrap overflow-hidden transition-colors [&>.msi]:text-[18px]", value === k && "bg-secondary-container text-on-secondary-container")}>
          {value === k ? <Icon n="check" /> : icon ? <Icon n={icon} /> : null}{n}
        </button>
      ))}
    </div>
  );
}

/* ---------- outlined text fields: the label rests on the border ---------- */
const FIELD = "w-full min-h-14 px-4 py-4 rounded-xs bg-transparent border border-outline text-body-lg outline-none transition hover:border-on-surface focus:border-primary focus:shadow-[inset_0_0_0_1px_var(--color-primary)] placeholder:text-on-surface-variant/60";
const Label = ({ children }) => (
  <span className="absolute -top-2 left-3 px-1 text-label-md text-on-surface-variant bg-[var(--field-bg,var(--color-surface))] rounded-xs z-10 max-w-[calc(100%-24px)] truncate pointer-events-none group-focus-within:text-primary">{children}</span>
);
export const Field = ({ label, className, rows, ...p }) => (
  <label className={cx("group relative flex flex-col flex-1 min-w-0", className)}>
    <Label>{label}</Label>
    {rows ? <textarea rows={rows} className={cx(FIELD, "resize-y")} {...p} /> : <input className={FIELD} {...p} />}
  </label>
);
export const Select = ({ label, children, className, ...p }) => (
  <label className={cx("group relative flex flex-col flex-1 min-w-0", className)}>
    <Label>{label}</Label>
    <select className={cx(FIELD, "appearance-none pr-11 cursor-pointer")} {...p}>{children}</select>
    <Icon n="arrow_drop_down" className="absolute right-3 top-4 pointer-events-none text-on-surface-variant" />
  </label>
);
export const Check = ({ children, ...p }) => (
  <label className="flex items-center gap-3 cursor-pointer py-1">
    <input type="checkbox" className="size-[18px] accent-primary shrink-0 m-0" {...p} /><span className="text-body-md">{children}</span>
  </label>
);

export const Progress = ({ value, className, label }) => (
  <div className={cx("h-1 rounded bg-secondary-container overflow-hidden", className)} role="progressbar" aria-label={label} aria-valuenow={Math.round(value * 100)}>
    <i className="block h-full rounded bg-primary transition-[width] duration-1000 ease-linear" style={{ width: value * 100 + "%" }} />
  </div>
);

/* ---------- league glyphs ---------- */
export function Crest({ t, s = 32 }) {
  if (!t) return null;
  const st = { width: s, height: s, fontSize: s * 0.38 };
  if (t.logo) return <img src={t.logo} alt="" width={s} height={s} className="rounded-full object-cover shrink-0 bg-surface-container-high" style={st} />;
  return (
    <span aria-hidden="true" style={{ ...st, ...crestColors(t.hue) }}
      className="inline-grid place-items-center shrink-0 rounded-full font-bold [font-variation-settings:'wdth'_80] bg-(--cr-l) text-(--cr-on-l) dark:bg-(--cr-d) dark:text-(--cr-on-d)">
      {initials(t.name)}
    </span>
  );
}
export const CardGlyph = ({ k, className }) => (
  <span aria-label={k === "Y" ? "Sarı kart" : "Kırmızı kart"} className={cx("inline-block w-3 h-4 rounded-[2px] shrink-0 align-middle rotate-[8deg] shadow-[0_1px_2px_rgb(0_0_0/.25)]", k === "Y" ? "bg-card-yellow" : "bg-card-red", className)} />
);
export const EvIcon = ({ k }) => (k === "Y" || k === "R" ? <CardGlyph k={k} /> : <Icon n="sports_soccer" className={cx("text-xl", k === "OG" && "text-error")} />);

export const Logo = ({ src = "/logo.webp", s = 40, className }) => <img src={src} width={s} height={s} alt="Logo" className={cx("rounded-full block shrink-0 object-cover", className)} />;
