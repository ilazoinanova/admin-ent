import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const ServiceModal = ({ open, onClose, onSubmit, initialData }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", code: "", description: "", price: "", currency: "", unit: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        name:        initialData.name        || "",
        code:        initialData.code        || "",
        description: initialData.description || "",
        price:       initialData.price       || "",
        currency:    initialData.currency    || "",
        unit:        initialData.unit        || "",
      });
    } else {
      setForm({ name: "", code: "", description: "", price: "", currency: "", unit: "" });
    }
  }, [initialData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  if (!open) return null;

  const fieldClass = "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-lg overflow-hidden border dark:border-gray-700">

        <div className="bg-[#0b1b3b] text-white px-5 py-3">
          <h2 className="text-sm font-semibold">
            {initialData ? t("editService") : t("newService")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">{t("name")}</label>
            <input name="name" value={form.name} onChange={handleChange} className={fieldClass} required disabled={loading} />
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">{t("code")}</label>
            <input name="code" value={form.code} onChange={handleChange} className={fieldClass} disabled={loading} />
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">{t("descriptionLabel")}</label>
            <input name="description" value={form.description} onChange={handleChange} className={fieldClass} disabled={loading} />
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">{t("basePrice")}</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} className={fieldClass} disabled={loading} />
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">{t("baseCurrency")}</label>
            <select name="currency" value={form.currency} onChange={handleChange} className={fieldClass} disabled={loading}>
              <option value="">{t("selectCurrency")}</option>
              <option value="USD">USD</option>
              <option value="CLP">CLP</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">{t("baseUnit")}</label>
            <select name="unit" value={form.unit} onChange={handleChange} className={fieldClass} disabled={loading}>
              <option value="">{t("selectUnit")}</option>
              <option value="Mensual">{t("monthly")}</option>
              <option value="Horas">{t("hoursUnit")}</option>
              <option value="Usuarios">{t("usersUnit")}</option>
              <option value="Transacciones">{t("transactionsUnit")}</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 text-sm border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-[#0b1b3b] text-white rounded-md hover:bg-[#162d5e] disabled:opacity-60 disabled:cursor-not-allowed transition"
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
