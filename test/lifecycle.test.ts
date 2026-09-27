import cds from "@sap/cds";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const { DELETE, PATCH, POST } = cds.test(__dirname + "/..");
const servicePath = "/odata/v4/galactic";
const earthAuth = { username: "earth-user", password: "earth-demo" };
const planetlessAuth = { username: "planetless-user", password: "planetless-demo" };
const explorationDepartment = "10000000-0000-4000-8000-000000000001";
const engineeringDepartment = "10000000-0000-4000-8000-000000000002";
const explorerPosition = "20000000-0000-4000-8000-000000000001";
const unknownReference = "90000000-0000-4000-8000-000000000001";

const activePath = (ID: string) => `${servicePath}/Spacefarers(ID=${ID},IsActiveEntity=true)`;
const draftPath = (ID: string) => `${servicePath}/Spacefarers(ID=${ID},IsActiveEntity=false)`;

const candidate = (ID: string) => ({
  ID,
  firstName: "Nova",
  lastName: "Starlight",
  email: `nova.${ID.at(-1)}@galactic.example`,
});

const createActiveSpacefarer = (ID: string, data: Record<string, unknown> = {}) =>
  POST(`${servicePath}/Spacefarers`, { ...candidate(ID), IsActiveEntity: true, ...data }, { auth: earthAuth });

const createDraftSpacefarer = (ID: string, data: Record<string, unknown> = {}, auth = earthAuth) =>
  POST(`${servicePath}/Spacefarers`, { ID, ...data }, { auth });

const editActiveSpacefarer = (ID: string) => POST(`${activePath(ID)}/draftEdit`, { PreserveChanges: false }, { auth: earthAuth });

describe("Spacefarer lifecycle", () => {
  let ID: string;
  let sequence = 0;

  beforeEach(() => {
    sequence += 1;
    ID = `60000000-0000-4000-8000-${sequence.toString().padStart(12, "0")}`;
  });

  afterEach(async () => {
    await DELETE(draftPath(ID), { auth: earthAuth }).catch(() => undefined);
    await DELETE(activePath(ID), { auth: earthAuth }).catch(() => undefined);
  });

  describe("active creation", () => {
    it("derives the planet and applies deterministic numeric defaults", async () => {
      const created = await POST(`${servicePath}/Spacefarers`, { ...candidate(ID), IsActiveEntity: true }, { auth: earthAuth });

      expect(created.data).toMatchObject({
        ID,
        IsActiveEntity: true,
        originPlanet: "Earth",
        stardustCollection: 0,
        wormholeNavigationSkill: 1,
      });
    });

    it("preserves explicit zero numeric values", async () => {
      const created = await POST(
        `${servicePath}/Spacefarers`,
        { ...candidate(ID), IsActiveEntity: true, stardustCollection: 0, wormholeNavigationSkill: 0 },
        { auth: earthAuth },
      );

      expect(created.data).toMatchObject({ stardustCollection: 0, wormholeNavigationSkill: 0 });
    });

    it("replaces a null planet with the authenticated user's planet", async () => {
      const created = await createActiveSpacefarer(ID, { originPlanet: null });

      expect(created.data).toMatchObject({ originPlanet: "Earth" });
    });

    it("rejects a planet that conflicts with the authenticated user", async () => {
      await expect(
        POST(`${servicePath}/Spacefarers`, { ...candidate(ID), IsActiveEntity: true, originPlanet: "Mars" }, { auth: earthAuth }),
      ).rejects.toMatchObject({ status: 403 });
    });

    it("rejects a user without a planet attribute", async () => {
      await expect(POST(`${servicePath}/Spacefarers`, { ...candidate(ID), IsActiveEntity: true }, { auth: planetlessAuth })).rejects.toMatchObject({
        status: 403,
      });
    });

    it.each(["firstName", "lastName", "email"])("rejects a missing %s", async (field) => {
      const data: Record<string, unknown> = { ...candidate(ID), IsActiveEntity: true, originPlanet: "Earth" };
      delete data[field];

      await expect(POST(`${servicePath}/Spacefarers`, data, { auth: earthAuth })).rejects.toMatchObject({ status: 400 });
    });

    it.each([
      { field: "stardustCollection", value: -1 },
      { field: "stardustCollection", value: null },
      { field: "wormholeNavigationSkill", value: -1 },
      { field: "wormholeNavigationSkill", value: 101 },
      { field: "wormholeNavigationSkill", value: null },
    ])("rejects $field value $value", async ({ field, value }) => {
      await expect(
        POST(`${servicePath}/Spacefarers`, { ...candidate(ID), IsActiveEntity: true, originPlanet: "Earth", [field]: value }, { auth: earthAuth }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it.each([
      { reference: "department", data: { department_ID: unknownReference } },
      { reference: "position", data: { department_ID: explorationDepartment, position_ID: unknownReference } },
    ])("rejects an invalid $reference reference", async ({ data }) => {
      await expect(
        POST(`${servicePath}/Spacefarers`, { ...candidate(ID), IsActiveEntity: true, originPlanet: "Earth", ...data }, { auth: earthAuth }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects a position without a department", async () => {
      await expect(
        POST(
          `${servicePath}/Spacefarers`,
          { ...candidate(ID), IsActiveEntity: true, originPlanet: "Earth", position_ID: explorerPosition },
          { auth: earthAuth },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects a position from a different department", async () => {
      await expect(
        POST(
          `${servicePath}/Spacefarers`,
          {
            ...candidate(ID),
            IsActiveEntity: true,
            originPlanet: "Earth",
            department_ID: engineeringDepartment,
            position_ID: explorerPosition,
          },
          { auth: earthAuth },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it.each([{ department_ID: explorationDepartment }, { department_ID: explorationDepartment, position_ID: explorerPosition }])(
      "accepts assignment %#",
      async (assignment) => {
        const created = await POST(
          `${servicePath}/Spacefarers`,
          { ...candidate(ID), IsActiveEntity: true, originPlanet: "Earth", ...assignment },
          { auth: earthAuth },
        );

        expect(created.status).toBe(201);
        expect(created.data).toMatchObject(assignment);
      },
    );
  });

  describe("active updates", () => {
    it("preserves values omitted from a partial update", async () => {
      await createActiveSpacefarer(ID, { stardustCollection: 42, wormholeNavigationSkill: 75 });

      const updated = await PATCH(activePath(ID), { spacesuitColor: "Gold" }, { auth: earthAuth });

      expect(updated.data).toMatchObject({
        originPlanet: "Earth",
        spacesuitColor: "Gold",
        stardustCollection: 42,
        wormholeNavigationSkill: 75,
      });
    });

    it("rejects planet reassignment", async () => {
      await createActiveSpacefarer(ID);

      await expect(PATCH(activePath(ID), { originPlanet: "Mars" }, { auth: earthAuth })).rejects.toMatchObject({ status: 400 });
    });

    it.each(["firstName", "lastName", "email"])("rejects clearing required field %s", async (field) => {
      await createActiveSpacefarer(ID);

      await expect(PATCH(activePath(ID), { [field]: null }, { auth: earthAuth })).rejects.toMatchObject({ status: 400 });
    });

    it("rejects adding a position without a department", async () => {
      await createActiveSpacefarer(ID);

      await expect(PATCH(activePath(ID), { position_ID: explorerPosition }, { auth: earthAuth })).rejects.toMatchObject({ status: 400 });
    });

    it("validates a changed department against the existing position", async () => {
      await createActiveSpacefarer(ID, { department_ID: explorationDepartment, position_ID: explorerPosition });

      await expect(PATCH(activePath(ID), { department_ID: engineeringDepartment }, { auth: earthAuth })).rejects.toMatchObject({
        status: 400,
      });
    });

    it("accepts a position that matches the existing department", async () => {
      await createActiveSpacefarer(ID, { department_ID: explorationDepartment });

      const updated = await PATCH(activePath(ID), { position_ID: explorerPosition }, { auth: earthAuth });

      expect(updated.status).toBe(200);
      expect(updated.data).toMatchObject({ department_ID: explorationDepartment, position_ID: explorerPosition });
    });

    it("allows clearing an existing assignment", async () => {
      await createActiveSpacefarer(ID, { department_ID: explorationDepartment, position_ID: explorerPosition });

      const updated = await PATCH(activePath(ID), { department_ID: null, position_ID: null }, { auth: earthAuth });

      expect(updated.data).toMatchObject({ department_ID: null, position_ID: null });
    });

    it.each([
      { field: "department_ID", value: unknownReference },
      { field: "position_ID", value: unknownReference },
    ])("rejects an invalid updated $field reference", async ({ field, value }) => {
      await createActiveSpacefarer(ID, { department_ID: explorationDepartment });

      await expect(PATCH(activePath(ID), { [field]: value }, { auth: earthAuth })).rejects.toMatchObject({ status: 400 });
    });

    it.each([
      { field: "stardustCollection", value: -1 },
      { field: "stardustCollection", value: null },
      { field: "wormholeNavigationSkill", value: -1 },
      { field: "wormholeNavigationSkill", value: 101 },
      { field: "wormholeNavigationSkill", value: null },
    ])("rejects updated $field value $value", async ({ field, value }) => {
      await createActiveSpacefarer(ID);

      await expect(PATCH(activePath(ID), { [field]: value }, { auth: earthAuth })).rejects.toMatchObject({ status: 400 });
    });
  });

  describe("draft integrity", () => {
    it("assigns the authenticated user's planet to a new draft", async () => {
      const draft = await createDraftSpacefarer(ID);

      expect(draft.status).toBe(201);
      expect(draft.data).toMatchObject({ ID, IsActiveEntity: false, originPlanet: "Earth" });
    });

    it("rejects a conflicting planet on a new draft", async () => {
      await expect(createDraftSpacefarer(ID, { originPlanet: "Mars" })).rejects.toMatchObject({ status: 403 });
    });

    it("rejects draft creation by a user without a planet", async () => {
      await expect(createDraftSpacefarer(ID, {}, planetlessAuth)).rejects.toMatchObject({ status: 403 });
    });

    it("rejects planet reassignment in a draft", async () => {
      await createDraftSpacefarer(ID);

      await expect(PATCH(draftPath(ID), { originPlanet: "Mars" }, { auth: earthAuth })).rejects.toMatchObject({ status: 400 });
    });

    it("allows incomplete drafts before activation", async () => {
      await createDraftSpacefarer(ID);

      const updated = await PATCH(draftPath(ID), { firstName: "Nova" }, { auth: earthAuth });

      expect(updated.status).toBe(200);
      expect(updated.data).toMatchObject({ firstName: "Nova", lastName: null, originPlanet: "Earth" });
    });

    it("rejects an incomplete draft when it is activated", async () => {
      await createDraftSpacefarer(ID);

      await expect(POST(`${draftPath(ID)}/draftActivate`, {}, { auth: earthAuth })).rejects.toMatchObject({ status: 400 });
    });

    it("applies active creation defaults when a draft is activated", async () => {
      await createDraftSpacefarer(ID);
      await PATCH(draftPath(ID), candidate(ID), { auth: earthAuth });

      const activated = await POST(`${draftPath(ID)}/draftActivate`, {}, { auth: earthAuth });

      expect(activated.status).toBe(201);
      expect(activated.data).toMatchObject({
        ID,
        IsActiveEntity: true,
        originPlanet: "Earth",
        stardustCollection: 0,
        wormholeNavigationSkill: 1,
      });
    });

    it("validates the resulting assignment when an edited draft is activated", async () => {
      await createActiveSpacefarer(ID, { department_ID: explorationDepartment, position_ID: explorerPosition });
      await editActiveSpacefarer(ID);
      await PATCH(draftPath(ID), { department_ID: engineeringDepartment }, { auth: earthAuth });

      await expect(POST(`${draftPath(ID)}/draftActivate`, {}, { auth: earthAuth })).rejects.toMatchObject({ status: 400 });
    });
  });
});
