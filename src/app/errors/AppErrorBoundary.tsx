import { Component, type ErrorInfo, type ReactNode } from "react";
import { cx } from "../../shared/utils";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Replace with the approved telemetry adapter when a production sink is configured.
    console.error("KC Safety application error", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className={cx("access-state")}>
        <section>
          <h1>The workspace could not be loaded</h1>
          <p>Reload the page. If the problem continues, contact EHS&amp;S support.</p>
          <button type="button" className={cx("button [display:inline-flex] [min-width:0] [align-items:center] [justify-content:center] [gap:0.5rem] [border:1px_solid_transparent] [border-radius:var(--radius-md)] [font-size:0.9rem] [font-weight:650] [line-height:1] [white-space:nowrap] [transition:background_120ms_ease,_border-color_120ms_ease,_box-shadow_120ms_ease,_color_120ms_ease,_transform_80ms_ease] disabled:[background:var(--neutral-100)] disabled:[border-color:var(--neutral-200)] disabled:[color:var(--neutral-400)] disabled:[box-shadow:none] [.question-evidence__editor_>_&]:[justify-self:start] [.question-evidence__attachments-header_>_&]:[flex:0_0_auto] [.site-assessment-area-row_>_&]:[justify-self:end] max-[900px]:[.site-assessment-area-row_>_&]:[grid-column:1_/_-1] max-[900px]:[.site-assessment-area-row_>_&]:[justify-self:stretch] max-[900px]:[.site-assessment-area-row_>_&]:[width:100%] max-[760px]:[.site-assessment-priority_&]:[width:100%] [.action-editor__header_>_&]:[margin-left:auto] max-[1500px]:[.requirement-mobile-toolbar_&:first-child]:[display:none] max-[1100px]:[.requirement-mobile-toolbar_&:first-child]:[display:inline-flex] max-[740px]:[.page-header__actions_&]:[width:100%] max-[740px]:[.overview-callout_&]:[grid-column:1_/_-1] max-[740px]:[.overview-callout_&]:[width:100%] max-[740px]:[.requirement-footer_>_&]:[width:100%] max-[740px]:[.requirement-footer_>_div_&]:[width:100%] max-[740px]:[.dialog__footer_&]:[width:100%] max-[740px]:[.section-drilldown-row_>_&]:[grid-column:1_/_-1] max-[740px]:[.section-drilldown-row_>_&]:[width:100%] max-[740px]:[.import-card__footer_&]:[width:100%] max-[740px]:[.result-state_&]:[width:100%] [.help-role-grid_&]:[width:100%] [.help-role-grid_&]:[margin-top:auto] max-[900px]:[.help-role-grid_&]:[width:auto] max-[620px]:[.setup-welcome__actions_&]:[width:100%] max-[620px]:[.tour-card__footer_&:last-child]:[flex:1] max-[620px]:[.setup-reminder_>_&]:[grid-column:2_/_-1] max-[620px]:[.setup-reminder_>_&]:[grid-row:2] max-[620px]:[.setup-reminder_>_&]:[width:100%] max-[620px]:[.help-role-grid_&]:[grid-column:1_/_-1] max-[620px]:[.help-role-grid_&]:[width:100%] max-[620px]:[.setup-complete_&]:[width:100%] [.passkey-add_&]:[width:100%] [.passkey-setup-message_&]:[flex:0_0_auto] max-[620px]:[.passkey-enrollment-choice_&]:[grid-column:2] max-[620px]:[.passkey-enrollment-choice_&]:[justify-self:start] max-[620px]:[.settings-card--split_>_&]:[width:100%] [.settings-index-empty_&]:[margin-top:0.3rem] max-[620px]:[.session-panel_&]:[grid-column:1_/_-1] max-[620px]:[.session-panel_&]:[width:100%] [.first-login-passkey__complete_&]:[margin-top:0.35rem] max-[620px]:[.first-login-passkey__actions_&]:[width:100%] button--primary [background:var(--brand-solid)] [border-color:var(--brand-solid)] [color:#fff] [box-shadow:0_1px_2px_rgb(12_42_62_/_0.16)] [&:hover:not(:disabled)]:[background:var(--brand-solid-hover)] [&:hover:not(:disabled)]:[border-color:var(--brand-solid-hover)] [&:active:not(:disabled)]:[background:var(--brand-solid-active)] [&:active:not(:disabled)]:[transform:translateY(1px)] button--default [min-height:42px] [padding:0.68rem_1rem]")} onClick={() => window.location.reload()}>
            Reload workspace
          </button>
        </section>
      </main>
    );
  }
}
