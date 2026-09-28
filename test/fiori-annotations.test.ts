import { readFile } from "node:fs/promises";
import path from "node:path";

import cds from "@sap/cds";
import { describe, expect, it } from "vitest";

type AnnotationRecord = Record<string, unknown>;
type FioriManifest = {
  "sap.ui5": {
    routing: {
      targets: {
        SpacefarersList: {
          options: {
            settings: {
              controlConfiguration: Record<string, { tableSettings: { threshold?: number } }>;
            };
          };
        };
      };
    };
  };
};

const spacefarerDefinition = async (): Promise<AnnotationRecord> => {
  const model = await cds.load("*");
  return model.definitions?.["GalacticService.Spacefarers"] as unknown as AnnotationRecord;
};

describe("Fiori List Report annotations", () => {
  it("configures a five-row List Report loading threshold", async () => {
    const source = await readFile(path.join(__dirname, "../app/spacefarer/webapp/manifest.json"), "utf8");
    const manifest = JSON.parse(source) as FioriManifest;
    const lineItem =
      manifest["sap.ui5"].routing.targets.SpacefarersList.options.settings.controlConfiguration["@com.sap.vocabularies.UI.v1.LineItem"];

    expect(lineItem.tableSettings.threshold).toBe(5);
  });

  it("exposes a calculated full name", async () => {
    const spacefarers = await spacefarerDefinition();
    const elements = spacefarers.elements as Record<string, AnnotationRecord>;

    expect(elements.name).toMatchObject({
      type: "cds.String",
      "@Core.Computed": true,
    });
  });

  it("defines the required List Report columns", async () => {
    const spacefarers = await spacefarerDefinition();
    const lineItems = spacefarers["@UI.LineItem"] as AnnotationRecord[];

    expect(lineItems.map(({ Label }) => Label)).toEqual([
      "{@i18n>name}",
      "{@i18n>originPlanet}",
      "{@i18n>department}",
      "{@i18n>position}",
      "{@i18n>stardustCollection}",
      "{@i18n>wormholeNavigationSkill}",
      "{@i18n>spacesuitColor}",
    ]);
  });

  it("defines the useful List Report filters", async () => {
    const spacefarers = await spacefarerDefinition();

    expect(spacefarers["@UI.SelectionFields"]).toEqual([
      { "=": "originPlanet" },
      { "=": "department_ID" },
      { "=": "position_ID" },
      { "=": "spacesuitColor" },
    ]);
  });

  it.each(["Departments", "Positions"])("provides value help for the %s filter", async (entityName) => {
    const model = await cds.load("*");
    const entity = model.definitions?.[`GalacticService.${entityName}`] as unknown as AnnotationRecord;

    expect(entity["@cds.odata.valuelist"]).toBe(true);
  });

  it.each([
    ["department", "department.name"],
    ["position", "position.name"],
  ])("uses the %s name as filter text", async (associationName, textPath) => {
    const spacefarers = await spacefarerDefinition();
    const elements = spacefarers.elements as Record<string, AnnotationRecord>;

    expect(elements[associationName]["@Common.Text"]).toEqual({ "=": textPath });
  });
});
