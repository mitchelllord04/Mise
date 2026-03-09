import "./App.css";

import { Routes, Route, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ResetPassword from "./pages/ResetPassword";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Add from "./pages/Add";
import View from "./pages/View";
import Chatbot from "./pages/Chatbot";
import RecipeDetails from "./pages/RecipeDetails";
import EditRecipe from "./pages/EditRecipe";

import ProtectedRoute from "./routes/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <main className="flex-fill">
        <ScrollToTop />

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/add" element={<Add />} />
            <Route path="/view" element={<View />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/details/:recipeId" element={<RecipeDetails />} />
            <Route path="/edit/:recipeId" element={<EditRecipe />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
