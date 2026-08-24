import { Mail, UsersRound } from "lucide-react";
import type { OwnerRecord, SiteContacts, SiteUser, SiteUserRole } from "../../../shared/types";
import { EmptyState } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

const initialsOf = (name: string) => name.split(" ").filter(Boolean).map((part) => part[0]).join("");

/**
 * Read-only site contacts, shared by the enterprise site drill-down and the admin site detail
 * page. `siteContacts` is still a single global record rather than per-site, so callers pass
 * null for any site that has no real contact data instead of showing another site's people.
 */
export function ContactsPanel({ contacts }: { contacts: SiteContacts | null }) {
  if (!contacts) return <EmptyState icon={<Mail size={26} />} title="Contact details not yet provided" description="Site contacts have not been recorded for this site yet." />;
  const group = (title: string, rows: Array<[string, string, string]>) => (
    <article className="owner-card" key={title}>
      <div className="owner-card__header"><div><p>Read-only</p><h3>{title}</h3></div></div>
      {rows.map(([label, name, email]) => (
        <div className="owner-person" key={label}><span className="avatar avatar--soft">{initialsOf(name)}</span><div><small>{label}</small><strong>{name}</strong><a href={`mailto:${email}`}>{email}</a></div></div>
      ))}
    </article>
  );
  return (
    <div className="owner-grid">
      {group("Local leadership", [
        ["Site / Location Manager", contacts.siteManager, contacts.siteManagerEmail],
        ["Site Environmental Leader", contacts.environmentalLeader, contacts.environmentalLeaderEmail],
        ["Site Health & Safety Leader", contacts.healthSafetyLeader, contacts.healthSafetyLeaderEmail],
        ["Site Occupational Health Nurse", contacts.occupationalHealthNurse, contacts.occupationalHealthNurseEmail],
      ])}
      {group("Regional leadership", [
        ["Regional Health & Safety Leader", contacts.regionalHealthSafetyLeader, contacts.regionalHealthSafetyEmail],
        ["Regional Environmental Leader", contacts.regionalEnvironmentalLeader, contacts.regionalEnvironmentalEmail],
        ["Regional Occupational Health Leader", contacts.regionalOccupationalHealthLeader, contacts.regionalOccupationalHealthEmail],
      ])}
    </div>
  );
}

/** Read-only program & standard owners — the admin view of what /owners lets a site edit. */
export function OwnersPanel({ owners }: { owners: OwnerRecord[] | null }) {
  if (!owners?.length) return <EmptyState icon={<Mail size={26} />} title="Owners not yet assigned" description="Program and standard owners have not been recorded for this site yet." />;
  return (
    <div className="owner-grid">
      {owners.map((owner) => (
        <article className="owner-card" key={owner.id}>
          <div className="owner-card__header"><div><p>{owner.category}</p><h3>{owner.program}</h3></div></div>
          <div className="owner-person"><span className="avatar avatar--soft">{initialsOf(owner.primaryName)}</span><div><small>Primary Owner</small><strong>{owner.primaryName}</strong><a href={`mailto:${owner.primaryEmail}`}>{owner.primaryEmail}</a></div></div>
          <div className="owner-person"><span className="avatar avatar--soft">{initialsOf(owner.backupName)}</span><div><small>Backup Owner</small><strong>{owner.backupName}</strong><a href={`mailto:${owner.backupEmail}`}>{owner.backupEmail}</a></div></div>
        </article>
      ))}
    </div>
  );
}

const siteUserRoleLabels: Record<SiteUserRole, string> = {
  "site-contributor": "Site contributor",
  "enterprise-viewer": "Regional / enterprise viewer",
  administrator: "Administrator",
};

/** Read-only list of the people assigned to a site, shared by oversight screens. */
export function SiteUsersPanel({ users }: { users: SiteUser[] }) {
  if (!users.length) return <EmptyState icon={<UsersRound size={26} />} title="No users assigned" description="No one has been given access to this site yet." />;
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
        <tbody>{users.map((user) => (
          <tr key={user.id}>
            <td data-label="Name"><strong>{user.name}</strong></td>
            <td data-label="Email">{user.email}</td>
            <td data-label="Role">{siteUserRoleLabels[user.role]}</td>
            <td data-label="Status"><span className={cx("publish-badge", user.status === "Inactive" && "publish-badge--draft")}>{user.status}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
