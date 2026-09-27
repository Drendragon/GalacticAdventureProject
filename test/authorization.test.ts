import cds from "@sap/cds";
import { describe, expect, it } from "vitest";

const { GET } = cds.test(__dirname + "/..");
const servicePath = "/odata/v4/galactic";

describe("GalacticService authorization", () => {
  it("rejects anonymous access", async () => {
    await expect(GET(`${servicePath}/Spacefarers?$top=1`)).rejects.toMatchObject({ status: 401 });
  });

  it("rejects an unconfigured username", async () => {
    await expect(
      GET(`${servicePath}/Spacefarers?$top=1`, {
        auth: { username: "unknown-user", password: "anything" },
      }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("rejects an authenticated user without the SpacefarerUser role", async () => {
    await expect(
      GET(`${servicePath}/Spacefarers?$top=1`, {
        auth: { username: "roleless-user", password: "roleless-demo" },
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
