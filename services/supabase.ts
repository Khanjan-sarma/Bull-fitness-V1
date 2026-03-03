import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jogfrddrssbzfgfajfld.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Vz4kmoeVBYZqS3x3w4rWqg_oPPbvJ_X';

export const supabase = createClient(supabaseUrl, supabaseKey);
