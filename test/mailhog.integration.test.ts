import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createNotificationService } from "../srv/services/notification-service";

type MailHogMessage = {
  Content: {
    Body: string;
    Headers: Record<string, string[]>;
  };
};

type MailHogSearchResult = {
  items: MailHogMessage[];
};

const mailHogApi = process.env.MAILHOG_API_URL ?? "http://127.0.0.1:8025";

describe("MailHog integration", () => {
  it("captures a real welcome email", async () => {
    const recipient = `mailhog-${randomUUID()}@galactic.example`;
    const notificationService = createNotificationService({
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "1025",
      SMTP_SECURE: "false",
    });

    await notificationService.sendWelcomeEmail({ firstName: "Integration", lastName: "Voyager", email: recipient });

    const response = await fetch(`${mailHogApi}/api/v2/search?kind=to&query=${encodeURIComponent(recipient)}`);
    expect(response.ok).toBe(true);
    const searchResult = (await response.json()) as MailHogSearchResult;
    const message = searchResult.items.find((item) => item.Content.Headers.To?.includes(recipient));

    expect(message?.Content.Headers.Subject).toContain("Welcome to the Galactic Spacefarer Adventure");
    expect(message?.Content.Body).toContain("Welcome aboard, Integration Voyager.");
  });
});
