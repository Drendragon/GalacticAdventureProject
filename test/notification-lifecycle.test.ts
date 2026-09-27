import cds from "@sap/cds";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendWelcomeEmail } from "./notification-test-double";

const { DELETE, GET, PATCH, POST } = cds.test(__dirname + "/..");
const servicePath = "/odata/v4/galactic";
const auth = { username: "earth-user", password: "earth-demo" };

const activePath = (ID: string) => `${servicePath}/Spacefarers(ID=${ID},IsActiveEntity=true)`;
const draftPath = (ID: string) => `${servicePath}/Spacefarers(ID=${ID},IsActiveEntity=false)`;
const candidate = (ID: string) => ({
  ID,
  firstName: "Nova",
  lastName: "Starlight",
  email: `nova.${ID.at(-1)}@galactic.example`,
});

describe("welcome notification lifecycle", () => {
  let ID: string;
  let sequence = 0;

  beforeEach(() => {
    sequence += 1;
    ID = `70000000-0000-4000-8000-${sequence.toString().padStart(12, "0")}`;
    sendWelcomeEmail.mockReset().mockResolvedValue();
  });

  afterEach(async () => {
    await DELETE(draftPath(ID), { auth }).catch(() => undefined);
    await DELETE(activePath(ID), { auth }).catch(() => undefined);
  });

  it("sends a welcome email after active creation succeeds", async () => {
    await POST(`${servicePath}/Spacefarers`, { ...candidate(ID), IsActiveEntity: true }, { auth });

    expect(sendWelcomeEmail).toHaveBeenCalledOnce();
    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        ID,
        firstName: "Nova",
        lastName: "Starlight",
        email: `nova.${ID.at(-1)}@galactic.example`,
      }),
    );
  });

  it("does not send a welcome email for draft creation", async () => {
    await POST(`${servicePath}/Spacefarers`, candidate(ID), { auth });

    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("sends a welcome email after a new draft is activated", async () => {
    await POST(`${servicePath}/Spacefarers`, candidate(ID), { auth });

    await POST(`${draftPath(ID)}/draftActivate`, {}, { auth });

    expect(sendWelcomeEmail).toHaveBeenCalledOnce();
  });

  it("does not send a welcome email after an existing Spacefarer is edited", async () => {
    await POST(`${servicePath}/Spacefarers`, { ...candidate(ID), IsActiveEntity: true }, { auth });
    sendWelcomeEmail.mockClear();
    await POST(`${activePath(ID)}/draftEdit`, { PreserveChanges: false }, { auth });
    await PATCH(draftPath(ID), { spacesuitColor: "Violet" }, { auth });

    await POST(`${draftPath(ID)}/draftActivate`, {}, { auth });

    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("does not send a welcome email after a direct active update", async () => {
    await POST(`${servicePath}/Spacefarers`, { ...candidate(ID), IsActiveEntity: true }, { auth });
    sendWelcomeEmail.mockClear();

    await PATCH(activePath(ID), { spacesuitColor: "Violet" }, { auth });

    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("does not send a welcome email when a draft is discarded", async () => {
    await POST(`${servicePath}/Spacefarers`, candidate(ID), { auth });

    await DELETE(draftPath(ID), { auth });

    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("does not send a welcome email when draft activation fails", async () => {
    await POST(`${servicePath}/Spacefarers`, { ID }, { auth });

    await expect(POST(`${draftPath(ID)}/draftActivate`, {}, { auth })).rejects.toMatchObject({ status: 400 });

    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("does not send a welcome email when creation validation fails", async () => {
    await expect(POST(`${servicePath}/Spacefarers`, { ID, IsActiveEntity: true }, { auth })).rejects.toMatchObject({ status: 400 });

    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("does not send a welcome email when an atomic batch is rolled back", async () => {
    const invalidID = ID.replace("70000000", "71000000");

    const response = await POST(
      `${servicePath}/$batch`,
      {
        requests: [
          {
            id: "create-valid",
            method: "POST",
            url: "Spacefarers",
            headers: { "content-type": "application/json" },
            body: { ...candidate(ID), IsActiveEntity: true },
            atomicityGroup: "creation",
          },
          {
            id: "create-invalid",
            method: "POST",
            url: "Spacefarers",
            headers: { "content-type": "application/json" },
            body: { ID: invalidID, IsActiveEntity: true },
            atomicityGroup: "creation",
          },
        ],
      },
      { auth },
    );

    expect(response.status).toBe(200);
    await expect(GET(activePath(ID), { auth })).rejects.toMatchObject({ status: 404 });
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("preserves the created Spacefarer when email delivery fails", async () => {
    sendWelcomeEmail.mockRejectedValueOnce(new Error("SMTP unavailable"));
    const logError = vi.spyOn(cds.log("galactic-notifications"), "error").mockImplementation(() => undefined);

    try {
      const created = await POST(`${servicePath}/Spacefarers`, { ...candidate(ID), IsActiveEntity: true }, { auth });
      const persisted = await GET(activePath(ID), { auth });

      expect(created.status).toBe(201);
      expect(persisted.data).toMatchObject({ ID, email: candidate(ID).email });
      expect(logError).toHaveBeenCalledOnce();
    } finally {
      logError.mockRestore();
    }
  });
});
