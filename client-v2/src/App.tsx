import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Insights from "./pages/Insights";
import RoundDetail from "./pages/RoundDetail";
import NotFound from "./pages/not-found";
import { BarChart2, List, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

function Topbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="max-w-lg mx-auto flex items-center gap-2.5 px-4 h-14">
        <a href="https://www.perplexity.ai/computer/a/golf-tracker-929lhutFT_y9w5kWumkaAQ" target="_top" className="text-primary flex-shrink-0" title="Back to Golf Tracker">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="10" r="7" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M9.5 8.5a1 1 0 0 1 1.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M12.5 8.5a1 1 0 0 1 1.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M11 11a1 1 0 0 1 1.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M4 20c3-3 6-4 8-4s5 1 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
          </svg>
        </a>
        <span className="font-black text-base tracking-tight">Golf Performance</span>
      </div>
    </header>
  );
}

function BottomNav() {
  const [loc] = useLocation();
  const active = "text-primary";
  const inactive = "text-muted-foreground";
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/92 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-lg mx-auto flex">
        <a href="https://www.perplexity.ai/computer/a/golf-tracker-929lhutFT_y9w5kWumkaAQ" target="_top"
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] font-bold transition-colors ${inactive}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="10" r="7" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M9.5 8.5a1 1 0 0 1 1.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M12.5 8.5a1 1 0 0 1 1.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M11 11a1 1 0 0 1 1.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M4 20c3-3 6-4 8-4s5 1 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
          </svg>
          Tracker
        </a>
        <a href="#/" className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] font-bold transition-colors ${loc === "/" ? active : inactive}`}>
          <List size={20} />History
        </a>
        <a href="#/analytics" className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] font-bold transition-colors ${loc.startsWith("/analytics") ? active : inactive}`}>
          <BarChart2 size={20} />Analytics
        </a>
        <a href="#/insights" className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] font-bold transition-colors ${loc.startsWith("/insights") ? active : inactive}`}>
          <Sparkles size={20} />Coaching
        </a>
      </div>
    </nav>
  );
}

function Layout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Topbar />
      <div className="max-w-lg mx-auto pt-14 pb-20">
        <Switch>
          <Route path="/" component={History} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/insights" component={Insights} />
          <Route path="/rounds/:id" component={RoundDetail} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Layout />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
