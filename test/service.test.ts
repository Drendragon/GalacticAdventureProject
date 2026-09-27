import cds from "@sap/cds";
import { afterEach, describe, expect, it } from "vitest";

const { DELETE, GET, PATCH, POST } = cds.test(__dirname + "/..");
const auth = { username: "earth-user", password: "earth-demo" };
const servicePath = "/odata/v4/galactic";

const spacefarer = (ID: string) => ({
  ID,
  firstName: "Nova",
  lastName: "Starlight",
  email: `nova.${ID.at(-1)}@galactic.example`,
  originPlanet: "Earth",
  spacesuitColor: "Silver",
  stardustCollection: 42,
  wormholeNavigationSkill: 75,
});

const spacefarerPath = (ID: string, isActiveEntity: boolean) => `${servicePath}/Spacefarers(ID=${ID},IsActiveEntity=${isActiveEntity})`;

const createActiveSpacefarer = (ID: string) => POST(`${servicePath}/Spacefarers`, { ...spacefarer(ID), IsActiveEntity: true }, { auth });

const createDraftSpacefarer = (ID: string, data: object = { ID }) => POST(`${servicePath}/Spacefarers`, data, { auth });

const editActiveSpacefarer = (ID: string) => POST(`${spacefarerPath(ID, true)}/draftEdit`, { PreserveChanges: false }, { auth });

describe("GalacticService", () => {
  it.each([
    { entity: "Spacefarers", count: 6 },
    { entity: "Departments", count: 5 },
    { entity: "Positions", count: 8 },
  ])("exposes seeded $entity", async ({ entity, count }) => {
    const { status, data } = await GET(`${servicePath}/${entity}?$count=true&$top=1`, { auth });

    expect(status).toBe(200);
    expect(data["@odata.count"]).toBe(count);
    expect(data.value).toHaveLength(1);
  });

  it.each([
    {
      entity: "Departments",
      data: {
        ID: "40000000-0000-4000-8000-000000000001",
        name: "Unauthorized Department",
      },
    },
    {
      entity: "Positions",
      data: {
        ID: "40000000-0000-4000-8000-000000000002",
        name: "Unauthorized Position",
        department_ID: "10000000-0000-4000-8000-000000000001",
      },
    },
  ])("rejects writes to $entity", async ({ entity, data }) => {
    await expect(POST(`${servicePath}/${entity}`, data, { auth })).rejects.toMatchObject({ status: 405 });
    const entityPath = `${servicePath}/${entity}(ID=${data.ID})`;
    await expect(PATCH(entityPath, { name: "Unauthorized Change" }, { auth })).rejects.toMatchObject({ status: 405 });
    await expect(DELETE(entityPath, { auth })).rejects.toMatchObject({ status: 405 });
  });

  describe("active Spacefarer CRUD", () => {
    const ID = "50000000-0000-4000-8000-000000000001";

    afterEach(async () => {
      await DELETE(spacefarerPath(ID, true), { auth }).catch(() => undefined);
    });

    it("creates an active Spacefarer", async () => {
      const created = await createActiveSpacefarer(ID);

      expect(created.status).toBe(201);
      expect(created.data).toMatchObject({ ID, IsActiveEntity: true, spacesuitColor: "Silver" });
    });

    it("reads an active Spacefarer", async () => {
      await createActiveSpacefarer(ID);

      const read = await GET(spacefarerPath(ID, true), { auth });

      expect(read.status).toBe(200);
      expect(read.data).toMatchObject({ ID, IsActiveEntity: true, spacesuitColor: "Silver" });
    });

    it("updates an active Spacefarer", async () => {
      await createActiveSpacefarer(ID);

      const updated = await PATCH(spacefarerPath(ID, true), { spacesuitColor: "Gold" }, { auth });

      expect(updated.status).toBe(200);
      expect(updated.data).toMatchObject({ ID, IsActiveEntity: true, spacesuitColor: "Gold" });
    });

    it("deletes an active Spacefarer", async () => {
      await createActiveSpacefarer(ID);

      const deleted = await DELETE(spacefarerPath(ID, true), { auth });

      expect(deleted.status).toBe(204);
      await expect(GET(spacefarerPath(ID, true), { auth })).rejects.toMatchObject({ status: 404 });
    });
  });

  describe("Spacefarer drafts", () => {
    const ID = "50000000-0000-4000-8000-000000000002";
    const draftPath = spacefarerPath(ID, false);
    const activePath = spacefarerPath(ID, true);

    afterEach(async () => {
      await DELETE(draftPath, { auth }).catch(() => undefined);
      await DELETE(activePath, { auth }).catch(() => undefined);
    });

    it("creates an incomplete draft", async () => {
      const createdDraft = await createDraftSpacefarer(ID);

      expect(createdDraft.status).toBe(201);
      expect(createdDraft.data).toMatchObject({ ID, IsActiveEntity: false });
    });

    it("updates a draft", async () => {
      await createDraftSpacefarer(ID);

      const updatedDraft = await PATCH(draftPath, spacefarer(ID), { auth });

      expect(updatedDraft.status).toBe(200);
      expect(updatedDraft.data).toMatchObject({ ID, IsActiveEntity: false, spacesuitColor: "Silver" });
    });

    it("activates a new draft", async () => {
      await createDraftSpacefarer(ID, spacefarer(ID));

      const activated = await POST(`${draftPath}/draftActivate`, {}, { auth });

      expect(activated.status).toBe(201);
      expect(activated.data).toMatchObject({ ID, IsActiveEntity: true, spacesuitColor: "Silver" });
    });

    it("creates a draft from an active Spacefarer", async () => {
      await createActiveSpacefarer(ID);

      const editedDraft = await editActiveSpacefarer(ID);

      expect(editedDraft.status).toBe(201);
      expect(editedDraft.data).toMatchObject({ ID, IsActiveEntity: false });
    });

    it("activates an edited draft", async () => {
      await createActiveSpacefarer(ID);
      await editActiveSpacefarer(ID);
      await PATCH(draftPath, { spacesuitColor: "Violet" }, { auth });

      const activatedEdit = await POST(`${draftPath}/draftActivate`, {}, { auth });

      expect(activatedEdit.status).toBe(200);
      expect(activatedEdit.data).toMatchObject({ ID, IsActiveEntity: true, spacesuitColor: "Violet" });
    });

    it("discards an edited draft", async () => {
      await createActiveSpacefarer(ID);
      await editActiveSpacefarer(ID);
      await PATCH(draftPath, { spacesuitColor: "Gold" }, { auth });

      const discarded = await DELETE(draftPath, { auth });

      expect(discarded.status).toBe(204);
      await expect(GET(draftPath, { auth })).rejects.toMatchObject({ status: 404 });
      const unchangedActive = await GET(activePath, { auth });
      expect(unchangedActive.data).toMatchObject({ ID, IsActiveEntity: true, spacesuitColor: "Silver" });
    });
  });
});
