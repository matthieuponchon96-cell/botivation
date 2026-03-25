import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iweaskfuqeiiyhfisbkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZWFza2Z1cWVpaXloZmlzYmtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjkzMTQsImV4cCI6MjA5MDA0NTMxNH0.fKm4UAzmOcLgUxG7DxgLN_yfqFU11QG1XmDP6WkwjgA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
