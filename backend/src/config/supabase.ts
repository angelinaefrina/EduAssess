import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { env } from './env';

// Client service_role: mem-bypass RLS. Otorisasi WAJIB dilakukan di middleware/controller.
export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
