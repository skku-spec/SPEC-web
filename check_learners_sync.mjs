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
  const { data: learnersFromProfiles } = await supabase
    .from('profiles')
    .select('id, name, role');

  const { data: members } = await supabase
    .from('members')
    .select('id, name, public_profile_id');

  const learners = learnersFromProfiles?.filter(p => p.role === 'learner') || [];
  const memberProfileIds = new Set(members?.map(m => m.public_profile_id).filter(Boolean) || []);

  console.log(`Total learners in profiles (role=learner): ${learners.length}`);
  console.log(`Total members in members table: ${members?.length}`);
  console.log(`Total unique profile IDs linked in members: ${memberProfileIds.size}`);

  const unmatched = learners.filter(l => !memberProfileIds.has(l.id));
  console.log(`Learners in profiles but NOT linked in members (${unmatched.length}):`);
  unmatched.forEach(u => console.log(`- ${u.name} (ID: ${u.id})`));
}

run();
