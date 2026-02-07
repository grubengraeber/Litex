export interface FinmaticsAuthResponse {
  token: string;
}

export interface FinmaticsDocument {
  uuid: string;
  status: string;
  document_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  company_uuid: string;
  created_at: string;
  updated_at: string;
  is_exported: boolean;
  booking_text: string | null;
  amount: number | null;
  tax_amount: number | null;
  currency: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  supplier_name: string | null;
  supplier_iban: string | null;
  account_number: string | null;
  cost_center: string | null;
}

export interface FinmaticsDocumentList {
  count: number;
  next: string | null;
  previous: string | null;
  results: FinmaticsDocument[];
}

export interface FinmaticsCompany {
  uuid: string;
  name: string;
  company_register_number: string | null;
  tax_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinmaticsCompanyList {
  count: number;
  next: string | null;
  previous: string | null;
  results: FinmaticsCompany[];
}

export interface FinmaticsConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface FinmaticsSyncResult {
  processed: number;
  created: number;
  updated: number;
  errors: string[];
}
