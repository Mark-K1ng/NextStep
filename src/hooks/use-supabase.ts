import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useSupabase() {
  return { supabase };
}
