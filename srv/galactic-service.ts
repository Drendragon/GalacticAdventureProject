import cds from "@sap/cds";

import { prepareActiveCreate, validateActiveUpdate, validateDraftPlanetUpdate } from "./lifecycle/active-record-validation";
import { restrictSpacefarerNavigation } from "./lifecycle/planet-isolation";
import { applyTrustedPlanet, requireAuthenticatedPlanet } from "./lifecycle/planet-policy";
import { scheduleWelcomeNotification } from "./lifecycle/welcome-notification";
import type { WelcomeEmailRecipient } from "./services/notification-service";

export default class GalacticService extends cds.ApplicationService {
  async init(): Promise<void> {
    const { Spacefarers } = this.entities;
    const SpacefarerDrafts = Spacefarers.drafts;
    if (!SpacefarerDrafts) throw new Error("Spacefarers must remain draft-enabled");

    this.before("*", [Spacefarers, SpacefarerDrafts], requireAuthenticatedPlanet);
    this.before("READ", restrictSpacefarerNavigation);
    this.before("NEW", SpacefarerDrafts, applyTrustedPlanet);

    this.before("PATCH", SpacefarerDrafts, validateDraftPlanetUpdate);
    this.before("CREATE", Spacefarers, prepareActiveCreate);
    this.before("UPDATE", Spacefarers, validateActiveUpdate);
    this.after("CREATE", Spacefarers, (_result, request) => {
      scheduleWelcomeNotification(request.data as WelcomeEmailRecipient, request);
    });

    return super.init();
  }
}
