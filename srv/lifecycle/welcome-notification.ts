import cds, { type Request } from "@sap/cds";

import { notificationService, type WelcomeEmailRecipient } from "../services/notification-service";

const LOG = cds.log("galactic-notifications");

export function scheduleWelcomeNotification(spacefarer: WelcomeEmailRecipient, request: Request): void {
  request.on("succeeded", async () => {
    try {
      await notificationService.sendWelcomeEmail(spacefarer);
    } catch (error) {
      LOG.error("Welcome email delivery failed", error);
    }
  });
}
