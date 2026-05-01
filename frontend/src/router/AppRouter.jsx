import { Routes, Route } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";
import PrivateRoute from "./PrivateRoute";
import Dashboard from "../pages/Tablero";
import Tenants from "../pages/Tenants";
import Login from "../pages/Login";
import Productos from "../pages/Servicios";
import Facturacion from "../pages/GestionComercial/Facturacion";
import CuentasPagar from "../pages/GestionComercial/CuentasPagar";
import Cotizaciones from "../pages/GestionComercial/Cotizaciones";
import ServiciosCliente from "../pages/Asignaciones";

const AppRouter = () => {
  return (
    <Routes>

      {/* pública */}
      <Route path="/login" element={<Login />} />

      {/* privadas */}
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <MainLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tenants" element={<Tenants />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/servicios-cliente" element={<ServiciosCliente />} />
                <Route path="/facturacion" element={<Facturacion />} />
                <Route path="/cotizaciones" element={<Cotizaciones />} />
                <Route path="/cuentas-pagar" element={<CuentasPagar />} />
              </Routes>
            </MainLayout>
          </PrivateRoute>
        }
      />

    </Routes>
  );
};

export default AppRouter;