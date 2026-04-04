import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRoundSchema } from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Save a round
  app.post("/api/rounds", (req, res) => {
    try {
      const data = insertRoundSchema.parse(req.body);
      const round = storage.saveRound(data);
      res.json(round);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  // List all rounds
  app.get("/api/rounds", (_req, res) => {
    res.json(storage.listRounds());
  });

  // Get single round detail
  app.get("/api/rounds/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const round = storage.getRound(id);
    if (!round) return res.status(404).json({ error: "Not found" });
    res.json(round);
  });

  // Delete a round
  app.delete("/api/rounds/:id", (req, res) => {
    const id = parseInt(req.params.id);
    storage.deleteRound(id);
    res.json({ ok: true });
  });

  return httpServer;
}
