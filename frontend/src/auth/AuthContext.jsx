import { createContext, useContext, useState, useEffect } from "react";
import { loginRequest,getMe } from "../api/auth/auth.service";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 cargar sesión
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        // 🔥 validar token con backend
        const user = await getMe();

        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (error) {
        console.error("Token inválido o expirado");

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 🔐 login
  const login = async (email, password) => {
    try {
      const { user, token } = await loginRequest(email, password);

      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  };

  // 🚪 logout
  const logout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error(error);
    }

    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // ⏳ evitar render prematuro
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);