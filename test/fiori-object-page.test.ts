import cds from "@sap/cds";
import { describe, expect, it } from "vitest";

type AnnotationRecord = Record<string, unknown>;

const spacefarerDefinition = async (): Promise<AnnotationRecord> => {
  const model = await cds.load("*");
  return model.definitions?.["GalacticService.Spacefarers"] as unknown as AnnotationRecord;
};

const annotationLabels = (annotation: unknown): unknown[] => (annotation as AnnotationRecord[]).map(({ Label }) => Label);

describe("Fiori Object Page annotations", () => {
  it("defines the General Information and Spacefaring Statistics sections", async () => {
    const spacefarers = await spacefarerDefinition();
    const facets = spacefarers["@UI.Facets"] as AnnotationRecord[];

    expect(facets).toMatchObject([
      { Label: "{@i18n>generalInformation}", Target: "@UI.FieldGroup#GeneralInformation" },
      { Label: "{@i18n>spacefaringStatistics}", Target: "@UI.FieldGroup#SpacefaringStatistics" },
    ]);
  });

  it("defines the General Information fields", async () => {
    const spacefarers = await spacefarerDefinition();
    const fields = spacefarers["@UI.FieldGroup#GeneralInformation.Data"];

    expect(annotationLabels(fields)).toEqual([
      "{@i18n>firstName}",
      "{@i18n>lastName}",
      "{@i18n>email}",
      "{@i18n>originPlanet}",
      "{@i18n>department}",
      "{@i18n>position}",
    ]);
  });

  it("defines the Spacefaring Statistics fields", async () => {
    const spacefarers = await spacefarerDefinition();
    const fields = spacefarers["@UI.FieldGroup#SpacefaringStatistics.Data"];

    expect(annotationLabels(fields)).toEqual(["{@i18n>stardustCollection}", "{@i18n>wormholeNavigationSkill}", "{@i18n>spacesuitColor}"]);
  });

  it("keeps the backend-assigned origin planet read-only", async () => {
    const spacefarers = await spacefarerDefinition();
    const elements = spacefarers.elements as Record<string, AnnotationRecord>;

    expect(elements.originPlanet["@UI.FieldControl"]).toEqual({ "#": "ReadOnly" });
  });

  it.each(["stardustCollection", "spacesuitColor"])("keeps %s editable", async (fieldName) => {
    const spacefarers = await spacefarerDefinition();
    const elements = spacefarers.elements as Record<string, AnnotationRecord>;

    expect(elements[fieldName]["@readonly"]).not.toBe(true);
  });
});
