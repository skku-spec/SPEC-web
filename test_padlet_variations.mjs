
const apiKey = "pdltp_4fcf8e8632cdf1bb44d221fe2875a17703b4b27958f0e928b6724d6c6245ab20d348fc";
const boardId = "60237748"; 

async function testVariation(headerName) {
  console.log(`Testing with header: ${headerName}`);
  try {
    const res = await fetch(`https://api.padlet.dev/v1/boards/${boardId}`, {
      headers: {
        [headerName]: apiKey,
        "Accept": "application/vnd.api+json",
      }
    });
    console.log(`  Status: ${res.status}`);
    const text = await res.text();
    console.log(`  Response: ${text.substring(0, 100)}...`);
  } catch (err) {
    console.error(`  Error: ${err.message}`);
  }
}

async function runTests() {
  await testVariation("X-Api-Key");
  await testVariation("x-api-key");
  await testVariation("X-API-KEY");
  await testVariation("Authorization"); // Some older docs mention this
}

runTests();
