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
  const hwId = '8b7cb739-5e1a-454a-b414-15e5d35ad90a';
  
  const { data: sectionSubs } = await supabase
    .from('homework_section_submissions')
    .select('user_id, section_id, is_completed')
    .eq('homework_id', hwId);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name');

  const profileMap = new Map(profiles.map(p => [p.id, p.name]));

  console.log(`Total section submissions for 8주차 과제: ${sectionSubs?.length}`);
  
  const grouped = {};
  for (const sub of sectionSubs || []) {
    const name = profileMap.get(sub.user_id) || sub.user_id;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(sub);
  }

  for (const name of Object.keys(grouped).sort()) {
    const subs = grouped[name];
    const completed = subs.filter(s => s.is_completed).map(s => s.section_id);
    console.log(`- Learner: ${name}, Submissions count: ${subs.length}, Completed count: ${completed.length} (Sections: ${completed.join(', ')})`);
  }
}

run();
