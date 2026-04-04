import { db } from "./db";
import { rounds, type InsertRound, type Round } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  saveRound(round: InsertRound): Round;
  getRound(id: number): Round | undefined;
  listRounds(): Round[];
  deleteRound(id: number): void;
}

export class DatabaseStorage implements IStorage {
  saveRound(round: InsertRound): Round {
    return db.insert(rounds).values(round).returning().get();
  }

  getRound(id: number): Round | undefined {
    return db.select().from(rounds).where(eq(rounds.id, id)).get();
  }

  listRounds(): Round[] {
    return db.select().from(rounds).orderBy(desc(rounds.datePlayed)).all();
  }

  deleteRound(id: number): void {
    db.delete(rounds).where(eq(rounds.id, id)).run();
  }
}

export const storage = new DatabaseStorage();
