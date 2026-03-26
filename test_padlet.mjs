
const apiKey = "pdltp_4fcf8e8632cdf1bb44d221fe2875a17703b4b27958f0e928b6724d6c6245ab20d348fc";
const boardId = "60237748"; // Just a random board id to test

async function testPadlet() {
  console.log("Testing Padlet API key...");
  try {
    const res = await fetch(`https://api.padlet.dev/v1/boards/${boardId}`, {
      headers: {
        "X-Api-Key": apiKey,
        "Accept": "application/vnd.api+json",
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

testPadlet();
