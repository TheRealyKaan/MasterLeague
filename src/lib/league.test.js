import { test } from "node:test";
import assert from "node:assert/strict";
import { stand, stats, sc, winnerOf, predict, weekTeams, prevRanks } from "./league.js";

const teams = [{ id: "t1", name: "Alfa" }, { id: "t2", name: "Beta", adj: -1 }, { id: "t3", name: "Gama" }];
const G = (team, player, min, extra = {}) => ({ k: "G", team, player, min: String(min), ts: min, ...extra });
const matches = [
  { id: "a", home: "t1", away: "t2", date: "2026-11-02T10:00", status: "done", events: [G("t1", "Ali", 5, { assist: "Can" }), G("t1", "Ali", 20), { k: "OG", team: "t2", ptm: "t1", player: "Efe", min: "30" }, { k: "Y", team: "t2", player: "Mert", min: "40" }] },
  { id: "b", home: "t2", away: "t3", date: "2026-11-09T10:00", status: "live", events: [G("t3", "Kaan", 3)] },
  { id: "c", home: "t1", away: "t3", date: "2026-11-16T10:00", status: "sched", events: [] },
  { id: "d", home: "t1", away: "t3", status: "done", stage: "mcl", round: "f", events: [], pw: "a" },
];

test("score counts goals and own goals, manual override wins", () => {
  assert.deepEqual(sc(matches[0]), { h: 2, a: 1 });
  assert.deepEqual(sc({ ...matches[0], so: { h: 0, a: 4 } }), { h: 0, a: 4 });
});

test("standings: points, adjustment, live counts, mcl and sched ignored, form only from done", () => {
  const r = stand(teams, matches);
  assert.deepEqual(r.map((x) => x.id), ["t1", "t3", "t2"]);
  assert.equal(r[0].p, 3);
  assert.equal(r.find((x) => x.id === "t2").p, -1);
  assert.deepEqual(r[0].f, ["G"]);
  assert.deepEqual(r.find((x) => x.id === "t3").f, []); // live match: points yes, form no
});

test("stats: scorers, assists, cards, own goal not credited to scorer", () => {
  const k = stats(matches);
  assert.equal(k.tg, 4);
  assert.deepEqual(k.G.map((p) => [p.n, p.c]), [["Ali", 2], ["Kaan", 1]]);
  assert.deepEqual(k.A.map((p) => [p.n, p.c]), [["Can", 1]]);
  assert.equal(k.yc, 1);
});

test("knockout draw is decided by penalties", () => {
  assert.equal(winnerOf(matches[3]), "t3");
  assert.equal(winnerOf({ ...matches[3], pw: undefined }), null);
});

test("prediction sums to 100", () => {
  const p = predict(stand(teams, matches), matches[2]);
  assert.equal(p[0] + p[1] + p[2], 100);
});

test("week team and previous ranks", () => {
  assert.equal(weekTeams(matches, teams)[0].id, "t3");
  assert.deepEqual(prevRanks(teams, matches), { t1: 1, t2: 3, t3: 2 });
});

test("configurable points per win / draw", () => {
  const r = stand(teams, matches, null, { w: 2, d: 1 });
  assert.equal(r[0].p, 2);
});
