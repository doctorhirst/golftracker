import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

const sqlite = new Database(path.join(process.cwd(), "golf.db"));
// Enable WAL mode for better concurrent performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Auto-create tables on startup
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course TEXT NOT NULL,
    tee_box TEXT NOT NULL,
    handicap REAL NOT NULL,
    date_played TEXT NOT NULL,
    notes TEXT DEFAULT '',
    weather_desc TEXT DEFAULT '',
    weather_temp REAL,
    weather_wind REAL,
    weather_dir TEXT DEFAULT '',
    weather_rain REAL,
    weather_pressure REAL,
    total_score INTEGER,
    total_par INTEGER,
    total_pts INTEGER,
    total_putts INTEGER,
    fairways_hit INTEGER,
    fairways_eligible INTEGER,
    greens_hit INTEGER,
    greens_total INTEGER,
    up_down_made INTEGER,
    up_down_total INTEGER,
    sand_made INTEGER,
    sand_total INTEGER,
    process_pct REAL,
    holes_json TEXT NOT NULL DEFAULT '[]'
  );
`);
