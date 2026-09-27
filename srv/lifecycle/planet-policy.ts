import type { SpacefarerData, SpacefarerRequest } from "./types";

export function authenticatedPlanet(req: SpacefarerRequest): string {
  const planet = req.user.attr.planet;

  if (typeof planet !== "string" || planet.trim().length === 0) {
    return req.reject(403, "A valid planet attribute is required");
  }

  return planet.trim();
}

export function requireAuthenticatedPlanet(req: SpacefarerRequest): void {
  authenticatedPlanet(req);
}

export function applyTrustedPlanet(req: SpacefarerRequest): void {
  const planet = authenticatedPlanet(req);

  if (req.data.originPlanet != null && req.data.originPlanet !== planet) {
    req.reject(403, "originPlanet must match the authenticated user's planet", "originPlanet");
  }

  req.data.originPlanet = planet;
}

export function validatePlanetUpdate(req: SpacefarerRequest, current: SpacefarerData): void {
  const planet = authenticatedPlanet(req);
  const requestedPlanet = req.data.originPlanet;

  if (requestedPlanet !== undefined && requestedPlanet !== current.originPlanet) {
    req.reject(400, "originPlanet cannot be changed", "originPlanet");
  }

  if (requestedPlanet !== undefined && requestedPlanet !== planet) {
    req.reject(403, "originPlanet must match the authenticated user's planet", "originPlanet");
  }
}
