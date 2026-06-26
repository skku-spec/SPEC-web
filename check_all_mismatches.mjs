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
    .select('id, title, individual_content, team_content');

  for (const hw of homeworks || []) {
    const individualItems = Array.isArray(hw.individual_content) ? hw.individual_content : [];
    const teamItems = Array.isArray(hw.team_content) ? hw.team_content : [];
    const dbTotal = Math.max(individualItems.length + teamItems.length, 1);

    // Get count of unique section_ids in submissions for this homework
    const { data: sectionSubs } = await supabase
      .from('homework_section_submissions')
      .select('section_id')
      .eq('homework_id', hw.id);

    const uniqueSections = new Set(sectionSubs?.map(s => s.section_id) || []);
    const padletTotal = uniqueSections.size;

    console.log(`- ${hw.title}: DB Config Total = ${dbTotal}, Padlet Synced Total = ${padletTotal}`);
  }
}

run();
