import { readFile } from "node:fs/promises";
import path from "node:path";

import cds from "@sap/cds";
import { beforeAll, describe, expect, it } from "vitest";

type AnnotationRecord = Record<string, unknown>;
type LoadedModel = { definitions?: Record<string, unknown> };

describe("Fiori user-experience annotations", () => {
  let model: LoadedModel;
  let translations: Record<string, string>;

  beforeAll(async () => {
    model = (await cds.load("*")) as unknown as LoadedModel;
    const bundle = await readFile(path.join(__dirname, "../app/spacefarer/webapp/i18n/i18n.properties"), "utf8");
    translations = Object.fromEntries(
      bundle
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const [key, ...value] = line.split("=");
          return [key, value.join("=")];
        }),
    );
  });

  it.each([
    ["Spacefarers", "spacefarer", "Spacefarer"],
    ["Departments", "department", "Department"],
    ["Positions", "position", "Position"],
  ])("labels the %s entity", (entityName, translationKey, label) => {
    const entity = model.definitions?.[`GalacticService.${entityName}`] as unknown as AnnotationRecord;

    expect(entity["@title"]).toBe(`{@i18n>${translationKey}}`);
    expect(translations[translationKey]).toBe(label);
  });

  it.each([
    ["firstName", "firstName", "First Name"],
    ["lastName", "lastName", "Last Name"],
    ["name", "name", "Name"],
    ["email", "email", "Email"],
    ["originPlanet", "originPlanet", "Origin Planet"],
    ["department", "department", "Department"],
    ["position", "position", "Position"],
    ["stardustCollection", "stardustCollection", "Stardust Collection"],
    ["wormholeNavigationSkill", "wormholeNavigationSkill", "Wormhole Navigation Skill"],
    ["spacesuitColor", "spacesuitColor", "Spacesuit Color"],
  ])("labels the %s property", (propertyName, translationKey, label) => {
    const entity = model.definitions?.["GalacticService.Spacefarers"] as unknown as AnnotationRecord;
    const elements = entity.elements as Record<string, AnnotationRecord>;

    expect(elements[propertyName]["@title"]).toBe(`{@i18n>${translationKey}}`);
    expect(translations[translationKey]).toBe(label);
  });

  it("identifies the email property semantically", () => {
    const entity = model.definitions?.["GalacticService.Spacefarers"] as unknown as AnnotationRecord;
    const elements = entity.elements as Record<string, AnnotationRecord>;

    expect(elements.email["@Communication.IsEmailAddress"]).toBe(true);
  });

  it("starts UI5 in English", async () => {
    const index = await readFile(path.join(__dirname, "../app/spacefarer/webapp/index.html"), "utf8");

    expect(index).toContain('data-sap-ui-language="en"');
  });
});
