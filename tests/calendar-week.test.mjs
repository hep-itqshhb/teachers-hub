import test from "node:test";
import assert from "node:assert/strict";
import { bruneiDay, currentWeek, validDay, weekActivities } from "../src/calendar-week.mjs";

const activity = (title, start, end = start, extra = {}) => ({ Tajuk: title, TarikhMula: start, TarikhTamat: end, Status: "Disahkan", ...extra });

test("uses Brunei midnight even on a device in another timezone", () => {
  assert.equal(bruneiDay(new Date("2026-11-08T15:59:59Z")), "2026-11-08");
  assert.equal(bruneiDay(new Date("2026-11-08T16:00:00Z")), "2026-11-09");
});

test("shows exactly Monday–Sunday and rolls at Monday midnight in Brunei", () => {
  const before = currentWeek(new Date("2026-11-08T15:59:59Z"));
  const after = currentWeek(new Date("2026-11-08T16:00:00Z"));
  assert.deepEqual(before.days, ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"]);
  assert.equal(after.start, "2026-11-09");
  assert.equal(after.end, "2026-11-15");
  assert.equal(after.days.length, 7);
});

test("handles weeks crossing December–January", () => {
  const week = currentWeek(new Date("2027-01-01T12:00:00+08:00"));
  assert.equal(week.start, "2026-12-28");
  assert.equal(week.end, "2027-01-03");
});

test("includes overlapping activities on each relevant day only", () => {
  const week = currentWeek(new Date("2026-11-05T12:00:00+08:00"));
  const days = weekActivities([
    activity("Overlaps start", "2026-11-01", "2026-11-02"),
    activity("Online class", "2026-11-04", "2026-11-05"),
    activity("Overlaps end", "2026-11-08", "2026-11-10"),
    activity("Next week", "2026-11-09"),
    activity("Previous week", "2026-11-01")
  ], week);
  assert.deepEqual(days.map((d) => d.activities.map((a) => a.Tajuk)), [
    ["Overlaps start"], [], ["Online class"], ["Online class"], [], [], ["Overlaps end"]
  ]);
});

test("sorts by start time then title and keeps planned activities", () => {
  const week = currentWeek(new Date("2026-11-05T12:00:00+08:00"));
  const days = weekActivities([
    activity("Later", "2026-11-05", "", { MasaMula: "09:30" }),
    activity("Early", "2026-11-05", "", { MasaMula: "07:00", Status: "Dirancang" }),
    activity("No time", "2026-11-05", "")
  ], week);
  assert.deepEqual(days[3].activities.map((a) => a.Tajuk), ["Early", "Later", "No time"]);
});

test("ignores canceled, reversed, invalid, and incomplete rows", () => {
  const week = currentWeek(new Date("2026-11-05T12:00:00+08:00"));
  const rows = [null, {}, activity("Bad date", "2026-11-99"), activity("Reversed", "2026-11-06", "2026-11-05"),
    ...["Dibatalkan", "Batal", "Cancelled", "Canceled"].map((Status) => activity("Canceled", "2026-11-05", "", { Status }))];
  assert.ok(weekActivities(rows, week).every((d) => d.activities.length === 0));
  assert.equal(validDay("2027-02-29"), false);
  assert.equal(validDay("2028-02-29"), true);
});

test("an empty week remains empty instead of displaying future activities", () => {
  const week = currentWeek(new Date("2026-12-07T12:00:00+08:00"));
  assert.ok(weekActivities([activity("Next month", "2027-01-04")], week).every((d) => d.activities.length === 0));
});
