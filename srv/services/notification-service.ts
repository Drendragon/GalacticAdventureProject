import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const DEFAULT_SENDER = "Galactic Recruitment <recruitment@galactic.example>";
const DEFAULT_CONNECTION_TIMEOUT_MS = 5_000;
const DEFAULT_GREETING_TIMEOUT_MS = 5_000;
const DEFAULT_SOCKET_TIMEOUT_MS = 10_000;

type Environment = Record<string, string | undefined>;

export type WelcomeEmailRecipient = {
  firstName: string;
  lastName: string;
  email: string;
};

export type MailTransport = {
  sendMail(message: Mail.Options): Promise<unknown>;
};

type TransportFactory = (options: SMTPTransport.Options) => MailTransport;

export class NotificationService {
  constructor(
    private readonly transport: MailTransport,
    private readonly sender: string,
  ) {}

  async sendWelcomeEmail(spacefarer: WelcomeEmailRecipient): Promise<void> {
    await this.transport.sendMail({
      from: this.sender,
      to: spacefarer.email,
      subject: "Welcome to the Galactic Spacefarer Adventure",
      text: `Welcome aboard, ${spacefarer.firstName} ${spacefarer.lastName}.\nYour Galactic Spacefarer adventure has begun.`,
    });
  }
}

export function createNotificationService(
  environment: Environment = process.env,
  createTransport: TransportFactory = (options) => nodemailer.createTransport(options),
): NotificationService {
  const transport = createTransport(createTransportOptions(environment));
  return new NotificationService(transport, environment.SMTP_FROM ?? DEFAULT_SENDER);
}

export const notificationService = createNotificationService();

function createTransportOptions(environment: Environment): SMTPTransport.Options {
  const options: SMTPTransport.Options = {
    host: environment.SMTP_HOST ?? "127.0.0.1",
    port: readPositiveInteger(environment, "SMTP_PORT", 1025),
    secure: readBoolean(environment, "SMTP_SECURE", false),
    connectionTimeout: readPositiveInteger(environment, "SMTP_CONNECTION_TIMEOUT_MS", DEFAULT_CONNECTION_TIMEOUT_MS),
    greetingTimeout: readPositiveInteger(environment, "SMTP_GREETING_TIMEOUT_MS", DEFAULT_GREETING_TIMEOUT_MS),
    socketTimeout: readPositiveInteger(environment, "SMTP_SOCKET_TIMEOUT_MS", DEFAULT_SOCKET_TIMEOUT_MS),
  };

  const auth = readAuthentication(environment);
  if (auth) options.auth = auth;

  return options;
}

function readAuthentication(environment: Environment): { user: string; pass: string } | undefined {
  const user = environment.SMTP_USER;
  const password = environment.SMTP_PASSWORD;
  if (!user && !password) return undefined;
  if (!user || !password) throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together");
  return { user, pass: password };
}

function readPositiveInteger(environment: Environment, name: string, fallback: number): number {
  const value = environment[name];
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function readBoolean(environment: Environment, name: string, fallback: boolean): boolean {
  const value = environment[name];
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be true or false`);
}
