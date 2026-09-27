import { authenticatedPlanet } from "./planet-policy";
import type { SpacefarerRequest } from "./types";

type NavigationSource = {
  id: string;
  where?: unknown[];
};

type NavigationQuery = {
  SELECT?: {
    from?: {
      ref?: Array<string | NavigationSource>;
    };
  };
};

const SPACEFARER_NAVIGATION_PREFIXES = ["GalacticService.Spacefarers/", "GalacticService.Spacefarers.drafts/"];

export function restrictSpacefarerNavigation(request: SpacefarerRequest): void {
  if (!SPACEFARER_NAVIGATION_PREFIXES.some((prefix) => request.path.startsWith(prefix))) return;

  const source = (request.query as NavigationQuery).SELECT?.from?.ref?.[0];
  if (typeof source === "string" || !source?.where) {
    request.reject(403, "Spacefarer navigation requires an authorized source");
  }

  source.where.push("and", { ref: ["originPlanet"] }, "=", { val: authenticatedPlanet(request) });
}
