import { Context, Next } from "hono";
import { env } from "hono/adapter";

export interface PackIdGuardOptions {
  envVarName?: string;
  headerNames?: string[];
}

export function createPackIdGuard(options: PackIdGuardOptions = {}) {
  const config = {
    envVarName: "ALLOWED_PACK_IDS",
    headerNames: ["X-Pack-ID", "packID", "x-pack-id", "packid"],
    ...options,
  };

  return async function packIdGuard(c: Context, next: Next) {
    // Get environment variables
    const envConfig = env<Record<string, string>>(c);
    const allowedPackIdsStr = envConfig[config.envVarName];

    if (!allowedPackIdsStr) {
      console.error(`Missing environment variable: ${config.envVarName}`);
      return c.json({ error: "Server configuration error" }, 500);
    }

    const allowedPackIDs = allowedPackIdsStr.split(",").map((id) => id.trim());

    // Check headers
    let packID: string | undefined;
    for (const headerName of config.headerNames) {
      packID = c.req.header(headerName);
      if (packID) break;
    }

    // Note: We skip checking the body to avoid consuming the stream for the proxy.
    // Clients must provide the Pack ID in the headers.

    if (!packID) {
        return c.json({ code: 401, message: "Unauthorized: Missing Pack ID in headers" }, 401);
    }

    if (!allowedPackIDs.includes(packID)) {
      return c.json({ code: 401, message: "Unauthorized: Invalid Pack ID" }, 401);
    }

    await next();
  };
}
