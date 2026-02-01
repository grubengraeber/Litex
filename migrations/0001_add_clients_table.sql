-- Migration: Add clients table (Mandanten)
-- Run this before using the new Mandanten features

-- Add clients table (Mandanten)
CREATE TABLE IF NOT EXISTS "clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "street" text,
  "city" text,
  "postal_code" text,
  "country" text DEFAULT 'Österreich',
  "tax_id" text,
  "vat_id" text,
  "notes" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Add client_id foreign key to companies table
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "client_id" uuid REFERENCES "clients"("id");

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "idx_companies_client_id" ON "companies"("client_id");
CREATE INDEX IF NOT EXISTS "idx_clients_name" ON "clients"("name");
CREATE INDEX IF NOT EXISTS "idx_clients_email" ON "clients"("email");
