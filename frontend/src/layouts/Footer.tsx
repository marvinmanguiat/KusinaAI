export default function Footer() {
  return (
    <footer className="main-footer app-footer k-footer">

      <strong>
        Copyright &copy; {new Date().getFullYear()} Kusina AI.
      </strong>

      <div className="float-right d-none d-sm-inline-block">
        <b>Flavor</b> Household Menu Assistant
      </div>

    </footer>
  );
}