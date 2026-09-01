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
    <article className={cx("owner-card [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [padding:1rem] [box-shadow:var(--shadow-1)]")} key={title}>
      <div className={cx("owner-card__header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [margin-bottom:0.8rem] [&_p]:[color:var(--kc-700)] [&_p]:[font-size:0.7rem] [&_p]:[font-weight:700] [&_p]:[letter-spacing:0.015em] [&_h3]:[margin-top:0.18rem]")}><div><p>Read-only</p><h3>{title}</h3></div></div>
      {rows.map(([label, name, email]) => (
        <div className={cx("owner-person [display:flex] [align-items:center] [gap:0.7rem] [border-top:1px_solid_var(--neutral-100)] [padding:0.75rem_0] [&_>_div]:[display:grid] [&_>_div]:[min-width:0] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.72rem] [&_span:last-child]:[color:var(--neutral-500)] [&_span:last-child]:[font-size:0.72rem] [&_strong]:[font-size:0.86rem] [&_a]:[overflow:hidden] [&_a]:[color:var(--neutral-500)] [&_a]:[font-size:0.72rem] [&_a]:[text-overflow:ellipsis] [&_a:hover]:[color:var(--kc-700)]")} key={label}><span className={cx("avatar [display:inline-grid] [width:38px] [height:38px] [flex:0_0_38px] [place-items:center] [border:1px_solid_var(--kc-200)] [border-radius:50%] [background:linear-gradient(145deg,_var(--kc-100),_var(--surface-elevated))] [color:var(--kc-800)] [font-size:0.72rem] [font-weight:750] max-[740px]:[width:36px] max-[740px]:[height:36px] max-[740px]:[flex-basis:36px] avatar--soft [width:36px]! [height:36px]! [flex-basis:36px] [background:var(--kc-50)]")}>{initialsOf(name)}</span><div><small>{label}</small><strong>{name}</strong><a href={`mailto:${email}`}>{email}</a></div></div>
      ))}
    </article>
  );
  return (
    <div className={cx("owner-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:1rem] [margin-top:1rem] max-[740px]:[grid-template-columns:1fr]")}>
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
    <div className={cx("owner-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:1rem] [margin-top:1rem] max-[740px]:[grid-template-columns:1fr]")}>
      {owners.map((owner) => (
        <article className={cx("owner-card [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [padding:1rem] [box-shadow:var(--shadow-1)]")} key={owner.id}>
          <div className={cx("owner-card__header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [margin-bottom:0.8rem] [&_p]:[color:var(--kc-700)] [&_p]:[font-size:0.7rem] [&_p]:[font-weight:700] [&_p]:[letter-spacing:0.015em] [&_h3]:[margin-top:0.18rem]")}><div><p>{owner.category}</p><h3>{owner.program}</h3></div></div>
          <div className={cx("owner-person [display:flex] [align-items:center] [gap:0.7rem] [border-top:1px_solid_var(--neutral-100)] [padding:0.75rem_0] [&_>_div]:[display:grid] [&_>_div]:[min-width:0] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.72rem] [&_span:last-child]:[color:var(--neutral-500)] [&_span:last-child]:[font-size:0.72rem] [&_strong]:[font-size:0.86rem] [&_a]:[overflow:hidden] [&_a]:[color:var(--neutral-500)] [&_a]:[font-size:0.72rem] [&_a]:[text-overflow:ellipsis] [&_a:hover]:[color:var(--kc-700)]")}><span className={cx("avatar [display:inline-grid] [width:38px] [height:38px] [flex:0_0_38px] [place-items:center] [border:1px_solid_var(--kc-200)] [border-radius:50%] [background:linear-gradient(145deg,_var(--kc-100),_var(--surface-elevated))] [color:var(--kc-800)] [font-size:0.72rem] [font-weight:750] max-[740px]:[width:36px] max-[740px]:[height:36px] max-[740px]:[flex-basis:36px] avatar--soft [width:36px]! [height:36px]! [flex-basis:36px] [background:var(--kc-50)]")}>{initialsOf(owner.primaryName)}</span><div><small>Primary Owner</small><strong>{owner.primaryName}</strong><a href={`mailto:${owner.primaryEmail}`}>{owner.primaryEmail}</a></div></div>
          <div className={cx("owner-person [display:flex] [align-items:center] [gap:0.7rem] [border-top:1px_solid_var(--neutral-100)] [padding:0.75rem_0] [&_>_div]:[display:grid] [&_>_div]:[min-width:0] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.72rem] [&_span:last-child]:[color:var(--neutral-500)] [&_span:last-child]:[font-size:0.72rem] [&_strong]:[font-size:0.86rem] [&_a]:[overflow:hidden] [&_a]:[color:var(--neutral-500)] [&_a]:[font-size:0.72rem] [&_a]:[text-overflow:ellipsis] [&_a:hover]:[color:var(--kc-700)]")}><span className={cx("avatar [display:inline-grid] [width:38px] [height:38px] [flex:0_0_38px] [place-items:center] [border:1px_solid_var(--kc-200)] [border-radius:50%] [background:linear-gradient(145deg,_var(--kc-100),_var(--surface-elevated))] [color:var(--kc-800)] [font-size:0.72rem] [font-weight:750] max-[740px]:[width:36px] max-[740px]:[height:36px] max-[740px]:[flex-basis:36px] avatar--soft [width:36px]! [height:36px]! [flex-basis:36px] [background:var(--kc-50)]")}>{initialsOf(owner.backupName)}</span><div><small>Backup Owner</small><strong>{owner.backupName}</strong><a href={`mailto:${owner.backupEmail}`}>{owner.backupEmail}</a></div></div>
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
    <div className={cx("data-table-wrap [max-width:100%] max-[1100px]:[width:100%] max-[1100px]:[max-width:none] max-[1100px]:[overflow:visible]")}>
      <table className={cx("data-table [width:100%] [table-layout:fixed] [border-collapse:collapse] [font-size:0.79rem] [&_th]:[overflow-wrap:anywhere] [&_td]:[overflow-wrap:anywhere] [&_th]:[padding:0.8rem_1rem] [&_th]:[border-bottom:1px_solid_var(--neutral-200)] [&_th]:[text-align:left] [&_th]:[vertical-align:middle] [&_td]:[padding:0.8rem_1rem] [&_td]:[border-bottom:1px_solid_var(--neutral-200)] [&_td]:[text-align:left] [&_td]:[vertical-align:middle] [&_th]:[background:var(--neutral-50)] [&_th]:[color:var(--neutral-600)] [&_th]:[font-size:0.69rem] [&_th]:[font-weight:750] [&_th]:[letter-spacing:0.01em] [&_tr:last-child_td]:[border-bottom:0] [&_tbody_tr:hover]:[background:var(--neutral-25)] [&_td_>_strong]:[display:block] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[display:block] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[margin-top:0.18rem] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[color:var(--neutral-500)] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[font-size:0.7rem] [&_td:nth-child(3)]:[max-width:390px] max-[1100px]:[display:block] max-[1100px]:[width:100%] max-[1100px]:[min-width:0] max-[1100px]:[&_tbody]:[display:grid] max-[1100px]:[&_tbody]:[width:100%] max-[1100px]:[&_tbody]:[min-width:0] max-[1100px]:[&_tr]:[display:block] max-[1100px]:[&_tr]:[width:100%] max-[1100px]:[&_tr]:[min-width:0] max-[1100px]:[&_td]:[display:grid] max-[1100px]:[&_td]:[width:100%] max-[1100px]:[&_td]:[min-width:0] max-[1100px]:[&_thead]:[position:absolute] max-[1100px]:[&_thead]:[display:block] max-[1100px]:[&_thead]:[width:1px] max-[1100px]:[&_thead]:[height:1px] max-[1100px]:[&_thead]:[padding:0] max-[1100px]:[&_thead]:[margin:-1px] max-[1100px]:[&_thead]:[overflow:hidden] max-[1100px]:[&_thead]:[clip:rect(0,_0,_0,_0)] max-[1100px]:[&_thead]:[white-space:nowrap] max-[1100px]:[&_thead]:[border:0] max-[1100px]:[&_thead_tr]:[position:absolute] max-[1100px]:[&_thead_tr]:[display:block] max-[1100px]:[&_thead_tr]:[width:1px] max-[1100px]:[&_thead_tr]:[min-width:0] max-[1100px]:[&_thead_tr]:[height:1px] max-[1100px]:[&_thead_tr]:[overflow:hidden] max-[1100px]:[&_thead_tr]:[padding:0] max-[1100px]:[&_thead_tr]:[border:0] max-[1100px]:[&_thead_tr]:[clip-path:inset(50%)] max-[1100px]:[&_thead_th]:[position:absolute] max-[1100px]:[&_thead_th]:[display:block] max-[1100px]:[&_thead_th]:[width:1px] max-[1100px]:[&_thead_th]:[min-width:0] max-[1100px]:[&_thead_th]:[height:1px] max-[1100px]:[&_thead_th]:[overflow:hidden] max-[1100px]:[&_thead_th]:[padding:0] max-[1100px]:[&_thead_th]:[border:0] max-[1100px]:[&_thead_th]:[clip-path:inset(50%)] max-[1100px]:[&_tbody]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[1100px]:[&_tbody]:[gap:0.75rem] max-[1100px]:[&_tbody]:[padding:0.85rem] max-[1100px]:[&_tbody_tr]:[overflow:hidden] max-[1100px]:[&_tbody_tr]:[border:1px_solid_var(--neutral-200)] max-[1100px]:[&_tbody_tr]:[border-radius:var(--radius-lg)] max-[1100px]:[&_tbody_tr]:[background:var(--neutral-25)] max-[1100px]:[&_tbody_tr]:[box-shadow:var(--shadow-1)] max-[1100px]:[&_td]:[grid-template-columns:minmax(116px,_0.45fr)_minmax(0,_1fr)] max-[1100px]:[&_td]:[align-items:center] max-[1100px]:[&_td]:[gap:0.75rem] max-[1100px]:[&_td]:[min-height:48px] max-[1100px]:[&_td]:[padding:0.7rem_0.85rem] max-[1100px]:[&_td]:[border-bottom:1px_solid_var(--neutral-200)] max-[1100px]:[&_td::before]:[color:var(--neutral-500)] max-[1100px]:[&_td::before]:[content:attr(data-label)] max-[1100px]:[&_td::before]:[font-size:0.67rem] max-[1100px]:[&_td::before]:[font-weight:750] max-[1100px]:[&_td::before]:[letter-spacing:0.01em] max-[1100px]:[&_td:last-child]:[min-height:44px] max-[1100px]:[&_td:last-child]:[grid-template-columns:1fr] max-[1100px]:[&_td:last-child]:[justify-items:end] max-[1100px]:[&_td:last-child]:[border-bottom:0] max-[1100px]:[&_td:last-child]:[background:var(--neutral-50)] max-[1100px]:[&_td:last-child::before]:[display:none] max-[1100px]:[&_td[data-label='']::before]:[display:none] max-[1100px]:[&_td_>_strong]:[min-width:0] max-[1100px]:[&_td_>_strong]:[overflow-wrap:anywhere] max-[1100px]:[&_td_>_span]:[min-width:0] max-[1100px]:[&_td_>_span]:[overflow-wrap:anywhere] max-[1100px]:[&_td_>_div]:[min-width:0] max-[1100px]:[&_td_>_div]:[overflow-wrap:anywhere] max-[820px]:[&_tbody]:[grid-template-columns:1fr]")}>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
        <tbody>{users.map((user) => (
          <tr key={user.id}>
            <td data-label="Name"><strong>{user.name}</strong></td>
            <td data-label="Email">{user.email}</td>
            <td data-label="Role">{siteUserRoleLabels[user.role]}</td>
            <td data-label="Status"><span className={cx("publish-badge [display:inline-flex]! [width:fit-content] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.5rem] [font-size:0.7rem]! [font-weight:700] [border-color:var(--success-border)]! [background:var(--success-surface)] [color:var(--success)]! max-[1100px]:[.data-table_&]:[justify-self:start] max-[720px]:[.import-preview-requirement__summary_>_&]:[grid-column:2] max-[720px]:[.import-preview-requirement__summary_>_&]:[justify-self:start]", user.status === "Inactive" && "publish-badge--draft [border-color:#d6bbfb]! [background:var(--provisional-surface)] [color:var(--provisional)]!")}>{user.status}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
