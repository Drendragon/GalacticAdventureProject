import { authenticatedPlanet } from "./planet-policy";
import type { SpacefarerRequest } from "./types";

type NavigationSource = {
  id: string;
  where?: unknown[];
};

type RestrictedNavigationSource = NavigationSource & {
  where: unknown[];
};

type NavigationQuery = {
  SELECT?: {
    from?: {
      ref?: Array<string | NavigationSource>;
    };
  };
};

const SPACEFARER_NAVIGATION_PREFIXES = ["GalacticService.Spacefarers/", "GalacticService.Spacefarers.drafts/"];
const SPACEFARER_DRAFTS = "GalacticService.Spacefarers.drafts";

export function restrictSpacefarerNavigation(request: SpacefarerRequest): void {
  if (!isSpacefarerNavigation(request.path)) return;

  const source = requiredNavigationSource(request);
  source.where.push("and", { ref: ["originPlanet"] }, "=", { val: authenticatedPlanet(request) });
  restrictDraftOwner(source, request.user.id);
}

function isSpacefarerNavigation(path: string): boolean {
  return SPACEFARER_NAVIGATION_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function requiredNavigationSource(request: SpacefarerRequest): RestrictedNavigationSource {
  const source = (request.query as NavigationQuery).SELECT?.from?.ref?.[0];
  if (typeof source === "string" || !source?.where) request.reject(403, "Spacefarer navigation requires an authorized source.");
  return { id: source.id, where: source.where };
}

function restrictDraftOwner(source: RestrictedNavigationSource, userID: string): void {
  if (source.id !== SPACEFARER_DRAFTS) return;
  source.where.push("and", { ref: ["DraftAdministrativeData", "InProcessByUser"] }, "=", { val: userID });
}
