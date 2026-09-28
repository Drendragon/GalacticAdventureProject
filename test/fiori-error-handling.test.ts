import cds from "@sap/cds";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const { DELETE, GET, POST } = cds.test(__dirname + "/..");
const servicePath = "/odata/v4/galactic";
const auth = { username: "earth-user", password: "earth-demo" };
const engineeringDepartment = "10000000-0000-4000-8000-000000000002";
const explorerPosition = "20000000-0000-4000-8000-000000000001";

const activePath = (ID: string) => `${servicePath}/Spacefarers(ID=${ID},IsActiveEntity=true)`;
const draftPath = (ID: string) => `${servicePath}/Spacefarers(ID=${ID},IsActiveEntity=false)`;
const candidate = (ID: string) => ({
  ID,
  IsActiveEntity: true,
  firstName: "Nova",
  lastName: "Starlight",
  email: `nova.${ID.at(-1)}@galactic.example`,
});
const draftCandidate = (ID: string) => {
  const data = candidate(ID);
  return { ID: data.ID, firstName: data.firstName, lastName: data.lastName, email: data.email };
};

const oDataError = (status: number, code: string, message: string, target: string) => ({
  status,
  response: {
    data: {
      error: {
        code,
        message,
        target,
        "@Common.numericSeverity": 4,
      },
    },
  },
});

describe("Fiori validation errors", () => {
  let ID: string;
  let sequence = 0;

  beforeEach(() => {
    sequence += 1;
    ID = `b0000000-0000-4000-8000-${sequence.toString().padStart(12, "0")}`;
  });

  afterEach(async () => {
    await DELETE(draftPath(ID), { auth }).catch(() => undefined);
    await DELETE(activePath(ID), { auth }).catch(() => undefined);
  });

  it("targets a negative stardust collection", async () => {
    await expect(POST(`${servicePath}/Spacefarers`, { ...candidate(ID), stardustCollection: -1 }, { auth })).rejects.toMatchObject(
      oDataError(400, "ASSERT_RANGE", "Stardust collection cannot be negative.", "stardustCollection"),
    );
  });

  it("targets navigation skill outside its range", async () => {
    await expect(POST(`${servicePath}/Spacefarers`, { ...candidate(ID), wormholeNavigationSkill: 101 }, { auth })).rejects.toMatchObject(
      oDataError(400, "ASSERT_RANGE", "Navigation skill must be between 0 and 100.", "wormholeNavigationSkill"),
    );
  });

  it("targets an origin planet that conflicts with the user's assignment", async () => {
    await expect(POST(`${servicePath}/Spacefarers`, { ...candidate(ID), originPlanet: "Mars" }, { auth })).rejects.toMatchObject(
      oDataError(403, "403", "Origin planet must match your assigned planet.", "originPlanet"),
    );
  });

  it("targets a missing required field", async () => {
    const data = candidate(ID);
    delete (data as Partial<typeof data>).firstName;

    await expect(POST(`${servicePath}/Spacefarers`, data, { auth })).rejects.toMatchObject(
      oDataError(400, "ASSERT_MANDATORY", "First name is required.", "firstName"),
    );
  });

  it("targets a position that does not belong to its department", async () => {
    await expect(
      POST(`${servicePath}/Spacefarers`, { ...candidate(ID), department_ID: engineeringDepartment, position_ID: explorerPosition }, { auth }),
    ).rejects.toMatchObject(oDataError(400, "400", "The selected position does not belong to the selected department.", "position_ID"));
  });

  it("returns a targeted error when draft activation fails", async () => {
    await POST(`${servicePath}/Spacefarers`, { ...draftCandidate(ID), stardustCollection: -1 }, { auth });

    await expect(POST(`${draftPath(ID)}/draftActivate`, {}, { auth })).rejects.toMatchObject(
      oDataError(400, "ASSERT_RANGE", "Stardust collection cannot be negative.", "in/stardustCollection"),
    );
  });

  it("keeps a rejected draft available for correction", async () => {
    await POST(`${servicePath}/Spacefarers`, { ...draftCandidate(ID), stardustCollection: -1 }, { auth });
    await expect(POST(`${draftPath(ID)}/draftActivate`, {}, { auth })).rejects.toMatchObject({ status: 400 });

    const draft = await GET(draftPath(ID), { auth });

    expect(draft.data).toMatchObject({ ID, IsActiveEntity: false, stardustCollection: -1 });
  });
});
