const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
const model = "deepseek/deepseek-chat";

// A full multi-section "premium" one-page site genuinely needs a large
// token budget to finish without truncating mid-document, so this stays
// generous. The timeout is kept under typical shared-hosting reverse-proxy
// limits (usually 30-60s) so a slow generation fails cleanly with a JSON
// error instead of the proxy silently killing the connection, which shows
// up in the browser as a bogus "CORS blocked" / network error.
const REQUEST_TIMEOUT_MS = 45000;

export const generateResponse = async (prompt) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(openRouterUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You must respond using EXACTLY the requested @@MESSAGE@@ / @@CODE@@ text format. No JSON, no markdown, no extra text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 8000,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("open router error: request timed out, please try again");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error("open router error" + err);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};