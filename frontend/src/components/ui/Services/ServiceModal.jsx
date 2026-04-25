import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const CATEGORIES = [
  "svc_desarrollo",
  "svc_suscripcion",
  "svc_soporte",
  "svc_infraestructura",
  "svc_consultoria",
  "svc_mantenimiento",
  "svc_otro",
];

const EMPTY = { name: "", code: "", category: "", description: "", unit: "", notes: "" };

const ServiceModal = ({ open, onClose, onSubmit, initialData }) => {
  const { t } = useTranslation();
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(
      initialData
        ? {
            name:        initialData.name        || "",
            code:        initialData.code        || "",
            category:    initialData.category    || "",
            description: initialData.description || "",
            unit:        initialData.unit        || "",
            notes:       initialData.notes       || "",
          }
        : EMPTY
    );
  }, [initialData, open]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  if (!open) return null;

  const fieldClass =
    "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";
  const labelClass = "text-xs text-gray-500 dark:text-gray-400";

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-lg overflow-hidden border dark:border-gray-700">

        {/* Header */}
        <div className="bg-[#0b1b3b] text-white px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {initialData ? t("editService") : t("newService")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white text-lg leading-none transition"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">

          <div className="grid grid-cols-2 gap-3">

            {/* Nombre (ancho completo) */}
            <div className="col-span-2">
              <label className={labelClass}>{t("name")} *</label>
              <input
                name="name"
                value={form.name}
                onChange={set}
                className={fieldClass}
                required
                disabled={loading}
              />
            </div>

            {/* Código */}
            <div>
              <label className={labelClass}>{t("code")}</label>
              <input
                name="code"
                value={form.code}
                onChange={set}
                className={fieldClass}
                disabled={loading}
                maxLength={100}
              />
            </div>

            {/* Categoría */}
            <div>
              <label className={labelClass}>{t("serviceCategory")}</label>
              <select
                name="category"
                value={form.category}
                onChange={set}
                className={fieldClass}
                disabled={loading}
              >
                <option value="">{t("selectCategory")}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(c)}</option>
                ))}
              </select>
            </div>

            {/* Unidad de facturación */}
            <div>
              <label className={labelClass}>{t("billingUnit")}</label>
              <select
                name="unit"
                value={form.unit}
                onChange={set}
                className={fieldClass}
                disabled={loading}
              >
                <option value="">{t("selectUnit")}</option>
                <option value="Mensual">{t("monthly")}</option>
                <option value="Horas">{t("hoursUnit")}</option>
                <option value="Usuarios">{t("usersUnit")}</option>
                <option value="Transacciones">{t("transactionsUnit")}</option>
                <option value="Fijo">{t("fixedOption")}</option>
              </select>
            </div>

            {/* Descripción (ancho completo) */}
            <div className="col-span-2">
              <label className={labelClass}>{t("descriptionLabel")}</label>
              <input
                name="description"
                value={form.description}
                onChange={set}
                className={fieldClass}
                disabled={loading}
              />
            </div>

            {/* Notas internas (ancho completo) */}
            <div className="col-span-2">
              <label className={labelClass}>{t("serviceNotes")}</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={set}
                rows={3}
                placeholder={t("serviceNotesPh")}
                className={`${fieldClass} resize-none`}
                disabled={loading}
              />
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-[#0b1b3b] text-white rounded-md hover:bg-[#162d5e] disabled:opacity-60 transition"
            >
              {loading ? t("saving") : t("save")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ServiceModal;
