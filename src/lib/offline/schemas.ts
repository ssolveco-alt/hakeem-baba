// RxDB schemas + per-collection sync config for the Supabase <-> RxDB bridge.
import type { RxJsonSchema } from "rxdb";

const S = (extra: Record<string, unknown> = {}) => ({ type: ["string", "null"], ...extra });

export interface CollectionConfig {
  name: string;        // RxDB collection + Supabase table name (same)
  schema: RxJsonSchema<any>;
  columns: string[];   // data columns synced (excludes updated_at/deleted/deleted_at)
  push: boolean;       // false = pull-only (read replica)
}

const patientsSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 64 },
    clinic_id: { type: "string" },
    patient_code: S(),
    name: { type: "string" },
    phone: { type: "string" },
    age: { type: ["integer", "null"] },
    gender: S(),
    address: S(),
    notes: S(),
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  required: ["id", "clinic_id", "name", "phone", "created_at", "updated_at"],
};

const visitsSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 64 },
    clinic_id: { type: "string" },
    patient_id: { type: "string" },
    visit_date: { type: "string" },
    disease: S(),
    symptoms: S(),
    notes: S(),
    fee: { type: ["number", "null"] },
    created_by: S(),
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  required: ["id", "clinic_id", "patient_id", "visit_date", "created_at", "updated_at"],
};

const nuskhasSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 64 },
    clinic_id: { type: "string" },
    name: { type: "string" },
    category: S(),
    description: S(),
    image_url: S(),
    notes: S(),
    status: { type: "string" },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  required: ["id", "clinic_id", "name", "status", "created_at", "updated_at"],
};

const visitNuskhasSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 64 },
    clinic_id: { type: "string" },
    visit_id: { type: "string" },
    nuskha_id: { type: "string" },
    updated_at: { type: "string" },
  },
  required: ["id", "clinic_id", "visit_id", "nuskha_id", "updated_at"],
};

const clinicsSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 64 },
    name: { type: "string" },
    owner_name: S(),
    phone: S(),
    email: S(),
    address: S(),
    logo: S(),
    subscription_plan: S(),
    status: S(),
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  required: ["id", "name", "created_at", "updated_at"],
};

const settingsSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 64 },
    clinic_id: { type: "string" },
    clinic_name: S(),
    phone: S(),
    address: S(),
    logo: S(),
    language: S(),
    updated_at: { type: "string" },
  },
  required: ["id", "clinic_id", "updated_at"],
};

export const COLLECTIONS: CollectionConfig[] = [
  {
    name: "patients",
    schema: patientsSchema,
    columns: ["id", "clinic_id", "patient_code", "name", "phone", "age", "gender", "address", "notes", "created_at"],
    push: true,
  },
  {
    name: "visits",
    schema: visitsSchema,
    columns: ["id", "clinic_id", "patient_id", "visit_date", "disease", "symptoms", "notes", "fee", "created_by", "created_at"],
    push: true,
  },
  {
    name: "nuskhas",
    schema: nuskhasSchema,
    columns: ["id", "clinic_id", "name", "category", "description", "image_url", "notes", "status", "created_at"],
    push: true,
  },
  {
    name: "visit_nuskhas",
    schema: visitNuskhasSchema,
    columns: ["id", "clinic_id", "visit_id", "nuskha_id"],
    push: true,
  },
  {
    name: "clinics",
    schema: clinicsSchema,
    columns: ["id", "name", "owner_name", "phone", "email", "address", "logo", "subscription_plan", "status", "created_at"],
    push: false,
  },
  {
    name: "settings",
    schema: settingsSchema,
    columns: ["id", "clinic_id", "clinic_name", "phone", "address", "logo", "language"],
    push: false,
  },
];
