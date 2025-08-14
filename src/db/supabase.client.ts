import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing SUPABASE_KEY environment variable");
}

if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_KEY environment variable");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export const supabaseAdminClient = createClient<Database>(supabaseUrl, supabaseServiceKey);
