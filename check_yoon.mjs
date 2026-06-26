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
const padletApiKey = env.PADLET_API_KEY;

async function run() {
  // Find Yoon Yoon-young's profile
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('name', '윤윤영');

  if (!profiles || profiles.length === 0) {
    console.error("Yoon Yoon-young profile not found!");
    return;
  }

  const yoon = profiles[0];
  console.log(`User: ${yoon.name}, ID: ${yoon.id}, Username: ${yoon.username}`);

  // Fetch all homeworks
  const { data: homeworks } = await supabase
    .from('homeworks')
    .select('*')
    .order('created_at', { ascending: true });

  console.log(`\n--- DB Homework Configs ---`);
  for (const hw of homeworks || []) {
    const indItems = Array.isArray(hw.individual_content) ? hw.individual_content : [];
    const teamItems = Array.isArray(hw.team_content) ? hw.team_content : [];
    const total = Math.max(indItems.length + teamItems.length, 1);
    console.log(`- ${hw.title}: ID=${hw.id}, PadletID=${hw.padlet_board_id}, totalItems=${total}`);
    if (indItems.length) console.log(`  Individual: ${JSON.stringify(indItems)}`);
    if (teamItems.length) console.log(`  Team: ${JSON.stringify(teamItems)}`);
  }

  // Fetch homework_submissions (weeks 1-4)
  const { data: submissions } = await supabase
    .from('homework_submissions')
    .select('*')
    .eq('user_id', yoon.id);

  console.log(`\n--- DB Submissions (weeks 1-4/others) ---`);
  console.log(submissions);

  // Fetch homework_section_submissions (weeks 5-8)
  const { data: sectionSubs } = await supabase
    .from('homework_section_submissions')
    .select('*')
    .eq('user_id', yoon.id);

  console.log(`\n--- DB Section Submissions (weeks 5-8) ---`);
  sectionSubs?.forEach(s => {
    const hw = homeworks.find(h => h.id === s.homework_id);
    console.log(`- Homework: ${hw?.title || s.homework_id}, Section: ${s.section_id}, Completed: ${s.is_completed}`);
  });

  // Call Padlet API for each active homework with board id
  console.log(`\n--- Padlet API Live Scan for ${yoon.name} ---`);
  for (const hw of homeworks || []) {
    if (!hw.padlet_board_id) continue;
    
    const url = `https://api.padlet.dev/v1/boards/${hw.padlet_board_id}?include=posts,sections`;
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': padletApiKey,
        'Accept': 'application/vnd.api+json'
      }
    });

    if (!response.ok) {
      console.log(`Error fetching Padlet ${hw.title}: ${response.status}`);
      continue;
    }

    const json = await response.json();
    const included = json.included || [];
    const sections = included.filter(r => r.type === 'section');
    const posts = included.filter(r => r.type === 'post');

    console.log(`\n${hw.title} (Padlet ID: ${hw.padlet_board_id})`);
    console.log(`Sections count: ${sections.length}, Posts count: ${posts.length}`);

    // Map section IDs to titles
    const secMap = new Map(sections.map(s => [s.id, s.attributes?.title]));

    // Check if Yoon posted in any section
    sections.forEach(s => {
      const sId = s.id;
      const sTitle = s.attributes?.title;

      // Find posts in this section
      const sectionPosts = posts.filter(p => {
        const sRel = p.relationships?.section?.data?.id;
        return sRel === sId;
      });

      // Filter posts matching Yoon
      const yoonPosts = sectionPosts.filter(p => {
        const author = p.attributes?.author || {};
        const authorName = (author.fullName || author.name || author.shortName || '').toLowerCase();
        const authorUsername = (author.username || '').toLowerCase().replace(/^@/, '');

        const yName = yoon.name.toLowerCase();
        const yUsername = (yoon.username || '').toLowerCase().replace(/^@/, '');

        const matchesName = yName && (authorName.includes(yName) || yName.includes(authorName));
        const matchesUsername = yUsername && (authorUsername === yUsername);

        return matchesName || matchesUsername;
      });

      console.log(`- Section ID: ${sId}, Title: ${sTitle}`);
      console.log(`  Posts count: ${sectionPosts.length}, Yoon's posts count: ${yoonPosts.length}`);
      yoonPosts.forEach(p => {
        console.log(`    * Post ID: ${p.id}, Author info: ${JSON.stringify(p.attributes?.author)}`);
      });
    });
  }
}

run();
