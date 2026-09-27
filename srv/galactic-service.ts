import cds from "@sap/cds";

import { prepareActiveCreate, validateActiveUpdate, validateDraftPlanetUpdate } from "./lifecycle/active-record-validation";
import { applyTrustedPlanet } from "./lifecycle/planet-policy";

export default class GalacticService extends cds.ApplicationService {
  async init(): Promise<void> {
    const { Spacefarers } = this.entities;
    const SpacefarerDrafts = Spacefarers.drafts;
    if (!SpacefarerDrafts) throw new Error("Spacefarers must remain draft-enabled");

    this.before("NEW", SpacefarerDrafts, applyTrustedPlanet);

    this.before("PATCH", SpacefarerDrafts, validateDraftPlanetUpdate);
    this.before("CREATE", Spacefarers, prepareActiveCreate);
    this.before("UPDATE", Spacefarers, validateActiveUpdate);

    return super.init();
  }
}
