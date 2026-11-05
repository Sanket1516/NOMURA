import "server-only";

/**
 * Server configuration from environment variables. No secret has a default.
 * When OIDC or the API is not configured, the app runs in sample-data preview mode only.
 */
export const config = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.API_URL ?? "", // internal URL of the FastAPI service, e.g. http://api:8000
  oidc: {
    issuer: process.env.OIDC_ISSUER ?? "", // internal issuer URL used for token calls
    publicIssuer: process.env.OIDC_PUBLIC_ISSUER ?? process.env.OIDC_ISSUER ?? "", // browser-facing issuer URL
    clientId: process.env.OIDC_CLIENT_ID ?? "",
    clientSecret: process.env.OIDC_CLIENT_SECRET ?? "",
  },
  previewEnabled: (process.env.PREVIEW_MODE ?? "on") !== "off",
};

export const liveEnabled = () => Boolean(config.apiUrl && config.oidc.issuer && config.oidc.clientId && config.oidc.clientSecret);
