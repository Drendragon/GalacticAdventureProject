// Match the TypeScript loader that the CAP CLI registers for this CommonJS project.
import "tsx/cjs";
import "./notification-test-double";

// Tell CAP to discover TypeScript handlers when tests start it programmatically.
process.env.CDS_TYPESCRIPT = "tsx";
