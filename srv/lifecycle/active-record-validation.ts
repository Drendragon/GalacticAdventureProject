import cds from "@sap/cds";

import { validateAssignment } from "./assignment-validation";
import { applyTrustedPlanet, validatePlanetUpdate } from "./planet-policy";
import type { SpacefarerData, SpacefarerRequest } from "./types";

const requiredFields = ["firstName", "lastName", "email"] as const;

export async function prepareActiveCreate(req: SpacefarerRequest): Promise<void> {
  applyTrustedPlanet(req);
  applyNumericDefaults(req.data);
  validateRequiredFields(req);
  validateNumericRanges(req);
  await validateAssignment(req);
}

export async function validateActiveUpdate(req: SpacefarerRequest): Promise<void> {
  const current = await currentSpacefarer(req);
  if (!current) return;

  validatePlanetUpdate(req, current);
  const resulting = { ...current, ...req.data };
  validateRequiredFields(req, resulting);
  validateNumericRanges(req, resulting);
  await validateAssignment(req, resulting);
}

export async function validateDraftPlanetUpdate(req: SpacefarerRequest): Promise<void> {
  const current = await currentSpacefarer(req);
  if (current) validatePlanetUpdate(req, current);
}

function applyNumericDefaults(data: SpacefarerData): void {
  if (data.stardustCollection === undefined) data.stardustCollection = 0;
  if (data.wormholeNavigationSkill === undefined) data.wormholeNavigationSkill = 1;
}

function validateRequiredFields(req: SpacefarerRequest, data = req.data): void {
  for (const field of requiredFields) {
    const value = data[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      req.reject(400, `${field} is required`, field);
    }
  }
}

function validateNumericRanges(req: SpacefarerRequest, data = req.data): void {
  const { stardustCollection, wormholeNavigationSkill } = data;

  if (!isValidStardustCollection(stardustCollection)) {
    req.reject(400, "stardustCollection must be zero or greater", "stardustCollection");
  }

  if (!isValidNavigationSkill(wormholeNavigationSkill)) {
    req.reject(400, "wormholeNavigationSkill must be between 0 and 100", "wormholeNavigationSkill");
  }
}

function isValidStardustCollection(value: number | null | undefined): boolean {
  if (value == null) return false;
  return value >= 0;
}

function isValidNavigationSkill(value: number | null | undefined): boolean {
  if (value == null) return false;
  if (value < 0) return false;
  return value <= 100;
}

async function currentSpacefarer(req: SpacefarerRequest): Promise<SpacefarerData | undefined> {
  return cds
    .tx(req)
    .run(
      SELECT.one
        .from(req.subject)
        .columns("firstName", "lastName", "email", "originPlanet", "stardustCollection", "wormholeNavigationSkill", "department_ID", "position_ID"),
    );
}
