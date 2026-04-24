import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/stratek.png";
import { useTranslation } from "react-i18next";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!email || !password) {
            setError("Todos los campos son obligatorios");
            return;
        }

        if (!email.includes("@")) {
            setError("Correo inválido");
            return;
        }

        setLoading(true);

        try {
            const result = await login(email, password);

            if (result.success) {
                navigate("/dashboard");
            } else {
                setError(result.message || "Credenciales incorrectas");
            }
        } catch (err) {
            setError("Error inesperado");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb] dark:bg-gray-950 transition-colors duration-200">

            <div className="bg-white dark:bg-gray-900 p-10 rounded-2xl shadow-sm w-[420px] border dark:border-gray-700">

                <div className="flex flex-col items-center mb-6">
                    <img src={logo} alt="Stratek" className="h-16 mb-3 dark:brightness-0 dark:invert" />
                    <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                        Sistema de Administración
                    </h1>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <h2 className="text-md font-medium text-center mb-6 text-gray-600 dark:text-gray-400">
                    {t("login")}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <input
                        type="email"
                        placeholder={t("email")}
                        className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                        }}
                    />

                    <input
                        type="password"
                        placeholder={t("password")}
                        className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                        }}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg text-white transition
                            ${
                            loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-primary hover:bg-primary-dark"
                            }`}
                        >
                        {loading ? t("entering") : t("enter")}
                    </button>

                </form>

            </div>

        </div>
    );
};

export default Login;
