// Supabase project config — the anon key is the public client key, safe to
// ship in client-side code. Access is controlled by Row Level Security
// policies (see supabase/schema.sql).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://reaulndsmiibpcmvbrzv.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYXVsbmRzbWlpYnBjbXZicnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDE3OTksImV4cCI6MjA5NjQxNzc5OX0.GnWw5CFaY7gwNfieHbWid0usFDUiUHLRf-dJlOp13zM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
