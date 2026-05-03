import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";
import {
  LayoutDashboard,
  Building2,
  LinkIcon,
  Briefcase,
  ChevronDown,
  Box,
  Receipt,
  Wallet,
  ClipboardList,
} from "lucide-react";
import logoFull from "../../assets/stratek.png";
import logoIcon from "../../assets/stratek-icon.png";
import { useState, useEffect, useRef } from "react";

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const [openMenu, setOpenMenu] = useState(false);
  const [openFloating, setOpenFloating] = useState(false);
  const floatingRef = useRef();
  const { user } = useAuth();

  useEffect(() => {
    if (
      location.pathname.includes("productos") ||
      location.pathname.includes("facturacion") ||
      location.pathname.includes("cotizaciones") ||
      location.pathname.includes("cuentas-pagar")
    ) {
      setOpenMenu(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    setOpenFloating(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        floatingRef.current &&
        !floatingRef.current.contains(event.target)
      ) {
        setOpenFloating(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <aside className="h-full bg-white dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col transition-colors duration-200">

      {/* Logo dinámico */}
      <div className="h-20 flex items-center justify-center">
        <img
          src={collapsed ? logoIcon : logoFull}
          alt="logo"
          className={`object-contain transition-all duration-300 dark:brightness-0 dark:invert ${
            collapsed ? "h-8" : "h-12"
          }`}
        />
      </div>

      {/* Usuario */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 bg-[#f3f6fb] dark:bg-gray-800 p-3 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-400 shrink-0"></div>
            <div>
              <p className="text-sm font-semibold dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.company}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menú */}
      <nav className="flex-1 px-2 mt-2 space-y-1">

        <MenuItem
          to="/dashboard"
          icon={<LayoutDashboard size={18} />}
          label={t("dashboard")}
          collapsed={collapsed}
          active={location.pathname === "/dashboard"}
        />

        <MenuItem
          to="/tenants"
          icon={<Building2 size={18} />}
          label={t("companies")}
          collapsed={collapsed}
          active={location.pathname === "/tenants"}
        />

        <MenuItem
          to="/productos"
          icon={<Box size={18} />}
          label={t("services")}
          collapsed={collapsed}
          active={location.pathname === "/productos"}
        />

        {/* Gestión Comercial */}
        <div className="relative">

          <button
            onClick={() => {
              if (collapsed) {
                setOpenFloating(!openFloating);
              } else {
                setOpenMenu(!openMenu);
              }
            }}
            className={`relative flex items-center ${
              collapsed ? "justify-center" : "justify-between px-3"
            } py-2 w-full rounded-lg text-sm transition group
            text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`}
          >
            <div className="flex items-center gap-3">
              <Briefcase size={18} />
              {!collapsed && t("commercialManagement")}
            </div>

            {!collapsed && (
              <ChevronDown
                size={16}
                className={`transition ${openMenu ? "rotate-180" : ""}`}
              />
            )}

            {collapsed && (
              <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                {t("commercialManagement")}
              </span>
            )}
          </button>

          {/* Floating menu (colapsado) */}
          {collapsed && openFloating && (
            <div ref={floatingRef} className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-2 w-52 z-50 border dark:border-gray-700">

              <SubItem
                to="/servicios-cliente"
                icon={<LinkIcon size={16} />}
                label={t("assignments")}
                closeMenu={() => setOpenFloating(false)}
              />

              <SubItem
                to="/facturacion"
                icon={<Receipt size={16} />}
                label={t("billing")}
                closeMenu={() => setOpenFloating(false)}
              />

              <SubItem
                to="/cotizaciones"
                icon={<ClipboardList size={16} />}
                label={t("quotes")}
                closeMenu={() => setOpenFloating(false)}
              />

              <SubItem
                to="/cuentas-pagar"
                icon={<Wallet size={16} />}
                label={t("accountsPayable")}
                closeMenu={() => setOpenFloating(false)}
              />

            </div>
          )}

          {/* Submenú normal */}
          {!collapsed && openMenu && (
            <div className="ml-6 mt-1 space-y-1">

              <SubItem
                to="/servicios-cliente"
                icon={<LinkIcon size={16} />}
                label={t("assignments")}
              />

              <SubItem
                to="/facturacion"
                icon={<Receipt size={16} />}
                label={t("billing")}
              />

              <SubItem
                to="/cotizaciones"
                icon={<ClipboardList size={16} />}
                label={t("quotes")}
              />

              <SubItem
                to="/cuentas-pagar"
                icon={<Wallet size={16} />}
                label={t("accountsPayable")}
              />

            </div>
          )}

        </div>

      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 text-xs text-gray-400 dark:text-gray-600 border-t dark:border-gray-700">
          © 2026 Admin
        </div>
      )}
    </aside>
  );
};

const MenuItem = ({ to, icon, label, collapsed, active }) => {
  return (
    <Link
      to={to}
      className={`relative flex items-center ${
        collapsed ? "justify-center" : "gap-3 px-3"
      } py-2 rounded-lg text-sm transition group
      ${
        active
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {icon}

      {!collapsed && <span>{label}</span>}

      {collapsed && (
        <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
          {label}
        </span>
      )}
    </Link>
  );
};

const SubItem = ({ to, icon, label, closeMenu }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={closeMenu}
      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition
        ${
          isActive
            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export default Sidebar;
