import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = readFileSync('./supabase/migrations/20251003150000_add_admin_delete_policies.sql', 'utf8');

const queries = sql
  .split(';')
  .map(q => q.trim())
  .filter(q => q && !q.startsWith('/*') && !q.startsWith('--'));

for (const query of queries) {
  console.log('Executing:', query.substring(0, 100));
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success');
  }
}
