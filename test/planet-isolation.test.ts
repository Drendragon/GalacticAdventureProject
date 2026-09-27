import cds from "@sap/cds";
import { afterEach, describe, expect, it } from "vitest";

const { DELETE, GET, PATCH, POST } = cds.test(__dirname + "/..");
const servicePath = "/odata/v4/galactic";
const earthAuth = { username: "earth-user", password: "earth-demo" };
const marsAuth = { username: "mars-user", password: "mars-demo" };
const planetlessAuth = { username: "planetless-user", password: "planetless-demo" };
const earthID = "30000000-0000-4000-8000-000000000001";
const marsID = "30000000-0000-4000-8000-000000000007";
const draftID = "80000000-0000-4000-8000-000000000001";

const activePath = (ID: string) => `${servicePath}/Spacefarers(ID=${ID},IsActiveEntity=true)`;
const draftPath = (ID: string) => `${servicePath}/Spacefarers(ID=${ID},IsActiveEntity=false)`;

describe("planet-level Spacefarer isolation", () => {
  afterEach(async () => {
    await DELETE(draftPath(draftID), { auth: earthAuth }).catch(() => undefined);
    await DELETE(draftPath(marsID), { auth: marsAuth }).catch(() => undefined);
  });

  it("limits the Earth collection and count to Earth Spacefarers", async () => {
    const response = await GET(`${servicePath}/Spacefarers?$count=true&$select=originPlanet`, { auth: earthAuth });

    expect(response.data["@odata.count"]).toBe(6);
    expect(response.data.value).toHaveLength(6);
    expect(response.data.value).toEqual(expect.arrayContaining([expect.objectContaining({ originPlanet: "Earth" })]));
    expect(response.data.value.every((spacefarer: { originPlanet: string }) => spacefarer.originPlanet === "Earth")).toBe(true);
  });

  it("limits the Mars collection and count to Mars Spacefarers", async () => {
    const response = await GET(`${servicePath}/Spacefarers?$count=true&$select=originPlanet`, { auth: marsAuth });

    expect(response.data["@odata.count"]).toBe(6);
    expect(response.data.value).toHaveLength(6);
    expect(response.data.value.every((spacefarer: { originPlanet: string }) => spacefarer.originPlanet === "Mars")).toBe(true);
  });

  it("hides a Mars active record from the Earth user", async () => {
    await expect(GET(activePath(marsID), { auth: earthAuth })).rejects.toMatchObject({ status: 404 });
  });

  it("hides an Earth active record from the Mars user", async () => {
    await expect(GET(activePath(earthID), { auth: marsAuth })).rejects.toMatchObject({ status: 404 });
  });

  it("prevents the Earth user from updating a Mars record", async () => {
    await expect(PATCH(activePath(marsID), { spacesuitColor: "Azure" }, { auth: earthAuth })).rejects.toMatchObject({ status: 403 });
  });

  it("prevents the Earth user from deleting a Mars record", async () => {
    await expect(DELETE(activePath(marsID), { auth: earthAuth })).rejects.toMatchObject({ status: 403 });
  });

  it("filters expanded Spacefarers before returning associations", async () => {
    const response = await GET(`${servicePath}/Spacefarers?$select=ID,originPlanet&$expand=department,position`, { auth: earthAuth });

    expect(response.data.value).toHaveLength(6);
    expect(response.data.value.every((spacefarer: { originPlanet: string }) => spacefarer.originPlanet === "Earth")).toBe(true);
  });

  it.each(["department", "position"])("blocks %s navigation through a foreign Spacefarer", async (association) => {
    await expect(GET(`${activePath(marsID)}/${association}`, { auth: earthAuth })).rejects.toMatchObject({ status: 404 });
  });

  it.each(["department", "position"])("allows %s navigation through an own-planet Spacefarer", async (association) => {
    const response = await GET(`${activePath(earthID)}/${association}`, { auth: earthAuth });

    expect(response.status).toBe(200);
  });

  it.each([earthAuth, marsAuth])("keeps shared catalogs readable for $username", async (auth) => {
    const departments = await GET(`${servicePath}/Departments?$top=1`, { auth });
    const positions = await GET(`${servicePath}/Positions?$top=1`, { auth });

    expect(departments.status).toBe(200);
    expect(positions.status).toBe(200);
  });

  it("rejects Spacefarer reads when the user has no planet attribute", async () => {
    await expect(GET(`${servicePath}/Spacefarers?$top=1`, { auth: planetlessAuth })).rejects.toMatchObject({ status: 403 });
  });

  it("keeps shared catalogs available to an authorized user without a planet", async () => {
    const response = await GET(`${servicePath}/Departments?$top=1`, { auth: planetlessAuth });

    expect(response.status).toBe(200);
  });

  it("hides an Earth draft from the Mars user", async () => {
    await POST(`${servicePath}/Spacefarers`, { ID: draftID }, { auth: earthAuth });

    await expect(GET(draftPath(draftID), { auth: marsAuth })).rejects.toMatchObject({ status: 404 });
  });

  it("prevents the Earth user from editing a Mars active record as a draft", async () => {
    await expect(POST(`${activePath(marsID)}/draftEdit`, { PreserveChanges: false }, { auth: earthAuth })).rejects.toMatchObject({ status: 403 });
  });

  it.each(["department", "position", "position/department"])("blocks %s navigation through a foreign draft", async (navigation) => {
    await POST(`${activePath(marsID)}/draftEdit`, { PreserveChanges: false }, { auth: marsAuth });

    await expect(GET(`${draftPath(marsID)}/${navigation}`, { auth: earthAuth })).rejects.toMatchObject({ status: 404 });
  });

  it("allows department navigation through an own-planet draft", async () => {
    await POST(`${activePath(marsID)}/draftEdit`, { PreserveChanges: false }, { auth: marsAuth });

    const response = await GET(`${draftPath(marsID)}/department`, { auth: marsAuth });

    expect(response.status).toBe(200);
  });

  it("blocks draft-administration navigation through a foreign draft", async () => {
    await POST(`${activePath(marsID)}/draftEdit`, { PreserveChanges: false }, { auth: marsAuth });

    await expect(GET(`${draftPath(marsID)}/DraftAdministrativeData`, { auth: earthAuth })).rejects.toMatchObject({ status: 404 });
  });

  it("allows draft-administration navigation through an own-planet draft", async () => {
    await POST(`${activePath(marsID)}/draftEdit`, { PreserveChanges: false }, { auth: marsAuth });

    const response = await GET(`${draftPath(marsID)}/DraftAdministrativeData`, { auth: marsAuth });

    expect(response.status).toBe(200);
  });

  it("rejects foreign draft navigation when the user has no planet attribute", async () => {
    await POST(`${activePath(marsID)}/draftEdit`, { PreserveChanges: false }, { auth: marsAuth });

    await expect(GET(`${draftPath(marsID)}/department`, { auth: planetlessAuth })).rejects.toMatchObject({ status: 403 });
  });

  it("enforces planet isolation for each request in a batch", async () => {
    const response = await POST(
      `${servicePath}/$batch`,
      {
        requests: [
          { id: "own", method: "GET", url: `Spacefarers(ID=${earthID},IsActiveEntity=true)` },
          { id: "foreign", method: "GET", url: `Spacefarers(ID=${marsID},IsActiveEntity=true)` },
        ],
      },
      { auth: earthAuth },
    );

    expect(response.status).toBe(200);
    expect(response.data.responses).toEqual([
      expect.objectContaining({ id: "own", status: 200 }),
      expect.objectContaining({ id: "foreign", status: 404 }),
    ]);
  });
});
