import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vppkhnjjuelnactedoxt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcGtobmpqdWVsbmFjdGVkb3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwODE1NTEsImV4cCI6MjA2NDY1NzU1MX0.QveKSUvcdPkClRyfLqXWisux34lnU3UQ5Fnl6FB41z8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
