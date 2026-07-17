import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.body.className = `
      hold-transition
      sidebar-mini
      layout-fixed
      ${sidebarCollapsed ? "sidebar-collapse" : ""}
    `.trim();

    const timer = setTimeout(() => {
      document.body.classList.add("app-loaded");
    }, 100);

    return () => clearTimeout(timer);
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <>
      <Navbar toggleSidebar={toggleSidebar} />

      <Sidebar />

      <main className="app-main" id="main">
        <div className="content-header">
          <div className="container-fluid"></div>
        </div>

        <section className="content">
          <div className="container-fluid pt-3">
            <Outlet />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}