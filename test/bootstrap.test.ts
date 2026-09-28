import cds from "@sap/cds";
import { describe, expect, it } from "vitest";

const { GET } = cds.test(__dirname + "/..");

describe("CAP bootstrap", () => {
  it("serves the development landing page", async () => {
    const { status, data } = await GET("/");
    expect(status).toBe(200);
    expect(data).toMatch(/\/odata\/v4\/galactic/);
  });

  it("connects to a working local SQLite database", async () => {
    const db = await cds.connect.to("db");
    const [row] = await db.run("SELECT sqlite_version() AS version");
    expect(row.version).toMatch(/^3\./);
  });

  it("serves OData metadata to a configured demo user", async () => {
    const { status, data } = await GET("/odata/v4/galactic/$metadata", {
      auth: { username: "earth-user", password: "earth-demo" },
    });
    expect(status).toBe(200);
    expect(data).toMatch(/GalacticService/);
  });

  it("preserves frontend translation bindings in OData metadata", async () => {
    const { data } = await GET("/odata/v4/galactic/$metadata", {
      auth: { username: "earth-user", password: "earth-demo" },
    });

    expect(data).toContain('PropertyValue Property="Label" String="{@i18n>name}"');
  });
});
