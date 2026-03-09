function Footer() {
  return (
    <footer className="text-center text-lg-start mt-auto app-footer fs-5">
      <div className="footer text-center p-4">
        &copy; {new Date().getFullYear()} Mise. All rights reserved.
      </div>

      <div className="container pb-4">
        <div className="d-flex justify-content-center gap-4">
          <a
            href="https://github.com/mitchelllord04"
            target="_blank"
            rel="noreferrer"
            className="text-decoration-none footer-link"
          >
            <i className="bi bi-github me-1" />
            GitHub
          </a>

          <a
            href="https://www.linkedin.com/in/mitchelllord-cs/"
            target="_blank"
            rel="noreferrer"
            className="text-decoration-none footer-link"
          >
            <i className="bi bi-linkedin me-1" />
            LinkedIn
          </a>

          <a
            href="https://mitchell-lord.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="text-decoration-none footer-link"
          >
            <i className="bi bi-briefcase me-1" />
            Portfolio
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
