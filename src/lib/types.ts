export type UserRole = "platform_admin" | "hakeem" | "assistant";
export type ClinicStatus = "active" | "suspended";
export type NuskhaStatus = "active" | "inactive";

export interface Clinic {
  id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo: string | null;
  subscription_plan: string | null;
  status: ClinicStatus;
  created_at: string;
}

export interface AppUser {
  id: string;
  clinic_id: string | null;
  role: UserRole;
  name: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  patient_code: string | null;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Visit {
  id: string;
  clinic_id: string;
  patient_id: string;
  visit_date: string;
  disease: string | null;
  symptoms: string | null;
  notes: string | null;
  fee: number | null;
  created_by: string | null;
  created_at: string;
}

export interface Nuskha {
  id: string;
  clinic_id: string;
  name: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
  notes: string | null;
  status: NuskhaStatus;
  created_at: string;
}

export const NUSKHA_CATEGORIES = [
  "Kidney",
  "Liver",
  "Diabetes",
  "Joint Pain",
  "Stomach",
  "Skin",
  "General",
  "Other",
] as const;
