import { Bell, Settings, Search, Menu, Sun, Moon } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import i18n from "../../i18n";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";


const Topbar = ({ setCollapsed }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  // dropdown usuario
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // dropdown idioma
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef();
  const { user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 w-full bg-white dark:bg-gray-900 border-b dark:border-gray-700 flex items-center justify-between px-6 transition-colors duration-200">

      {/* Left */}
      <div className="flex items-center gap-4">

        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center bg-[#f3f6fb] dark:bg-gray-800 px-3 py-2 rounded-lg w-80">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder={t("search")}
            className="bg-transparent outline-none ml-2 text-sm w-full text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 relative">

        {/* 🌙 Tema */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? t("lightMode") : t("darkMode")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* 🌎 Idioma */}
        <div ref={langRef} className="relative">
          <div
            onClick={() => setLangOpen(!langOpen)}
            className="cursor-pointer text-lg"
          >
            {i18n.language === "es" ? "🇪🇸" : "🇺🇸"}
          </div>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-md py-2 z-50">

              <button
                onClick={() => {
                  i18n.changeLanguage("es");
                  localStorage.setItem("lang", "es");
                  setLangOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 ${
                  i18n.language === "es" ? "font-semibold text-blue-600" : ""
                }`}
              >
                🇪🇸 {t("spanish")}
              </button>

              <button
                onClick={() => {
                  i18n.changeLanguage("en");
                  localStorage.setItem("lang", "en");
                  setLangOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 ${
                  i18n.language === "en" ? "font-semibold text-blue-600" : ""
                }`}
              >
                🇺🇸 {t("english")}
              </button>

            </div>
          )}
        </div>

        {/* Iconos */}
        <Bell size={18} className="text-gray-500 dark:text-gray-400 cursor-pointer" />
        <Settings size={18} className="text-gray-500 dark:text-gray-400 cursor-pointer" />

        {/* 👤 Usuario */}
        <div ref={dropdownRef} className="relative">

          <div
            onClick={() => setOpen(!open)}
            className="w-8 h-8 bg-blue-400 rounded-full cursor-pointer"
          />

          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-md py-2 z-50">

              <div className="px-4 py-2 border-b dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                {user?.name}
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500"
              >
                {t("logout")}
              </button>

            </div>
          )}
        </div>

      </div>

    </header>
  );
};

export default Topbar;
