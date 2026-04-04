import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Round } from "@shared/schema";
import { Sparkles, TrendingUp, TrendingDown, Minus, Target, Flag, Activity, Brain, Calendar } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────
function avg(arr: (number | null | undefined)[]) {
  const v = arr.filter(x => x != null) as number[];
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function pctNum(made: number | null, total: number | null) {
  if (made == null || !total) return null;
  return Math.round((made / total) * 100);
}
function fmt(n: number | null, decimals = 1) {
  return n != null ? n.toFixed(decimals) : "N/A";
}
function trend(vals: number[]): "up" | "down" | "flat" {
  if (vals.length < 2) return "flat";
  const first = vals.slice(0, Math.ceil(vals.length / 2));
  const last  = vals.slice(Math.floor(vals.length / 2));
  const avgF  = first.reduce((a,b) => a+b,0)/first.length;
  const avgL  = last.reduce((a,b) => a+b,0)/last.length;
  const diff  = avgL - avgF;
  if (Math.abs(diff) < 1) return "flat";
  return diff < 0 ? "up" : "down"; // lower score = better
}

// ── Coaching insight generator ────────────────────────────────────────────────
function generateInsights(rounds: Round[]) {
  const r = rounds.slice(0, 10);
  if (!r.length) return null;

  const scores    = r.map(x => x.totalScore).filter(Boolean) as number[];
  const putts     = r.map(x => x.totalPutts).filter(Boolean) as number[];
  const firPcts   = r.map(x => pctNum(x.fairwaysHit, x.fairwaysEligible)).filter(Boolean) as number[];
  const girPcts   = r.map(x => pctNum(x.greensHit, x.greensTotal)).filter(Boolean) as number[];
  const udPcts    = r.map(x => pctNum(x.upDownMade, x.upDownTotal)).filter(Boolean) as number[];
  const procPcts  = r.map(x => x.processPct).filter(Boolean) as number[];
  const pts       = r.map(x => x.totalPts).filter(Boolean) as number[];

  const avgScore   = avg(scores);
  const avgPutts   = avg(putts);
  const avgFIR     = avg(firPcts);
  const avgGIR     = avg(girPcts);
  const avgUD      = avg(udPcts);
  const avgProc    = avg(procPcts);
  const avgPts     = avg(pts);
  const scoreTrend = trend(scores);
  const bestScore  = scores.length ? Math.min(...scores) : null;

  const sections: { icon: any; title: string; color: string; content: string }[] = [];

  // ── Score overview ────────────────────────────────────────────────────────
  const par = r[0]?.totalPar ?? 71;
  const overUnder = avgScore != null ? (avgScore - par).toFixed(1) : null;
  const trendLabel = scoreTrend === "up" ? "improving" : scoreTrend === "down" ? "trending the wrong way" : "consistent";
  sections.push({
    icon: scoreTrend === "up" ? TrendingUp : scoreTrend === "down" ? TrendingDown : Minus,
    title: "Score overview",
    color: scoreTrend === "up" ? "text-green-600 dark:text-green-400" : scoreTrend === "down" ? "text-orange-500" : "text-muted-foreground",
    content: `Your average score over the last ${r.length} rounds is ${fmt(avgScore, 1)} — ${overUnder != null ? (parseFloat(overUnder) > 0 ? `+${overUnder}` : overUnder) : "N/A"} to par. Your scoring is ${trendLabel}${bestScore ? `, with a best round of ${bestScore}` : ""}. Average Stableford: ${fmt(avgPts, 1)} points.`
  });

  // ── Tee shot ──────────────────────────────────────────────────────────────
  const firStatus = avgFIR != null
    ? avgFIR >= 50 ? "solid" : avgFIR >= 30 ? "room to improve" : "a clear area to work on"
    : null;
  if (firStatus) {
    sections.push({
      icon: Flag,
      title: "Tee shots",
      color: avgFIR! >= 50 ? "text-green-600 dark:text-green-400" : avgFIR! >= 30 ? "text-yellow-600" : "text-orange-500",
      content: `You're finding ${fmt(avgFIR, 0)}% of fairways — ${firStatus}. ${
        avgFIR! < 50
          ? "A consistent pre-shot routine and picking a specific target on the fairway (not just 'out there') will help. Consider playing to a wider part of the fairway rather than the tightest line."
          : "Your tee shot accuracy gives you good angles into greens. Keep it going."
      }`
    });
  }

  // ── Approach play ─────────────────────────────────────────────────────────
  const girStatus = avgGIR != null
    ? avgGIR >= 50 ? "strong" : avgGIR >= 30 ? "developing" : "the main scoring opportunity"
    : null;
  if (girStatus) {
    sections.push({
      icon: Target,
      title: "Approach play & greens",
      color: avgGIR! >= 50 ? "text-green-600 dark:text-green-400" : avgGIR! >= 30 ? "text-yellow-600" : "text-orange-500",
      content: `GIR at ${fmt(avgGIR, 0)}% — ${girStatus}. ${
        avgGIR! < 40
          ? `With ${fmt(avgUD, 0)}% up-and-down conversion, improving your approach accuracy will compound directly into lower scores. Focus on leaving the ball below the hole for easier putts.`
          : `Good green-finding rate. Your up-and-down rate of ${fmt(avgUD, 0)}% shows your short game when you do miss.`
      }`
    });
  }

  // ── Putting ───────────────────────────────────────────────────────────────
  const puttStatus = avgPutts != null
    ? avgPutts <= 30 ? "excellent" : avgPutts <= 33 ? "solid" : "an area to prioritise"
    : null;
  if (puttStatus && avgPutts != null) {
    sections.push({
      icon: Activity,
      title: "Putting",
      color: avgPutts <= 30 ? "text-green-600 dark:text-green-400" : avgPutts <= 33 ? "text-yellow-600" : "text-orange-500",
      content: `Averaging ${fmt(avgPutts, 1)} putts per round — ${puttStatus}. ${
        avgPutts > 33
          ? "Every putt saved is a shot saved. Work on lag putting from distance to reduce three-putts, and build a consistent short putt routine."
          : avgPutts > 30
          ? "You're keeping the ball rolling nicely. Dropping under 30 putts regularly would push your scores down significantly."
          : "Sub-30 putts is excellent — your short game is a genuine strength."
      }`
    });
  }

  // ── Process ───────────────────────────────────────────────────────────────
  if (avgProc != null) {
    sections.push({
      icon: Brain,
      title: "Mental game & process",
      color: avgProc >= 80 ? "text-green-600 dark:text-green-400" : avgProc >= 50 ? "text-yellow-600" : "text-orange-500",
      content: `Process completion at ${fmt(avgProc, 0)}%. ${
        avgProc < 50
          ? "The SEE IT · FEEL IT · TRUST IT routine is your most underused tool. Research consistently shows that players who commit to a pre-shot process make better decisions and hit more solid shots under pressure. Try to use it on every shot for one full round."
          : avgProc < 80
          ? "You're using the process on most shots — the rounds where you push this above 80% will be your best ones. There's a direct correlation between process completion and score."
          : "Outstanding process discipline. This is what separates consistent players from streaky ones."
      }`
    });
  }

  // ── Practice schedule ──────────────────────────────────────────────────────
  // Priority-rank the weak areas and build a 3-session week around them
  type Session = { day: string; focus: string; drills: string[] };
  const sessions: Session[] = [];

  // Score each area: lower = needs more work
  const priorities: { area: string; score: number }[] = [];
  if (avgFIR != null)   priorities.push({ area: 'driving',  score: avgFIR });
  if (avgGIR != null)   priorities.push({ area: 'approach', score: avgGIR });
  if (avgPutts != null) priorities.push({ area: 'putting',  score: avgPutts <= 30 ? 100 : avgPutts <= 33 ? 60 : 20 });
  if (avgUD != null)    priorities.push({ area: 'short',    score: avgUD });
  if (avgProc != null)  priorities.push({ area: 'process',  score: avgProc });

  // Sort weakest first
  priorities.sort((a, b) => a.score - b.score);
  const top3 = priorities.slice(0, 3).map(p => p.area);

  const drillMap: Record<string, { focus: string; drills: string[] }> = {
    driving: {
      focus: 'Tee shot accuracy',
      drills: [
        'Hit 20 drives to a specific target zone — not just "down the middle"',
        '3-ball drill: hit consecutive shots to the same fairway zone, reset between each',
        'Tempo work: half-speed swings focusing on staying behind the ball through impact',
      ]
    },
    approach: {
      focus: 'Approach & iron play',
      drills: [
        '50-yard distance control: land 10 balls within a 10-foot circle',
        'Yardage gapping session: hit 5 balls with each iron to confirm your actual distances',
        'Target practice from 100, 130, 150 yds — focus on starting line, not just distance',
      ]
    },
    putting: {
      focus: 'Putting — lag & short',
      drills: [
        'Lag putting: 5 balls from 30+ feet, goal is to leave every putt within 18 inches',
        'Gate drill: place two tees just wider than the putter head, make 50 putts from 4 feet without hitting either',
        '3-6-9 drill: make 3 from 3 feet, then 6 feet, then 9 feet — start again if you miss',
      ]
    },
    short: {
      focus: 'Short game — chipping & pitching',
      drills: [
        'Up-and-down challenge: chip from 5 locations around the green, score yourself on getting up and down',
        'Landing spot drill: pick a specific spot to land the ball, not the hole — control trajectory',
        'Bump-and-run vs lob: hit each shot 2 ways to learn which works better in each situation',
      ]
    },
    process: {
      focus: 'Pre-shot routine & mental game',
      drills: [
        'Routine reps: hit 30 range balls using your full SEE IT · FEEL IT · TRUST IT routine on every shot',
        'Pressure putting: set a 6-putt target from 4 feet — restart if you miss — builds commitment under pressure',
        'On-course simulation: play 9 holes with one ball, treating every shot as if it matters',
      ]
    },
  };

  const days = ['Session 1', 'Session 2', 'Session 3'];
  top3.forEach((area, i) => {
    const d = drillMap[area];
    if (d) sessions.push({ day: days[i], focus: d.focus, drills: d.drills });
  });

  // Add a maintenance note for the strongest area
  const strongest = [...priorities].sort((a,b) => b.score - a.score)[0];
  const maintainMap: Record<string, string> = {
    driving:  'Your driving is a strength — 10 minutes of tempo work to maintain it is enough.',
    approach: 'Your iron play is solid — keep it sharp with yardage confirmation once a month.',
    putting:  'Your putting is a genuine weapon — protect it with a weekly gate drill session.',
    short:    'Your short game is reliable — maintain with a quick chip-and-putt session monthly.',
    process:  'Your mental routine is strong — keep logging process in the tracker to stay accountable.',
  };
  const maintainNote = strongest ? maintainMap[strongest.area] : null;

  sections.push({
    icon: Calendar,
    title: 'Practice schedule',
    color: 'text-primary',
    content: JSON.stringify({ sessions, maintainNote }), // special marker — rendered differently
  });

  return { sections, avgScore, avgPts, avgFIR, avgGIR, avgPutts, avgProc, scoreTrend, bestScore, roundCount: r.length };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Insights() {
  const { data: rounds = [], isLoading } = useQuery<Round[]>({ queryKey: ["/api/rounds"] });
  const analysis = useMemo(() => generateInsights(rounds), [rounds]);

  if (isLoading) return (
    <div className="p-4 pt-16 space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  if (!rounds.length || !analysis) return (
    <div className="p-4 pt-16 text-center py-20">
      <Sparkles size={36} className="mx-auto text-muted-foreground/40 mb-3" />
      <p className="font-semibold text-muted-foreground">No rounds saved yet</p>
      <p className="text-sm text-muted-foreground mt-1">Save some rounds from the tracker to get your coaching report.</p>
    </div>
  );

  return (
    <div className="p-4 pt-16 pb-4">
      <div className="mb-5">
        <h1 className="text-xl font-black tracking-tight">AI Coaching</h1>
        <p className="text-sm text-muted-foreground">Based on your last {analysis.roundCount} rounds</p>
      </div>

      {/* Snapshot row */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: "Avg score", value: analysis.avgScore != null ? analysis.avgScore.toFixed(1) : "–" },
          { label: "Stableford", value: analysis.avgPts != null ? analysis.avgPts.toFixed(1) : "–" },
          { label: "GIR %", value: analysis.avgGIR != null ? `${Math.round(analysis.avgGIR)}%` : "–" },
          { label: "Putts", value: analysis.avgPutts != null ? analysis.avgPutts.toFixed(1) : "–" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-2.5 text-center">
            <div className="font-black text-base leading-none">{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Coaching sections */}
      <div className="space-y-3">
        {analysis.sections.map((s, i) => {
          const Icon = s.icon;

          // Practice schedule — structured layout
          if (s.title === 'Practice schedule') {
            const { sessions, maintainNote } = JSON.parse(s.content);
            return (
              <div key={i} className="bg-card border border-border rounded-2xl p-4">
                <div className={`flex items-center gap-2 mb-3 ${s.color}`}>
                  <Icon size={16} />
                  <span className="font-bold text-sm">Practice schedule — this week</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Based on your weakest areas. 3 focused sessions beats 5 aimless ones.</p>
                <div className="space-y-3">
                  {sessions.map((session: any, j: number) => (
                    <div key={j} className="bg-muted/40 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">{session.day}</span>
                        <span className="font-bold text-sm">{session.focus}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {session.drills.map((drill: string, k: number) => (
                          <li key={k} className="text-xs text-foreground/75 flex gap-2">
                            <span className="text-primary font-bold flex-shrink-0">{k + 1}.</span>
                            <span>{drill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {maintainNote && (
                  <p className="text-xs text-muted-foreground mt-3 italic border-t border-border pt-3">{maintainNote}</p>
                )}
              </div>
            );
          }

          // Regular coaching section
          return (
            <div key={i} className="bg-card border border-border rounded-2xl p-4">
              <div className={`flex items-center gap-2 mb-2 ${s.color}`}>
                <Icon size={16} />
                <span className="font-bold text-sm">{s.title}</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">{s.content}</p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-4">Updates automatically as you save more rounds</p>
    </div>
  );
}
