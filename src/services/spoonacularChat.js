const BASE = "https://api.spoonacular.com/food/converse";

export async function converseFood(text, contextId, apiKey) {
  const url = new URL(BASE);
  url.searchParams.set("text", text);
  url.searchParams.set("contextId", contextId);
  url.searchParams.set("apiKey", apiKey);

  const r = await fetch(url.toString());
  const data = await r.json();

  if (!r.ok) {
    const msg = data?.message || data?.status || "Spoonacular error";
    throw new Error(msg);
  }

  return data;
}
