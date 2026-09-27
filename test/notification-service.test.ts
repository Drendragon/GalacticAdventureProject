import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { describe, expect, it, vi } from "vitest";

import { createNotificationService, type MailTransport } from "../srv/services/notification-service";

const candidate = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@galactic.example",
};

describe("notification service", () => {
  it("sends the welcome message to the created spacefarer", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "welcome-1" });
    const transport: MailTransport = { sendMail };
    const service = createNotificationService({}, () => transport);

    await service.sendWelcomeEmail(candidate);

    expect(sendMail).toHaveBeenCalledWith({
      from: "Galactic Recruitment <recruitment@galactic.example>",
      to: "jane.doe@galactic.example",
      subject: "Welcome to the Galactic Spacefarer Adventure",
      text: "Welcome aboard, Jane Doe.\nYour Galactic Spacefarer adventure has begun.",
    });
  });

  it("configures SMTP credentials and bounded timeouts from the environment", () => {
    let options: SMTPTransport.Options | undefined;
    const transport: MailTransport = { sendMail: vi.fn() };
    const transportFactory = (received: SMTPTransport.Options) => {
      options = received;
      return transport;
    };

    createNotificationService(
      {
        SMTP_HOST: "smtp.galactic.example",
        SMTP_PORT: "2465",
        SMTP_SECURE: "true",
        SMTP_USER: "recruitment",
        SMTP_PASSWORD: "secret",
        SMTP_CONNECTION_TIMEOUT_MS: "3000",
        SMTP_GREETING_TIMEOUT_MS: "4000",
        SMTP_SOCKET_TIMEOUT_MS: "9000",
      },
      transportFactory,
    );

    expect(options).toEqual({
      host: "smtp.galactic.example",
      port: 2465,
      secure: true,
      auth: { user: "recruitment", pass: "secret" },
      connectionTimeout: 3000,
      greetingTimeout: 4000,
      socketTimeout: 9000,
    });
  });

  it("omits SMTP authentication when credentials are not configured", () => {
    let options: SMTPTransport.Options | undefined;
    const transport: MailTransport = { sendMail: vi.fn() };

    createNotificationService({}, (received) => {
      options = received;
      return transport;
    });

    expect(options).not.toHaveProperty("auth");
  });

  it("rejects incomplete SMTP credentials", () => {
    expect(() => createNotificationService({ SMTP_USER: "recruitment" }, () => ({ sendMail: vi.fn() }))).toThrow(
      "SMTP_USER and SMTP_PASSWORD must be configured together",
    );
  });
});
