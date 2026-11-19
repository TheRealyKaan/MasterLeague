/* Defaults shared by the CMS (field default values) and the site (fallback when a global is empty). */

export const SETTINGS = {
  leagueName: "Master Lig",
  season: "2026-27 Sezonu",
  tagline: "Canlı skor, puan durumu, fikstür, sonuçlar ve istatistikler tek adreste.",
  themeColor: "#d4202f",
  timezone: "Europe/Istanbul",
  matchMinutes: 60,
  pointsWin: 3,
  pointsDraw: 1,
  undoMinutes: 2,
  footerNote: "© 2026 Master Lig",
};

export const ABOUT = {
  sections: [
    { icon: "groups", title: "Lig", body: "Master Lig, 2010 doğumlular arasında oynanan bir halı saha ligidir. Takımlar sezon boyunca birbirleriyle karşılaşır, sonuçlar ve sıralama bu sayfada tutulur." },
    { icon: "bolt", title: "Canlı", body: "Hakem maçı başlattığı anda skor, dakika, gol, asist ve kartlar sayfayı açan herkesin ekranında güncellenir. Puan tablosu da skorla birlikte değişir." },
    { icon: "school", title: "Turnuva", body: "Lig sürecinin yanında okullararası bir futbol turnuvası düzenlenecek. Turnuvanın finalistleri de bu sayfadan takip edilecek." },
    { icon: "trophy", title: "Master Champions League", body: "Puan durumunda ilk 4 sırayı alan takımlar katılır. 1. ile 4., 2. ile 3. yarı finalde eşleşir; kazananlar finalde, kaybedenler 3.lük maçında oynar. Bu maçlar fikstürde ayrı renkte gösterilir." },
  ],
  rules: [
    { icon: "scoreboard", text: "Galibiyet 3, beraberlik 1, mağlubiyet 0 puandır. Eşitlikte sırasıyla averaj, atılan gol ve takım adı dikkate alınır." },
    { icon: "timer", text: "Maçlar uzatmalar dahil 60 dakikadır. Hakem maçı başlattığında sayaç çalışır." },
    { icon: "style", text: "Sarı ve kırmızı kartlar oyuncu bazında takip edilir." },
    { icon: "admin_panel_settings", text: "Fikstür, takımlar, puan, skor, gol, kart ve sakatlık düzeltmeleri yalnızca yönetici tarafından yapılır." },
  ],
};
