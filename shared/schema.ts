import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Rounds ──────────────────────────────────────────────────────────────────
export const rounds = sqliteTable("rounds", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  course:      text("course").notNull(),
  teeBox:      text("tee_box").notNull(),
  handicap:    real("handicap").notNull(),
  datePlayed:  text("date_played").notNull(), // ISO date string YYYY-MM-DD
  notes:       text("notes").default(""),
  // Weather snapshot
  weatherDesc: text("weather_desc").default(""),
  weatherTemp: real("weather_temp"),
  weatherWind: real("weather_wind"),
  weatherDir:  text("weather_dir").default(""),
  weatherRain: real("weather_rain"),
  weatherPressure: real("weather_pressure"),
  // Aggregate stats (computed on save for fast querying)
  totalScore:  integer("total_score"),
  totalPar:    integer("total_par"),
  totalPts:    integer("total_pts"),     // Stableford
  totalPutts:  integer("total_putts"),
  fairwaysHit: integer("fairways_hit"),
  fairwaysEligible: integer("fairways_eligible"),
  greensHit:   integer("greens_hit"),
  greensTotal: integer("greens_total"),
  upDownMade:  integer("up_down_made"),
  upDownTotal: integer("up_down_total"),
  sandMade:    integer("sand_made"),
  sandTotal:   integer("sand_total"),
  processPct:  real("process_pct"),       // 0-100
  // Full hole-by-hole JSON for detail view
  holesJson:   text("holes_json").notNull(), // JSON array
});

export const insertRoundSchema = createInsertSchema(rounds).omit({ id: true });
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof rounds.$inferSelect;
