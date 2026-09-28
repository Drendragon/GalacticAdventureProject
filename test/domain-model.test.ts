import cds from "@sap/cds";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

cds.test(__dirname + "/..");

const validSpacefarer = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  ID: randomUUID(),
  firstName: "Ada",
  lastName: "Astra",
  email: "ada@example.test",
  originPlanet: "Earth",
  ...overrides,
});

describe("domain model", () => {
  it("defines the three galactic entities and the Spacefarer fields", async () => {
    const model = await cds.load("*");
    const definitions = model.definitions ?? {};
    const spacefarers = definitions["galactic.spacefarers.Spacefarers"];

    expect(definitions).toHaveProperty("galactic.spacefarers.Departments");
    expect(definitions).toHaveProperty("galactic.spacefarers.Positions");
    expect(spacefarers).toBeDefined();
    expect(Object.keys(spacefarers.elements ?? {})).toEqual(
      expect.arrayContaining([
        "ID",
        "firstName",
        "lastName",
        "email",
        "originPlanet",
        "spacesuitColor",
        "stardustCollection",
        "wormholeNavigationSkill",
        "department",
        "position",
        "createdAt",
        "createdBy",
        "modifiedAt",
        "modifiedBy",
      ]),
    );
  });

  it("applies the numeric defaults when values are omitted", async () => {
    const { Spacefarers } = cds.entities("galactic.spacefarers");
    const ID = "10000000-0000-4000-8000-000000000001";

    await cds.db.run(INSERT.into(Spacefarers).entries(validSpacefarer({ ID })));

    const spacefarer = await cds.db.run(SELECT.one.from(Spacefarers).where({ ID }));

    expect(spacefarer).toMatchObject({
      stardustCollection: 0,
      wormholeNavigationSkill: 1,
    });
  });

  it.each(["firstName", "lastName", "email", "originPlanet"])("requires %s on persisted Spacefarers", async (requiredField) => {
    const { Spacefarers } = cds.entities("galactic.spacefarers");
    const candidate = validSpacefarer();
    delete candidate[requiredField];

    await expect(cds.db.run(INSERT.into(Spacefarers).entries(candidate))).rejects.toThrow();
  });

  it("declares the numeric ranges for CAP service validation", async () => {
    const model = await cds.load("*");
    const elements = model.definitions?.["galactic.spacefarers.Spacefarers"].elements ?? {};

    expect(elements.stardustCollection["@assert.range"]).toEqual([0, { "=": "_" }]);
    expect(elements.wormholeNavigationSkill["@assert.range"]).toEqual([0, 100]);
  });

  it("declares user-facing service validation in CDS", async () => {
    const model = await cds.load("*");
    const elements = model.definitions?.["GalacticService.Spacefarers"].elements ?? {};

    expect(elements.firstName).toMatchObject({
      "@mandatory": true,
      "@mandatory.message": "First name is required.",
    });
    expect(elements.lastName).toMatchObject({
      "@mandatory": true,
      "@mandatory.message": "Last name is required.",
    });
    expect(elements.email).toMatchObject({
      "@mandatory": true,
      "@mandatory.message": "Email is required.",
    });
    expect(elements.stardustCollection["@assert.range.message"]).toBe("Stardust collection cannot be negative.");
    expect(elements.wormholeNavigationSkill["@assert.range.message"]).toBe("Navigation skill must be between 0 and 100.");
  });

  it.each(["stardustCollection", "wormholeNavigationSkill"])("rejects an explicit null for %s", async (numericField) => {
    const { Spacefarers } = cds.entities("galactic.spacefarers");
    const candidate = validSpacefarer({ [numericField]: null });

    await expect(cds.db.run(INSERT.into(Spacefarers).entries(candidate))).rejects.toThrow();
  });

  it("declares association targets and reference validation", async () => {
    const model = await cds.load("*");
    const definitions = model.definitions ?? {};
    const positions = definitions["galactic.spacefarers.Positions"].elements ?? {};
    const spacefarers = definitions["galactic.spacefarers.Spacefarers"].elements ?? {};

    expect(positions.department).toMatchObject({
      target: "galactic.spacefarers.Departments",
      "@assert.target": true,
    });
    expect(spacefarers.department).toMatchObject({
      target: "galactic.spacefarers.Departments",
      "@assert.target": true,
    });
    expect(spacefarers.position).toMatchObject({
      target: "galactic.spacefarers.Positions",
      "@assert.target": true,
    });
  });

  it("requires every persisted Position to belong to a Department", async () => {
    const { Positions } = cds.entities("galactic.spacefarers");

    await expect(
      cds.db.run(
        INSERT.into(Positions).entries({
          ID: randomUUID(),
          name: "Navigator",
        }),
      ),
    ).rejects.toThrow();
  });

  it("navigates from a Spacefarer to its Department and Position", async () => {
    const { Departments, Positions, Spacefarers } = cds.entities("galactic.spacefarers");
    const departmentID = randomUUID();
    const positionID = randomUUID();
    const spacefarerID = randomUUID();

    await cds.db.run(INSERT.into(Departments).entries({ ID: departmentID, name: "Navigation" }));
    await cds.db.run(
      INSERT.into(Positions).entries({
        ID: positionID,
        name: "Wormhole Navigator",
        department_ID: departmentID,
      }),
    );
    await cds.db.run(
      INSERT.into(Spacefarers).entries(
        validSpacefarer({
          ID: spacefarerID,
          department_ID: departmentID,
          position_ID: positionID,
        }),
      ),
    );

    const spacefarer = await cds.db.run(
      SELECT.one
        .from(Spacefarers)
        .columns("firstName", { ref: ["department"], expand: [{ ref: ["name"] }] }, { ref: ["position"], expand: [{ ref: ["name"] }] })
        .where({ ID: spacefarerID }),
    );

    expect(spacefarer).toMatchObject({
      firstName: "Ada",
      department: { name: "Navigation" },
      position: { name: "Wormhole Navigator" },
    });
  });
});
