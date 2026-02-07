/**
 * BMD SQL Service Client - Placeholder
 *
 * This module will provide connectivity to BMD's SQL Service
 * for direct database queries once the integration is configured.
 *
 * Future implementation:
 * - Connect to BMD SQL Service endpoint
 * - Fetch booking data directly
 * - Replace CSV import with direct integration
 */

export interface BmdConfig {
  endpoint: string;
  username: string;
  password: string;
  database: string;
}

export function getBmdConfig(): BmdConfig {
  return {
    endpoint: process.env.BMD_ENDPOINT || "",
    username: process.env.BMD_USERNAME || "",
    password: process.env.BMD_PASSWORD || "",
    database: process.env.BMD_DATABASE || "",
  };
}

export function isBmdConfigured(): boolean {
  const config = getBmdConfig();
  return !!(config.endpoint && config.username && config.password);
}
