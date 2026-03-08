/* eslint-env node */

export default async function inferCalories(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  try {
    const { ingredients } = req.body || {};

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "Missing ingredients array" });
    }

    const ingredientList = ingredients
      .map((ing) => {
        const quantity = String(ing.quantity ?? "").trim();
        const units = String(ing.units ?? "").trim();
        const name = String(ing.name ?? "").trim();
        return [quantity, units, name].filter(Boolean).join(" ");
      })
      .join("\n");

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
                    "Estimate the TOTAL calories for this recipe.\n\n" +
                    "Ingredients:\n" +
                    ingredientList +
                    "\n\nAssume typical ingredient values. " +
                    "Return ONLY the total calories as an integer. " +
                    "Do not include explanations.",
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
        .trim() || "";

    const calories = Number.parseInt(text, 10);

    if (!Number.isFinite(calories)) {
      return res.status(200).json({ calories: null, raw: text });
    }

    return res.status(200).json({ calories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
