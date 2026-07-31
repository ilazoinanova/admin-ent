import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/stratek.png";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Eye, EyeOff, LogIn, CheckCircle2 } from "lucide-react";

const FEATURES = [
    "Gestión centralizada de clientes y compañías",
    "Facturación y control de servicios",
    "Estadísticas y reportería en tiempo real",
];

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="min-h-screen flex bg-white dark:bg-gray-950 transition-colors duration-200">

            {/* Panel izquierdo */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] flex-col justify-between bg-primary text-white p-12 relative overflow-hidden">
                <div>
                    <div className="flex items-center gap-3 mb-16">
                        <img src={logo} alt="Stratek" className="h-10 brightness-0 invert" />
                    </div>

                    <h1 className="text-4xl font-bold leading-tight mb-4">
                        Easypay,<br />todo en un solo lugar.
                    </h1>
                    <p className="text-gray-300 max-w-md mb-10">
                        Gestión de clientes, facturación y servicios — con la trazabilidad
                        que tu operación necesita.
                    </p>

                    <ul className="space-y-4">
                        {FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-sm">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10">
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                </span>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-xs text-gray-400">Desarrollado por Stratek</p>
            </div>

            {/* Panel derecho */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-sm">

                    <div className="mb-8 lg:hidden flex justify-center">
                        <img src={logo} alt="Stratek" className="h-12 dark:brightness-0 dark:invert" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        Inicia sesión
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                        Ingresa tus credenciales para acceder al panel.
                    </p>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {t("email")}
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 pl-10 pr-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError("");
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {t("password")}
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium transition
                                ${
                                loading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-primary hover:bg-primary-dark"
                                }`}
                            >
                            <LogIn size={18} />
                            {loading ? t("entering") : t("login")}
                        </button>

                    </form>

                </div>
            </div>

        </div>
    );
};

export default Login;
