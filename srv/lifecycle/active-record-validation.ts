import cds from "@sap/cds";

import { validateAssignment } from "./assignment-validation";
import { applyTrustedPlanet, validatePlanetUpdate } from "./planet-policy";
import type { SpacefarerData, SpacefarerRequest } from "./types";

export async function prepareActiveCreate(req: SpacefarerRequest): Promise<void> {
  applyTrustedPlanet(req);
  rejectExplicitNullNumerics(req);
  await validateAssignment(req);
}

export async function validateActiveUpdate(req: SpacefarerRequest): Promise<void> {
  rejectExplicitNullNumerics(req);
  const current = await currentSpacefarer(req);
  if (!current) return;

  validatePlanetUpdate(req, current);
  const resulting = { ...current, ...req.data };
  await validateAssignment(req, resulting);
}

export async function validateDraftPlanetUpdate(req: SpacefarerRequest): Promise<void> {
  const current = await currentSpacefarer(req);
  if (current) validatePlanetUpdate(req, current);
}

function rejectExplicitNullNumerics(req: SpacefarerRequest): void {
  if (req.data.stardustCollection === null) {
    req.reject(400, "Stardust collection is required.", "stardustCollection");
  }
  if (req.data.wormholeNavigationSkill === null) {
    req.reject(400, "Navigation skill is required.", "wormholeNavigationSkill");
  }
}

async function currentSpacefarer(req: SpacefarerRequest): Promise<SpacefarerData | undefined> {
  return cds.tx(req).run(SELECT.one.from(req.subject).columns("originPlanet", "department_ID", "position_ID"));
}
