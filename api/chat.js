/* eslint-env node */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing messages array" });
    }

    const conversation = messages.map((m) => `${m.role}: ${m.text}`).join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "You are a helpful cooking assistant. Your name is Remy. You may recommend recipes and provide links to recipe websites when helpful. Format responses using bullet lists and include clickable links when possible.\n\nConversation:\n" +
                    conversation,
                },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: data?.error?.message || "Gemini request failed" });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("")
        .trim() || "Sorry, I couldn't generate a response.";

    return res.status(200).json({ text });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
}
