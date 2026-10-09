import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../api/client";
import type { NotificationItem } from "../models/types";

export function useNotifications(onNavigate: (route: string) => void) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: api.listNotifications,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllMutation = useMutation({
    mutationFn: api.markNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<NotificationItem[]>([
        "notifications",
      ]);
      queryClient.setQueryData<NotificationItem[]>(
        ["notifications"],
        (old = []) => old.map((n) => ({ ...n, read: true })),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
      toast.error("Failed to mark all notifications as read");
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });

  const markSingleMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<NotificationItem[]>([
        "notifications",
      ]);
      queryClient.setQueryData<NotificationItem[]>(
        ["notifications"],
        (old = []) => old.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.read) {
      markSingleMutation.mutate(notif.id);
    }
    if (notif.route) {
      onNavigate(notif.route);
    }
  };

  return {
    notifications,
    unreadCount,
    markAllRead: () => markAllMutation.mutate(),
    handleNotificationClick,
  };
}
