const API_KEY = import.meta.env.VITE_SPOONACULAR_KEY;

export async function getRandomRecipe() {
  const res = await fetch(
    `https://api.spoonacular.com/recipes/random?number=1&apiKey=${API_KEY}`,
  );

  const data = await res.json();
  return data.recipes[0];
}

export async function searchRecipes(query) {
  const res = await fetch(
    `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=10&apiKey=${API_KEY}`,
  );

  const data = await res.json();
  return data.results;
}
