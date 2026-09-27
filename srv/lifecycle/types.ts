import type { Request } from "@sap/cds";

export type SpacefarerData = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  originPlanet?: string | null;
  stardustCollection?: number | null;
  wormholeNavigationSkill?: number | null;
  department_ID?: string | null;
  position_ID?: string | null;
};

export type SpacefarerRequest = Request<SpacefarerData>;
