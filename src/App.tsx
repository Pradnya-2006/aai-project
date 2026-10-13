import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { Drawer } from "./components/feedback/Drawer";
import { ErrorState } from "./components/feedback/ErrorState";
import { LoadingSkeleton } from "./components/feedback/LoadingSkeleton";
import { Modal } from "./components/feedback/Modal";
import { FilterBar } from "./components/ui/FilterBar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNotifications } from "./hooks/useNotifications";
import { useSimulator } from "./hooks/useSimulator";
import { useTheme } from "./hooks/useTheme";
import { useWorkspaceData } from "./hooks/useWorkspaceData";
import type {
  DrawerKind,
  Mention,
  OrchestratorRun,
  SimulatorState,
  Tone,
} from "./models/types";
import { intelligenceService } from "./services/intelligenceService";
import { computeActivityChart } from "./utils/chartUtils";

// Lazy-loaded page components for route code splitting
const CommandCenterPage = lazy(() => import("./pages/CommandCenterPage"));
const LiveMentionsPage = lazy(() => import("./pages/LiveMentionsPage"));
const TopicsTrendsPage = lazy(() => import("./pages/TopicsTrendsPage"));
const RiskCenterPage = lazy(() => import("./pages/RiskCenterPage"));
const CompetitorsPage = lazy(() => import("./pages/CompetitorsPage"));
const InfluencersPage = lazy(() => import("./pages/InfluencersPage"));
const CampaignsPage = lazy(() => import("./pages/CampaignsPage"));
const ResponseStudioPage = lazy(() => import("./pages/ResponseStudioPage"));
const CrisisOpsPage = lazy(() => import("./pages/CrisisOpsPage"));
const ExecutiveIntelligencePage = lazy(
  () => import("./pages/ExecutiveIntelligencePage"),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0,
    },
  },
});

export function AppContent() {
  const [active, setActive] = useState("Command Center");
  const [selectedMention, setSelectedMention] = useState<Mention | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [demo, setDemo] = useState(
    () => localStorage.getItem("demo-mode") === "true",
  );
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [tone, setTone] = useState<Tone | "all">("all");
  const [timeRange, setTimeRange] = useState("24H");
  const [palette, setPalette] = useState(false);
  const [analysis, setAnalysis] = useState<OrchestratorRun | null>(null);

  const { dark, toggleTheme } = useTheme();

  const {
    mentions,
    summary,
    topics,
    risk,
    influencers,
    campaigns,
    executive,
    competitors,
    agents,
    isLoading,
    error,
    refetch,
    handleRefresh,
    handleRetry,
  } = useWorkspaceData();

  const { simulator, setSimulator } = useSimulator(refetch);

  useKeyboardShortcuts({
    onOpenPalette: () => setPalette(true),
    onToggleTheme: () => toggleTheme(true),
  });

  useEffect(() => {
    if (!summary) return;
    const params = new URLSearchParams({
      range: timeRange,
      platform,
      sentiment: tone,
      risk: risk?.severity ?? "all",
    });
    history.replaceState(null, "", `?${params.toString()}`);
  }, [timeRange, platform, tone, risk?.severity, summary]);

  const filtered = useMemo(
    () =>
      mentions.filter(
        (m) =>
          (platform === "all" || m.platform === platform) &&
          (tone === "all" || m.tone === tone) &&
          (!query ||
            `${m.author} ${m.text} ${m.topic}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [mentions, platform, tone, query],
  );

  const chart = useMemo(
    () => computeActivityChart(summary, mentions),
    [summary, mentions],
  );

  const platforms = useMemo(
    () => Array.from(new Set(mentions.map((m) => m.platform))),
    [mentions],
  );

  const navigate = (page: string) => {
    setActive(page);
    setPalette(false);
    setDrawer(null);
  };

  const {
    notifications,
    unreadCount,
    markAllRead,
    handleNotificationClick,
  } = useNotifications(navigate);

  const openMention = (m: Mention) => {
    setSelectedMention(m);
    setDrawer("mention");
  };

  const openAgent = (name: string) => {
    setSelectedAgent(name);
    setDrawer("agent");
  };

  const handleToggleDemo = () => {
    const next = !demo;
    setDemo(next);
    localStorage.setItem("demo-mode", String(next));
    toast.info(`Switched to ${next ? "Demo" : "Live"} data mode`);
  };

  const handleRunAnalysis = () => {
    toast.info("Running AI orchestrator pipeline...");
    intelligenceService
      .runAnalysis()
      .then((res) => {
        setAnalysis(res);
        toast.success(`Analysis complete: Alert level ${res.alert_level}`);
      })
      .catch(() => {
        toast.error("AI analysis failed. Retry when API is available.");
      });
  };

  return (
    <div
      className={`app ${dark ? "theme-dark" : "theme-light"} ${
        presentation ? "presentation" : ""
      }`}
    >
      <Sidebar
        active={active}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        dark={dark}
        onToggleTheme={() => toggleTheme(true)}
        demo={demo}
        onToggleDemo={handleToggleDemo}
        onNavigate={navigate}
      />

      <main className="main">
        <Topbar
          active={active}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          platform={platform}
          onPlatformChange={setPlatform}
          platforms={platforms}
          query={query}
          onQueryChange={setQuery}
          presentation={presentation}
          onTogglePresentation={() => setPresentation((v) => !v)}
          demo={demo}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllNotificationsRead={markAllRead}
          onNotificationClick={handleNotificationClick}
        />

        <FilterBar
          tone={tone}
          onToneChange={setTone}
          visibleCount={filtered.length}
          onRefresh={handleRefresh}
        />

        {error && <ErrorState error={error} onRetry={handleRetry} />}

        {isLoading && <LoadingSkeleton />}

        <Suspense fallback={<LoadingSkeleton />}>
          {active === "Command Center" && (
            <CommandCenterPage
              summary={summary}
              risk={risk}
              topics={topics}
              mentions={filtered}
              chart={chart}
              analysis={analysis}
              onAnalysis={handleRunAnalysis}
              onMention={openMention}
              onAgent={openAgent}
              agents={agents}
              onNavigate={navigate}
            />
          )}

          {active === "Live Mentions" && (
            <LiveMentionsPage mentions={filtered} onMention={openMention} />
          )}
          {active === "Topics & Trends" && <TopicsTrendsPage topics={topics} />}
          {active === "Risk Center" && <RiskCenterPage risk={risk} chart={chart} />}
          {active === "Competitors" && <CompetitorsPage competitors={competitors} />}
          {active === "Influencers" && <InfluencersPage influencers={influencers} />}
          {active === "Campaigns" && <CampaignsPage campaigns={campaigns} />}
          {active === "Response Studio" && (
            <ResponseStudioPage onNavigate={navigate} />
          )}
          {active === "Crisis Ops" && (
            <CrisisOpsPage
              state={simulator}
              onState={(s: SimulatorState) => setSimulator(s)}
            />
          )}
          {active === "Executive Intelligence" && (
            <ExecutiveIntelligencePage
              summary={summary}
              risk={risk}
              executive={executive}
            />
          )}
        </Suspense>
      </main>

      <AnimatePresence>
        {drawer && (
          <Drawer
            kind={drawer}
            mention={selectedMention}
            agent={selectedAgent}
            topic={topics[0]}
            influencer={influencers[0]}
            onClose={() => setDrawer(null)}
          />
        )}
      </AnimatePresence>

      {palette && (
        <Modal
          isOpen
          onClose={() => setPalette(false)}
          onNavigate={navigate}
        />
      )}

      <Toaster position="bottom-right" theme={dark ? "dark" : "light"} />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
