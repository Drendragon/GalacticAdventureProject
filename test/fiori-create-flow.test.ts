import cds from "@sap/cds";
import { beforeAll, describe, expect, it } from "vitest";

type ServiceEntity = Record<string, unknown>;

describe("Fiori create-flow metadata", () => {
  let spacefarers: ServiceEntity;

  beforeAll(async () => {
    const model = await cds.load("*");
    spacefarers = model.definitions?.["GalacticService.Spacefarers"] as unknown as ServiceEntity;
  });

  it("exposes Spacefarers as draft-enabled", () => {
    expect(spacefarers["@odata.draft.enabled"]).toBe(true);
  });

  it("keeps Spacefarers insertable", () => {
    expect(spacefarers["@readonly"]).not.toBe(true);
    expect(spacefarers["@Capabilities.InsertRestrictions.Insertable"]).not.toBe(false);
  });
});
