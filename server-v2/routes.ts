import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRoundSchema } from "@shared/schema";
import OpenAI from "openai";

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

  // AI Insights — POST /api/insights
  app.post("/api/insights", async (req, res) => {
    try {
      const rounds = storage.listRounds();
      if (rounds.length === 0) {
        return res.json({ insight: "Save some rounds first and I'll analyse your game." });
      }
      const last10 = rounds.slice(0, 10);
      const avg = (arr: (number | null | undefined)[]) => {
        const v = arr.filter(x => x != null) as number[];
        return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : 'N/A';
      };
      const pct = (made: number | null, total: number | null) =>
        made != null && total ? Math.round((made / total) * 100) + '%' : 'N/A';

      const statsSummary = last10.map((r, i) => {
        const diff = r.totalScore != null && r.totalPar != null ? r.totalScore - r.totalPar : null;
        return `Round ${i + 1} (${r.datePlayed}, ${r.course}, HCP ${r.handicap}): ` +
          `Score ${r.totalScore ?? 'N/A'} (${ diff != null ? (diff > 0 ? '+' : '') + diff : 'N/A'} vs par), ` +
          `Stableford ${r.totalPts ?? 'N/A'}, Putts ${r.totalPutts ?? 'N/A'}, ` +
          `FIR ${pct(r.fairwaysHit, r.fairwaysEligible)}, GIR ${pct(r.greensHit, r.greensTotal)}, ` +
          `U&D ${pct(r.upDownMade, r.upDownTotal)}, Process ${r.processPct != null ? Math.round(r.processPct) + '%' : 'N/A'}`;
      }).join('\n');

      const avgScore = avg(last10.map(r => r.totalScore));
      const avgPutts = avg(last10.map(r => r.totalPutts));
      const avgFIR   = avg(last10.filter(r => r.fairwaysEligible).map(r =>
        r.fairwaysHit != null && r.fairwaysEligible ? Math.round((r.fairwaysHit / r.fairwaysEligible) * 100) : null));
      const avgGIR   = avg(last10.filter(r => r.greensTotal).map(r =>
        r.greensHit != null && r.greensTotal ? Math.round((r.greensHit / r.greensTotal) * 100) : null));
      const avgProc  = avg(last10.map(r => r.processPct));

      const prompt = `You are a golf performance coach analysing a player's stats. Be concise, warm, and specific. Write 3-4 short paragraphs. No bullet points — write naturally like a coach talking to their player.

Last ${last10.length} rounds:
${statsSummary}

Averages: Score ${avgScore}, Putts ${avgPutts}, FIR ${avgFIR}%, GIR ${avgGIR}%, Process ${avgProc}%

Highlight 2-3 specific strengths, identify 1-2 biggest areas for improvement with actionable advice, and end with a short motivational thought.`;

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const chat = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });
      res.json({ insight: chat.choices[0].message.content });
    } catch (e: any) {
      console.error('Insights error:', e);
      // If no API key, return a demo message
      if (e.message?.includes('API key')) {
        res.json({ insight: 'AI insights require an OpenAI API key. Set OPENAI_API_KEY in the server environment to enable this feature.' });
      } else {
        res.status(500).json({ error: 'Could not generate insights' });
      }
    }
  });

  return httpServer;
}
