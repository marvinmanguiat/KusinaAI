export default function Footer() {
  return (
    <footer className="main-footer app-footer">

      <strong>
        Copyright &copy; {new Date().getFullYear()} Inventory Management
        System.
      </strong>

      <div className="float-right d-none d-sm-inline-block">
        <b>Version</b> 1.0.0
      </div>

    </footer>
  );
}