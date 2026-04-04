import { useQuery } from "@tanstack/react-query";
import type { Round } from "@shared/schema";
import { TrendingUp, Target, Flag, Activity } from "lucide-react";

function StatCard({ label, value, sub, color = "" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-black leading-none ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function TrendBar({ label, value, best, worst }: { label: string; value: number; best: number; worst: number }) {
  const range = worst - best || 1;
  const pct = Math.max(0, Math.min(100, ((value - best) / range) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${100 - pct}%` }} />
      </div>
    </div>
  );
}

function pct(made: number | null, total: number | null, decimals = 0) {
  if (!made || !total) return null;
  return Number(((made / total) * 100).toFixed(decimals));
}

function avg(vals: (number | null | undefined)[]) {
  const v = vals.filter(x => x != null) as number[];
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function sparklinePath(vals: number[], w: number, h: number) {
  if (vals.length < 2) return "";
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const xs = vals.map((_, i) => (i / (vals.length - 1)) * w);
  const ys = vals.map(v => h - ((v - min) / range) * (h - 4) - 2);
  return xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
}

function Sparkline({ vals, color = "var(--primary)" }: { vals: number[]; color?: string }) {
  if (vals.length < 2) return null;
  const W = 120, H = 32;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <path d={sparklinePath(vals, W, H)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sparklinePath(vals, W, H).split(" ").at(-2)} cy={sparklinePath(vals, W, H).split(" ").at(-1)} r="3" fill={color} />
    </svg>
  );
}

export default function Analytics() {
  const { data: rounds = [], isLoading } = useQuery<Round[]>({ queryKey: ["/api/rounds"] });

  if (isLoading) return (
    <div className="p-4 pt-16 space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  if (rounds.length === 0) return (
    <div className="p-4 pt-16 text-center py-20">
      <Activity size={40} className="mx-auto text-muted-foreground/40 mb-3" />
      <p className="font-semibold text-muted-foreground">No data yet</p>
      <p className="text-sm text-muted-foreground mt-1">Save some rounds to see your performance trends.</p>
    </div>
  );

  // Most recent first already from API
  const recent = rounds.slice(0, 10).reverse(); // chronological for charts

  const scores     = recent.map(r => r.totalScore).filter(Boolean) as number[];
  const pts        = recent.map(r => r.totalPts).filter(Boolean) as number[];
  const puttsArr   = recent.map(r => r.totalPutts).filter(Boolean) as number[];
  const firArr     = recent.map(r => pct(r.fairwaysHit, r.fairwaysEligible)).filter(Boolean) as number[];
  const girArr     = recent.map(r => pct(r.greensHit, r.greensTotal)).filter(Boolean) as number[];
  const procArr    = recent.map(r => r.processPct).filter(Boolean) as number[];

  const avgScore   = avg(scores);
  const avgPts     = avg(pts);
  const avgPutts   = avg(puttsArr);
  const avgFIR     = avg(firArr);
  const avgGIR     = avg(girArr);
  const avgProc    = avg(procArr);

  const bestScore  = scores.length ? Math.min(...scores) : null;
  const latestScore = scores.at(-1) ?? null;
  const trend      = scores.length >= 2 ? scores.at(-1)! - scores.at(-2)! : null;

  const lastRound  = rounds[0];

  return (
    <div className="p-4 pt-16 pb-4">
      <div className="mb-5">
        <h1 className="text-xl font-black tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Last {Math.min(rounds.length, 10)} rounds · {rounds.length} total</p>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <StatCard
          label="Avg score"
          value={avgScore != null ? avgScore.toFixed(1) : "–"}
          sub={bestScore != null ? `Best: ${bestScore}` : undefined}
          color={trend != null ? (trend < 0 ? "text-green-600 dark:text-green-400" : "text-orange-500") : ""}
        />
        <StatCard label="Avg Stableford" value={avgPts != null ? avgPts.toFixed(1) : "–"} sub="pts per round" />
        <StatCard label="Avg putts" value={avgPutts != null ? avgPutts.toFixed(1) : "–"} sub="per round" />
        <StatCard label="Process" value={avgProc != null ? `${Math.round(avgProc)}%` : "–"} sub="avg completion" />
      </div>

      {/* Score trend sparkline */}
      {scores.length >= 2 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Score trend</div>
              {trend != null && (
                <div className={`text-sm font-bold mt-0.5 ${trend < 0 ? "text-green-600 dark:text-green-400" : "text-orange-500"}`}>
                  {trend < 0 ? "▾" : "▴"} {Math.abs(trend)} vs previous
                </div>
              )}
            </div>
            <Sparkline vals={scores} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{recent.filter(r => r.totalScore).at(0)?.datePlayed?.slice(5)}</span>
            <span>{recent.filter(r => r.totalScore).at(-1)?.datePlayed?.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Fairways / Greens */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Target size={12} /> Shot quality
        </div>
        {firArr.length > 0 && <TrendBar label="Fairways hit %" value={Math.round(avgFIR!)} best={100} worst={0} />}
        {girArr.length > 0 && <TrendBar label="Greens in regulation %" value={Math.round(avgGIR!)} best={100} worst={0} />}
        {puttsArr.length > 0 && <TrendBar label="Avg putts" value={Math.round(avgPutts!)} best={24} worst={42} />}
      </div>

      {/* Round-by-round table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
        <div className="px-4 pt-3 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
          Recent rounds
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-2 text-left text-muted-foreground font-semibold">Date</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold">Score</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold">Pts</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold">Putts</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold">FIR%</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold">GIR%</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold">Proc%</th>
              </tr>
            </thead>
            <tbody>
              {rounds.slice(0, 10).map(r => {
                const diff = r.totalScore != null && r.totalPar != null ? r.totalScore - r.totalPar : null;
                return (
                  <tr key={r.id} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 px-2 text-left font-medium">{r.datePlayed.slice(5).replace("-", "/")}</td>
                    <td className={`py-1.5 px-2 font-bold ${diff != null ? diff < 0 ? "text-green-600 dark:text-green-400" : diff > 0 ? "text-orange-500" : "" : ""}`}>
                      {r.totalScore ?? "–"}
                    </td>
                    <td className="py-1.5 px-2">{r.totalPts ?? "–"}</td>
                    <td className="py-1.5 px-2">{r.totalPutts ?? "–"}</td>
                    <td className="py-1.5 px-2">{pct(r.fairwaysHit, r.fairwaysEligible) ?? "–"}{pct(r.fairwaysHit, r.fairwaysEligible) != null ? "%" : ""}</td>
                    <td className="py-1.5 px-2">{pct(r.greensHit, r.greensTotal) ?? "–"}{pct(r.greensHit, r.greensTotal) != null ? "%" : ""}</td>
                    <td className="py-1.5 px-2">{r.processPct != null ? `${Math.round(r.processPct)}%` : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
