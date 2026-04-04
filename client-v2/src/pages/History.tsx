import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Round } from "@shared/schema";
import { Trash2, ChevronRight, Trophy, Wind } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function ScoreBadge({ score, par }: { score: number | null; par: number }) {
  if (score === null) return <span className="text-muted-foreground text-sm">–</span>;
  const diff = score - par;
  const cls = diff < 0 ? "text-green-600 dark:text-green-400" : diff === 0 ? "text-foreground" : "text-orange-500";
  return <span className={`font-bold tabular-nums ${cls}`}>{score} <span className="font-normal text-xs text-muted-foreground">({diff > 0 ? "+" : ""}{diff})</span></span>;
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-muted/50 rounded-lg px-3 py-1.5">
      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

export default function History() {
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const { data: rounds = [], isLoading } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/rounds/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      setConfirmDelete(null);
      toast({ description: "Round deleted" });
    },
  });

  const pct = (made: number | null, total: number | null) => {
    if (!made || !total) return "–";
    return `${Math.round((made / total) * 100)}%`;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3 pt-16">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pt-16 pb-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-black tracking-tight">Round History</h1>
        <p className="text-sm text-muted-foreground">{rounds.length} round{rounds.length !== 1 ? "s" : ""} recorded</p>
      </div>

      {rounds.length === 0 ? (
        <div className="text-center py-16">
          <Trophy size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-muted-foreground">No rounds saved yet</p>
          <p className="text-sm text-muted-foreground mt-1">Complete a round in the tracker and tap Save to record it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map((r) => {
            const holes = JSON.parse(r.holesJson || "[]");
            const overPar = r.totalScore != null && r.totalPar != null ? r.totalScore - r.totalPar : null;
            return (
              <div key={r.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {/* Card header */}
                <a href={`#/rounds/${r.id}`} className="block p-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base leading-tight truncate">{r.course}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(r.datePlayed.replace(/-/g, '/')).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {r.teeBox} tee · HCP {r.handicap}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {r.totalScore != null ? (
                        <>
                          <div className="text-2xl font-black tabular-nums leading-none">{r.totalScore}</div>
                          <div className={`text-xs font-bold mt-0.5 ${overPar! < 0 ? "text-green-600 dark:text-green-400" : overPar === 0 ? "text-muted-foreground" : "text-orange-500"}`}>
                            {overPar! > 0 ? "+" : ""}{overPar}
                          </div>
                        </>
                      ) : <span className="text-muted-foreground text-sm">–</span>}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <StatPill label="Pts" value={r.totalPts?.toString() ?? "–"} />
                    <StatPill label="Putts" value={r.totalPutts?.toString() ?? "–"} />
                    <StatPill label="FIR" value={pct(r.fairwaysHit, r.fairwaysEligible)} />
                    <StatPill label="GIR" value={pct(r.greensHit, r.greensTotal)} />
                    <StatPill label="U&D" value={pct(r.upDownMade, r.upDownTotal)} />
                    <StatPill label="Process" value={r.processPct != null ? `${Math.round(r.processPct)}%` : "–"} />
                  </div>

                  {/* Weather */}
                  {r.weatherDesc && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Wind size={11} />
                      {r.weatherDesc} · {r.weatherTemp != null ? `${r.weatherTemp}°C` : ""} · {r.weatherWind != null ? `${r.weatherWind}mph ${r.weatherDir}` : ""}
                    </div>
                  )}
                </a>

                {/* Footer with delete */}
                <div className="border-t border-border flex">
                  <a href={`#/rounds/${r.id}`} className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    View scorecard <ChevronRight size={13} />
                  </a>
                  {confirmDelete === r.id ? (
                    <div className="border-l border-border flex items-center gap-1 px-3">
                      <button onClick={() => deleteMutation.mutate(r.id)} className="text-xs font-bold text-destructive px-1 py-1">Delete</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-muted-foreground px-1 py-1">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(r.id)}
                      className="border-l border-border px-4 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
