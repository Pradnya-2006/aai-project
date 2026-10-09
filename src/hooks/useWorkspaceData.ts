import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { intelligenceService } from "../services/intelligenceService";
import { fallbackMentions } from "../utils/fallbackData";

export function useWorkspaceData() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["workspace-data"],
    queryFn: () => intelligenceService.fetchWorkspaceData(15000),
    retry: 0,
    staleTime: 1000 * 60,
  });

  const errorMessage = isError
    ? "Offline demo mode: unable to load the intelligence workspace."
    : "";

  const handleRefresh = async () => {
    toast.info("Refreshing workspace signals...");
    const res = await refetch();
    if (res.isSuccess) {
      toast.success("Workspace signals refreshed");
    } else {
      toast.error("Failed to refresh signals - running offline");
    }
  };

  const handleRetry = async () => {
    toast.info("Retrying connection to backend...");
    const res = await refetch();
    if (res.isSuccess) {
      toast.success("Connection re-established");
    } else {
      toast.error("Connection retry failed");
    }
  };

  const mentions = useMemo(() => data?.mentions ?? fallbackMentions, [data?.mentions]);
  const summary = useMemo(() => data?.summary ?? null, [data?.summary]);
  const topics = useMemo(() => data?.topics ?? [], [data?.topics]);
  const risk = useMemo(() => data?.risk ?? null, [data?.risk]);
  const influencers = useMemo(() => data?.influencers ?? [], [data?.influencers]);
  const campaigns = useMemo(() => data?.campaigns ?? [], [data?.campaigns]);
  const executive = useMemo(() => data?.executive ?? [], [data?.executive]);
  const competitors = useMemo(() => data?.competitors ?? [], [data?.competitors]);

  return {
    mentions,
    summary,
    topics,
    risk,
    influencers,
    campaigns,
    executive,
    competitors,
    isLoading: isLoading && !data,
    isFetching,
    isError,
    error: errorMessage,
    refetch,
    handleRefresh,
    handleRetry,
  };
}
