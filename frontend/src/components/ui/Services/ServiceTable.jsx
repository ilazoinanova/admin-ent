import { useState } from "react";
import ServiceModal from "./ServiceModal";

export default function ServiceTable() {
  const [services, setServices] = useState([
    { id: 1, name: "Servicio 1", price: 1000, currency: "CLP", active: 1 },
    { id: 2, name: "Servicio 2", price: 50, currency: "USD", active: 1 },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selectedService, setSelectedService] = useState(null);

  // 🔹 Crear
  const handleCreate = () => {
    setMode("create");
    setSelectedService(null);
    setModalOpen(true);
  };

  // 🔹 Editar
  const handleEdit = (service) => {
    setMode("edit");
    setSelectedService(service);
    setModalOpen(true);
  };

  // 🔹 Inactivar
  const handleDeactivate = (id) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, active: 0 } : s
    );
    setServices(updated);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold">Servicios</h1>
          <p className="text-sm text-gray-500">
            Gestión de servicios del sistema
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nuevo
        </button>
      </div>

      {/* TABLA */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Nombre</th>
            <th>Precio</th>
            <th>Moneda</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {services
            .filter((s) => s.active === 1)
            .map((service) => (
              <tr key={service.id} className="border-b">
                <td className="py-2">{service.name}</td>
                <td>{service.price}</td>
                <td>{service.currency}</td>

                <td className="space-x-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDeactivate(service.id)}
                    className="text-red-600 hover:underline"
                  >
                    Inactivar
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* MODAL */}
      <ServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={mode}
        initialData={selectedService}
      />
    </div>
  );
}