import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  // 🔥 Cargar estado guardado
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  // 🔥 Guardar estado
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  return (
    <div className="flex h-screen w-full bg-[#f5f7fb] dark:bg-gray-950">

      <div
        className={`${
          collapsed ? "w-20" : "w-64"
        } transition-all duration-300`}
      >
        <Sidebar collapsed={collapsed} />
      </div>

      <div className="flex flex-col flex-1">
        <Topbar setCollapsed={setCollapsed} />

        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>

    </div>
  );
};

export default MainLayout;