import { createClient } from '@supabase/supabase-js';

// Using the exact credentials provided in the requirements
const supabaseUrl = 'https://jogfrddrssbzfgfajfld.supabase.co';
const supabaseKey = 'sb_publishable_Vz4kmoeVBYZqS3x3w4rWqg_oPPbvJ_X';

export const supabase = createClient(supabaseUrl, supabaseKey);
