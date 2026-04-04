import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import type { Round } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";

function scoreCls(score: number | null, par: number) {
  if (score === null) return "";
  const d = score - par;
  return d < 0 ? "text-green-600 dark:text-green-400 font-bold" : d > 0 ? "text-orange-500 font-bold" : "";
}

function allocateShots(strokeIndexes: number[], handicap: number) {
  const h = Math.max(0, Math.round(handicap));
  const base = Math.floor(h / 18), rem = h % 18;
  return strokeIndexes.map(si => base + (si <= rem ? 1 : 0));
}

function stablefordPts(score: number | null, par: number, shots: number) {
  if (score === null) return null;
  const diff = (score - shots) - par;
  if (diff <= -3) return 5;
  if (diff === -2) return 4;
  if (diff === -1) return 3;
  if (diff === 0) return 2;
  if (diff === 1) return 1;
  return 0;
}

export default function RoundDetail() {
  const params = useParams<{ id: string }>();
  const [, nav] = useLocation();

  const { data: round, isLoading } = useQuery<Round>({
    queryKey: ["/api/rounds", params.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/rounds/${params.id}`);
      return res.json();
    },
    enabled: !!params.id,
  });

  if (isLoading) return <div className="p-4 pt-16"><div className="h-64 bg-muted rounded-xl animate-pulse" /></div>;
  if (!round) return <div className="p-4 pt-16 text-muted-foreground">Round not found.</div>;

  const holes: any[] = JSON.parse(round.holesJson || "[]");
  const shots = allocateShots(holes.map(h => h.strokeIndex), round.handicap);
  const totalYds = holes.reduce((a, h) => a + (h.yards || 0), 0);
  const totalPar = holes.reduce((a, h) => a + h.par, 0);
  const totalScore = holes.filter(h => h.score != null).reduce((a, h) => a + h.score, 0);
  const totalPts  = holes.reduce((a, h, i) => a + (stablefordPts(h.score, h.par, shots[i]) ?? 0), 0);
  const totalPutts = holes.reduce((a, h) => a + (h.putts ?? 0), 0);
  const anyScore = holes.some(h => h.score != null);

  return (
    <div className="p-4 pt-14 pb-4">
      <button onClick={() => nav("/")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
        <ArrowLeft size={15} /> Back
      </button>

      <h1 className="text-lg font-black leading-tight mb-0.5">{round.course}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {round.datePlayed?.replace(/-/g, '/') ? new Date(round.datePlayed.replace(/-/g, '/')).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" }) : round.datePlayed} · {round.teeBox} tee · HCP {round.handicap}
      </p>

      {round.notes && <p className="text-sm text-muted-foreground italic mb-4">"{round.notes}"</p>}

      <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-1 text-left text-muted-foreground font-semibold">H</th>
                <th className="py-2 px-1 text-muted-foreground font-semibold">Yds</th>
                <th className="py-2 px-1 text-muted-foreground font-semibold">Par</th>
                <th className="py-2 px-1 text-muted-foreground font-semibold">SI</th>
                <th className="py-2 px-1 text-muted-foreground font-semibold">Shots</th>
                <th className="py-2 px-1 text-muted-foreground font-semibold">Score</th>
                <th className="py-2 px-1 text-muted-foreground font-semibold">Net</th>
                <th className="py-2 px-1 text-muted-foreground font-semibold">Pts</th>
                <th className="py-2 px-1 text-muted-foreground font-semibold">Putts</th>
                <th className="py-2 px-1 text-muted-foreground font-semibold">FIR</th>
                <th className="py-2 px-1 text-muted-foreground font-semibold">GIR</th>
              </tr>
            </thead>
            <tbody>
              {holes.map((h: any, i: number) => {
                const sh = shots[i];
                const pts = stablefordPts(h.score, h.par, sh);
                const net = h.score != null ? h.score - sh : null;
                return (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 px-1 font-bold text-left">{h.hole}</td>
                    <td className="py-1.5 px-1 text-muted-foreground">{h.yards || "–"}</td>
                    <td className="py-1.5 px-1">{h.par}</td>
                    <td className="py-1.5 px-1 text-muted-foreground">{h.strokeIndex}</td>
                    <td className="py-1.5 px-1">{sh || "–"}</td>
                    <td className={`py-1.5 px-1 ${scoreCls(h.score, h.par)}`}>{h.score ?? "–"}</td>
                    <td className="py-1.5 px-1">{net ?? "–"}</td>
                    <td className="py-1.5 px-1 font-semibold">{pts ?? "–"}</td>
                    <td className="py-1.5 px-1">{h.putts ?? "–"}</td>
                    <td className="py-1.5 px-1">
                      {h.fairway === "hit" ? "✓" : h.fairway === "left" ? "L" : h.fairway === "right" ? "R" : "–"}
                    </td>
                    <td className="py-1.5 px-1">
                      {h.gir === true ? "✓" : h.gir === false ? "✗" : "–"}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-border font-bold">
                <td className="py-2 px-1 text-left">Total</td>
                <td className="py-2 px-1 text-muted-foreground">{totalYds}</td>
                <td className="py-2 px-1">{totalPar}</td>
                <td colSpan={2} />
                <td className="py-2 px-1">{anyScore ? totalScore : "–"}</td>
                <td />
                <td className="py-2 px-1">{anyScore ? totalPts : "–"}</td>
                <td className="py-2 px-1">{totalPutts || "–"}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
