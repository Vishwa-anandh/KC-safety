import type { AuthUser, UserRole } from "../../shared/types";

/** Development-only identities. Production authentication never imports this fixture. */
export const demoAccounts: Record<UserRole, AuthUser & { password: string }> = {
  "site-contributor": { id: "demo-maya-patel", name: "Maya Patel", email: "maya.patel@demo.kc", password: "Welcome123!", initials: "MP", role: "site-contributor", roleLabel: "Site contributor", scope: "Northstar Manufacturing" },
  administrator: { id: "demo-rachel-morgan", name: "Rachel Morgan", email: "rachel.morgan@demo.kc", password: "Welcome123!", initials: "RM", role: "administrator", roleLabel: "Enterprise administrator", scope: "Global EHS&S administration" },
};
