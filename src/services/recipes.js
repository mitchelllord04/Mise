import { db } from "../firebase";
import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

function recipesRef(uid) {
  return collection(db, "users", uid, "recipes");
}

export async function addRecipe(uid, recipe) {
  const docRef = await addDoc(recipesRef(uid), {
    ...recipe,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getRecipes(uid) {
  const q = query(recipesRef(uid), orderBy("isFavorite", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getRecipe(uid, recipeId) {
  const ref = doc(db, "users", uid, "recipes", recipeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateRecipe(uid, recipeId, updates) {
  const ref = doc(db, "users", uid, "recipes", recipeId);
  const { id, createdAt, ...data } = updates;

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRecipe(uid, recipeId) {
  const ref = doc(db, "users", uid, "recipes", recipeId);
  await deleteDoc(ref);
}
