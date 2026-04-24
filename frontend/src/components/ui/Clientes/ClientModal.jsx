import { useState, useEffect } from "react";
import { X } from "lucide-react";

const ClientModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [form, setForm] = useState({
    name: "",
    empresa: "",
    contacto: "",
    telefono: "",
    email: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      // 🔥 RESET FORM cuando es nuevo cliente
      setForm({
        name: "",
        empresa: "",
        contacto: "",
        telefono: "",
        email: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-white w-[420px] rounded-2xl shadow-xl p-6 animate-fadeIn">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-700">
            {initialData ? "Editar Compañía" : "Nueva Compañía"}
          </h2>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="name"
            placeholder="Nombre"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-200 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />

          <input
            name="empresa"
            placeholder="Empresa"
            value={form.empresa}
            onChange={handleChange}
            className="w-full border border-gray-200 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />

          <input
            name="contacto"
            placeholder="Contacto"
            value={form.contacto}
            onChange={handleChange}
            className="w-full border border-gray-200 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />

          <input
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
            className="w-full border border-gray-200 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-200 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 pt-3">

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition shadow-sm"
            >
              Guardar
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default ClientModal;