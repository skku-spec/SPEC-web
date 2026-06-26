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

  if (!response.ok) {
    console.log(`Error: ${response.status} ${response.statusText}`);
    console.log(await response.text());
    return;
  }

  const json = await response.json();
  const included = json.included || [];

  const posts = included.filter(r => r.type === 'post');
  const sections = included.filter(r => r.type === 'section');

  console.log(`Total posts: ${posts.length}, Total sections: ${sections.length}`);
  console.log("Sections:");
  sections.forEach(s => {
    console.log(`- ID: ${s.id}, Title: ${s.attributes?.title}`);
  });
}

run();
