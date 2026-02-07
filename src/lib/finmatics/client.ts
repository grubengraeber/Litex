import type {
  FinmaticsAuthResponse,
  FinmaticsConfig,
  FinmaticsDocumentList,
  FinmaticsCompanyList,
} from "./types";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

function getConfig(): FinmaticsConfig {
  const baseUrl = process.env.FINMATICS_BASE_URL || "https://api.finmatics.com";
  const username = process.env.FINMATICS_USERNAME || "";
  const password = process.env.FINMATICS_PASSWORD || "";

  return { baseUrl, username, password };
}

function isConfigured(): boolean {
  const config = getConfig();
  return !!(config.username && config.password);
}

async function authenticate(config: FinmaticsConfig): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiry - 5 * 60 * 1000) {
    return cachedToken;
  }

  const response = await fetch(`${config.baseUrl}/api/v1/token_auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Finmatics auth failed: ${response.status}`);
  }

  const data: FinmaticsAuthResponse = await response.json();
  cachedToken = data.token;
  // Token valid for 1 week, cache for 6 days
  tokenExpiry = Date.now() + 6 * 24 * 60 * 60 * 1000;

  return cachedToken;
}

async function fetchWithAuth(
  url: string,
  config: FinmaticsConfig,
  options: RequestInit = {}
): Promise<Response> {
  const token = await authenticate(config);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `JWT ${token}`,
      "Content-Type": "application/json",
    },
  });

  // If 401, clear cache and retry once
  if (response.status === 401) {
    cachedToken = null;
    tokenExpiry = 0;
    const newToken = await authenticate(config);
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `JWT ${newToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  return response;
}

async function fetchDocuments(
  params: {
    status?: string;
    isExported?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<FinmaticsDocumentList> {
  const config = getConfig();
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set("status", params.status);
  if (params.isExported !== undefined) {
    searchParams.set("is_exported", String(params.isExported));
  }
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));

  const query = searchParams.toString();
  const url = `${config.baseUrl}/api/v1/documents/${query ? `?${query}` : ""}`;

  const response = await fetchWithAuth(url, config);
  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.status}`);
  }

  return response.json();
}

async function fetchCompanies(
  params: { limit?: number; offset?: number } = {}
): Promise<FinmaticsCompanyList> {
  const config = getConfig();
  const searchParams = new URLSearchParams();

  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));

  const query = searchParams.toString();
  const url = `${config.baseUrl}/api/v1/companies/${query ? `?${query}` : ""}`;

  const response = await fetchWithAuth(url, config);
  if (!response.ok) {
    throw new Error(`Failed to fetch companies: ${response.status}`);
  }

  return response.json();
}

async function getDocumentPdfUrl(documentUuid: string): Promise<string> {
  const config = getConfig();
  return `${config.baseUrl}/api/v1/documents/${documentUuid}/pdf/`;
}

async function markDocumentExported(documentUuid: string): Promise<void> {
  const config = getConfig();
  const url = `${config.baseUrl}/api/v1/documents/${documentUuid}/`;

  const response = await fetchWithAuth(url, config, {
    method: "PATCH",
    body: JSON.stringify({ is_exported: true }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark document exported: ${response.status}`);
  }
}

export const finmaticsClient = {
  isConfigured,
  getConfig,
  authenticate,
  fetchDocuments,
  fetchCompanies,
  getDocumentPdfUrl,
  markDocumentExported,
};
