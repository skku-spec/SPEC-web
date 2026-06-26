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

const padletApiKey = env.PADLET_API_KEY;

async function run() {
  const boardId = 'vhzj7ca2zvcxcaff';
  const url = `https://api.padlet.dev/v1/boards/${boardId}?include=posts,sections`;
  const response = await fetch(url, {
    headers: {
      'X-Api-Key': padletApiKey,
      'Accept': 'application/vnd.api+json'
    }
  });

  const json = await response.json();
  const included = json.included || [];
  const posts = included.filter(r => r.type === 'post');
  
  const sectionId = 'sec_x1rD2JL3zVyMv0dM';
  const sectionPosts = posts.filter(p => p.relationships?.section?.data?.id === sectionId);

  console.log(`Posts in section ${sectionId}:`);
  sectionPosts.forEach(p => {
    console.log(`- Post ID: ${p.id}`);
    console.log(`  Author: ${JSON.stringify(p.attributes?.author)}`);
    console.log(`  Subject/Body: ${p.attributes?.subject} / ${p.attributes?.body?.slice(0, 50)}`);
  });
}

run();
