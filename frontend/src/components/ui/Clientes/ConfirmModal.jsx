import { AlertTriangle } from "lucide-react";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Desactivar Cliente",
  message = "",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-white w-[380px] rounded-2xl shadow-xl p-6">

        {/* ICONO */}
        <div className="flex justify-center mb-3 text-red-500">
          <AlertTriangle size={28} />
        </div>

        {/* TITULO */}
        <h2 className="text-center text-lg font-semibold mb-2">
          {title}
        </h2>

        {/* MENSAJE */}
        <p className="text-center text-sm text-gray-600 mb-5">
          {message}
        </p>

        {/* BOTONES */}
        <div className="flex justify-center gap-3">

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Confirmar
          </button>

        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;