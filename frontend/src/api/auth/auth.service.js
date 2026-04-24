import api from "../api";

export const loginRequest = async (email, password) => {
  try {
    const response = await api.post("/login", {
      email,
      password,
    });

    const { data, token } = response.data;

    return {
      user: data,
      token: token,
    };
  } catch (error) {
    console.error("Login error:", error.response?.data);
    throw new Error(
      error.response?.data?.message || "Credenciales incorrectas"
    );
  }
};

// 🔥 validar sesión
export const getMe = async () => {
  const response = await api.get("/me");
  return response.data;
};