import { RestClient } from "../rest/client";
import {
  RestAdministrationRepository,
  RestAssessmentRepository,
  RestNotificationRepository,
  RestSiteRepository,
  RestUserPreferencesRepository,
  RestWebAuthnRepository,
} from "../rest/repositories";

/** One composition point for all live resource adapters. */
export function createLiveRepositories(client = new RestClient()) {
  return {
    assessment: new RestAssessmentRepository(client),
    sites: new RestSiteRepository(client),
    administration: new RestAdministrationRepository(client),
    notifications: new RestNotificationRepository(client),
    preferences: new RestUserPreferencesRepository(client),
    webAuthn: new RestWebAuthnRepository(client),
  } as const;
}

export type LiveRepositories = ReturnType<typeof createLiveRepositories>;
