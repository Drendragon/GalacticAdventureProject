import cds from "@sap/cds";
import { describe, expect, it } from "vitest";

cds.test(__dirname + "/..");

type DepartmentSeed = { ID: string; name: string };
type PositionSeed = { ID: string; name: string; department_ID: string };
type PositionReference = Pick<PositionSeed, "ID" | "department_ID">;
type SpacefarerSeed = {
  originPlanet: string;
  stardustCollection: number;
  wormholeNavigationSkill: number;
  department_ID: string | null;
  position_ID: string | null;
};

describe("seed data", () => {
  it("loads meaningful Department and Position catalogs", async () => {
    const { Departments, Positions } = cds.entities("galactic.spacefarers");
    const departments = (await cds.db.run(SELECT.from(Departments).columns("ID", "name"))) as DepartmentSeed[];
    const positions = (await cds.db.run(SELECT.from(Positions).columns("ID", "name", "department_ID"))) as PositionSeed[];
    const departmentIDs = new Set(departments.map(({ ID }) => ID));

    expect(departments.map(({ name }) => name)).toEqual(expect.arrayContaining(["Exploration", "Engineering", "Science", "Navigation", "Logistics"]));
    expect(positions).toHaveLength(8);
    expect(positions.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "Explorer",
        "Mission Commander",
        "Engineer",
        "Systems Architect",
        "Scientist",
        "Xenobiologist",
        "Navigator",
        "Cargo Specialist",
      ]),
    );
    expect(positions.every(({ department_ID }) => departmentIDs.has(department_ID))).toBe(true);
  });

  it("loads valid Spacefarers for planet-scoped pagination", async () => {
    const { Positions, Spacefarers } = cds.entities("galactic.spacefarers");
    const spacefarers = (await cds.db.run(
      SELECT.from(Spacefarers).columns("originPlanet", "stardustCollection", "wormholeNavigationSkill", "department_ID", "position_ID"),
    )) as SpacefarerSeed[];
    const positions = (await cds.db.run(SELECT.from(Positions).columns("ID", "department_ID"))) as PositionReference[];
    const positionDepartments = new Map(positions.map(({ ID, department_ID }) => [ID, department_ID]));
    const recordsFor = (planet: string) => spacefarers.filter(({ originPlanet }) => originPlanet === planet);

    expect(spacefarers).toHaveLength(16);
    expect(recordsFor("Earth").length).toBeGreaterThan(5);
    expect(recordsFor("Mars").length).toBeGreaterThan(5);
    expect(new Set(spacefarers.map(({ originPlanet }) => originPlanet))).toEqual(
      new Set(["Earth", "Mars", "Europa", "Titan", "Kepler-186f", "Proxima Centauri b"]),
    );
    expect(
      spacefarers.every(
        ({ stardustCollection, wormholeNavigationSkill }) =>
          stardustCollection >= 0 && wormholeNavigationSkill >= 0 && wormholeNavigationSkill <= 100,
      ),
    ).toBe(true);
    expect(spacefarers).toContainEqual(expect.objectContaining({ department_ID: null, position_ID: null }));
    expect(spacefarers).toContainEqual(expect.objectContaining({ department_ID: expect.any(String), position_ID: null }));
    expect(
      spacefarers.every(({ department_ID, position_ID }) => position_ID === null || positionDepartments.get(position_ID) === department_ID),
    ).toBe(true);
  });
});
