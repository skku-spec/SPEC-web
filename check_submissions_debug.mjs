import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: homeworks } = await supabase
    .from('homeworks')
    .select('id, title, padlet_board_id, individual_content, team_content, section_type_config')
    .order('created_at', { ascending: true });

  console.log("Homeworks in DB:");
  for (const hw of homeworks || []) {
    console.log(`- Title: ${hw.title}, ID: ${hw.id}, Padlet ID: ${hw.padlet_board_id}`);
    console.log(`  Individual content:`, hw.individual_content);
    console.log(`  Team content:`, hw.team_content);
    console.log(`  Section type config:`, hw.section_type_config);
  }
}

run();
