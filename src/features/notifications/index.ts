import { useApplicationData } from "../../app/providers/ApplicationDataProvider";
import type { SiteUserRole } from "../../shared/types";

/** Feature-facing notification API; transport and persistence remain behind application repositories. */
export function useNotifications(role: SiteUserRole) {
  const { notifications, markAllNotificationsRead, markNotificationRead } = useApplicationData();
  return {
    notifications: notifications.filter((notification) => notification.audience.includes(role)),
    markAllRead: () => markAllNotificationsRead(role),
    markRead: (id: string) => markNotificationRead(id, role),
  };
}
