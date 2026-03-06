import NavBar from "./NavBar";

function Header() {
  return (
    <header className="sticky-top bg-light">
      <div className="header d-flex align-items-center justify-content-between px-4 py-4">
        <h1 className="m-0">Mise</h1>
        <NavBar />
      </div>
    </header>
  );
}

export default Header;
