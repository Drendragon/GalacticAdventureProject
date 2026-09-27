// Match the TypeScript loader that the CAP CLI registers for this CommonJS project.
import "tsx/cjs";
import "./notification-test-double";

// Tell CAP to discover TypeScript handlers when tests start it programmatically.
process.env.CDS_TYPESCRIPT = "tsx";

// Backend tests do not serve the Fiori application. Keep its middleware out of
// each isolated CAP test server while leaving normal development startup intact.
process.env.CDS_PLUGIN_UI5_ACTIVE = "false";
