import "tsx/cjs";

import { createRequire } from "node:module";
import { vi } from "vitest";

import type { NotificationService } from "../srv/services/notification-service";

const commonJsRequire = createRequire(__filename);
const serviceModule = commonJsRequire("../srv/services/notification-service.ts") as {
  notificationService: NotificationService;
};

// CAP loads service implementations through CommonJS, so spy on that same module instance.
export const sendWelcomeEmail = vi.spyOn(serviceModule.notificationService, "sendWelcomeEmail").mockResolvedValue();
