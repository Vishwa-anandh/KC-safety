import { Mail, UsersRound } from "lucide-react";
import type { OwnerRecord, SiteContacts, SiteUser, SiteUserRole } from "../../../shared/types";
import { EmptyState } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

const initialsOf = (name: string) => name.split(" ").filter(Boolean).map((part) => part[0]).join("");

/* Owner / contact cards. The card chrome is the canonical card recipe; the person rows and
   avatars are shared verbatim by both panels below. */
const ownerGridClass = "owner-grid mt-4 grid grid-cols-1 gap-4 md:grid-cols-2";
const ownerCardClass = "owner-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900";
const ownerCardHeaderClass = "owner-card__header mb-3 flex items-start justify-between gap-4";
const ownerCardEyebrowClass = "text-xs font-bold tracking-wide text-kc-blue-700 dark:text-kc-blue-300";
const ownerCardTitleClass = "mt-0.5 text-slate-900 dark:text-slate-100";
const ownerPersonClass = "owner-person flex items-center gap-3 border-t border-slate-100 py-3 dark:border-slate-800";
/* The avatar must stay square, so both dimensions come from a single `size-*` step. */
const avatarClass = "avatar avatar--soft inline-grid size-9 flex-none place-items-center rounded-full border border-kc-blue-200 bg-kc-blue-50 text-xs font-bold text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200";
const personTextClass = "grid min-w-0";
const personRoleClass = "text-xs text-slate-500 dark:text-slate-400";
const personNameClass = "text-sm text-slate-900 dark:text-slate-100";
const personEmailClass = "overflow-hidden text-xs text-ellipsis text-slate-500 hover:text-kc-blue-700 dark:text-slate-400 dark:hover:text-kc-blue-300";

/**
 * Read-only site contacts, shared by the enterprise site drill-down and the admin site detail
 * page. `siteContacts` is still a single global record rather than per-site, so callers pass
 * null for any site that has no real contact data instead of showing another site's people.
 */
export function ContactsPanel({ contacts }: { contacts: SiteContacts | null }) {
  if (!contacts) return <EmptyState icon={<Mail size={26} />} title="Contact details not yet provided" description="Site contacts have not been recorded for this site yet." />;
  const group = (title: string, rows: Array<[string, string, string]>) => (
    <article className={cx(ownerCardClass)} key={title}>
      <div className={cx(ownerCardHeaderClass)}><div><p className={cx(ownerCardEyebrowClass)}>Read-only</p><h3 className={cx(ownerCardTitleClass)}>{title}</h3></div></div>
      {rows.map(([label, name, email]) => (
        <div className={cx(ownerPersonClass)} key={label}><span className={cx(avatarClass)}>{initialsOf(name)}</span><div className={cx(personTextClass)}><small className={cx(personRoleClass)}>{label}</small><strong className={cx(personNameClass)}>{name}</strong><a className={cx(personEmailClass)} href={`mailto:${email}`}>{email}</a></div></div>
      ))}
    </article>
  );
  return (
    <div className={cx(ownerGridClass)}>
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
    <div className={cx(ownerGridClass)}>
      {owners.map((owner) => (
        <article className={cx(ownerCardClass)} key={owner.id}>
          <div className={cx(ownerCardHeaderClass)}><div><p className={cx(ownerCardEyebrowClass)}>{owner.category}</p><h3 className={cx(ownerCardTitleClass)}>{owner.program}</h3></div></div>
          <div className={cx(ownerPersonClass)}><span className={cx(avatarClass)}>{initialsOf(owner.primaryName)}</span><div className={cx(personTextClass)}><small className={cx(personRoleClass)}>Primary Owner</small><strong className={cx(personNameClass)}>{owner.primaryName}</strong><a className={cx(personEmailClass)} href={`mailto:${owner.primaryEmail}`}>{owner.primaryEmail}</a></div></div>
          <div className={cx(ownerPersonClass)}><span className={cx(avatarClass)}>{initialsOf(owner.backupName)}</span><div className={cx(personTextClass)}><small className={cx(personRoleClass)}>Backup Owner</small><strong className={cx(personNameClass)}>{owner.backupName}</strong><a className={cx(personEmailClass)} href={`mailto:${owner.backupEmail}`}>{owner.backupEmail}</a></div></div>
        </article>
      ))}
    </div>
  );
}

const siteUserRoleLabels: Record<SiteUserRole, string> = {
  "site-contributor": "Site contributor",
  administrator: "Administrator",
};

/*
 * The users table keeps its structural switch at exactly 1100px (`shell:`): below that width the
 * table stops being a table and every row becomes a stacked label/value card, so each cell needs
 * its own visible label. Those labels used to come from `td::before { content: attr(data-label) }`,
 * which has no on-scale utility, so they are real spans now — hidden again from `shell:` up, where
 * the real <thead> takes over. `data-label` stays on every cell for the tests that query it.
 */
const dataTableWrapClass = "data-table-wrap w-full max-w-full";
const dataTableClass = "data-table block w-full min-w-0 table-fixed border-collapse text-sm text-slate-900 dark:text-slate-100 shell:table";
const dataTableHeadClass = "block sr-only shell:not-sr-only shell:table-header-group";
const dataTableHeaderCellClass = "border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400";
const dataTableBodyClass = "grid w-full min-w-0 grid-cols-1 gap-3 p-3.5 md:grid-cols-2 shell:table-row-group shell:p-0";
const dataTableRowClass = "block w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-900 shell:table-row shell:rounded-none shell:border-0 shell:bg-transparent shell:shadow-none";
const dataTableCellClass = "flex min-h-12 w-full min-w-0 items-center gap-3 border-b border-slate-200 px-3.5 py-3 text-left align-middle wrap-anywhere dark:border-slate-700 shell:table-cell shell:min-h-0 shell:px-4";
/* Last cell of each stacked card: no label, no divider, and its own footer tint. */
const dataTableLastCellClass = "flex min-h-11 w-full min-w-0 items-center bg-slate-50 px-3.5 py-3 text-left align-middle wrap-anywhere border-slate-200 dark:border-slate-700 dark:bg-slate-900 shell:table-cell shell:min-h-0 shell:bg-transparent shell:px-4";
const dataTableCellLabelClass = "w-29 flex-none text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 shell:hidden";
const publishBadgeClass = "publish-badge inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold";
const publishBadgeActiveClass = "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
const publishBadgeDraftClass = "publish-badge--draft border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300";

/** Read-only list of the people assigned to a site, shared by oversight screens. */
export function SiteUsersPanel({ users }: { users: SiteUser[] }) {
  if (!users.length) return <EmptyState icon={<UsersRound size={26} />} title="No users assigned" description="No one has been given access to this site yet." />;
  return (
    <div className={cx(dataTableWrapClass)}>
      <table className={cx(dataTableClass)}>
        <thead className={cx(dataTableHeadClass)}><tr><th className={cx(dataTableHeaderCellClass)}>Name</th><th className={cx(dataTableHeaderCellClass)}>Email</th><th className={cx(dataTableHeaderCellClass)}>Role</th><th className={cx(dataTableHeaderCellClass)}>Status</th></tr></thead>
        <tbody className={cx(dataTableBodyClass)}>{users.map((user, index) => {
          // The last table row drops its cell dividers on desktop; on mobile every card keeps them.
          const cellClass = cx(dataTableCellClass, index === users.length - 1 && "shell:border-b-0");
          const lastCellClass = cx(dataTableLastCellClass, index !== users.length - 1 && "shell:border-b");
          return (
            <tr className={cx(dataTableRowClass)} key={user.id}>
              <td className={cellClass} data-label="Name"><span className={cx(dataTableCellLabelClass)}>Name</span><strong className={cx("block min-w-0")}>{user.name}</strong></td>
              <td className={cellClass} data-label="Email"><span className={cx(dataTableCellLabelClass)}>Email</span>{user.email}</td>
              <td className={cellClass} data-label="Role"><span className={cx(dataTableCellLabelClass)}>Role</span>{siteUserRoleLabels[user.role]}</td>
              <td className={lastCellClass} data-label="Status"><span className={cx(publishBadgeClass, user.status === "Inactive" ? publishBadgeDraftClass : publishBadgeActiveClass)}>{user.status}</span></td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}
