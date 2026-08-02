const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
const model = "deepseek/deepseek-chat";

// A full multi-section "premium" one-page site genuinely needs a large
// token budget to finish without truncating mid-document, so this stays
// generous. The timeout is kept under typical shared-hosting reverse-proxy
// limits (usually 30-60s) so a slow generation fails cleanly with a JSON
// error instead of the proxy silently killing the connection, which shows
// up in the browser as a bogus "CORS blocked" / network error.
const REQUEST_TIMEOUT_MS = 45000;
const DEFAULT_MAX_TOKENS = 8000;
const MIN_USABLE_TOKENS = 1500;

const callOpenRouter = async (prompt, maxTokens) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(openRouterUrl, {
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
        max_tokens: maxTokens,
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
};

export const generateResponse = async (prompt) => {
  let res = await callOpenRouter(prompt, DEFAULT_MAX_TOKENS);

  if (!res.ok) {
    const errText = await res.text();

    // OpenRouter tells us exactly how many tokens the account can currently
    // afford on a 402 - retry once at that budget instead of hard-failing
    // when the balance is just lower than our default, not empty.
    const affordMatch = errText.match(/can only afford (\d+)/i);
    if (res.status === 402 && affordMatch) {
      const affordable = Number(affordMatch[1]) - 200;

      if (affordable >= MIN_USABLE_TOKENS) {
        res = await callOpenRouter(prompt, affordable);
        if (res.ok) {
          const data = await res.json();
          return data.choices[0].message.content;
        }
      }

      throw new Error(
        "open router error: AI credit balance is too low to generate this website. Add credits at https://openrouter.ai/settings/credits",
      );
    }

    throw new Error("open router error" + errText);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};