import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

const CATEGORIES = ["servicio", "mantenimiento", "arriendo", "suscripcion", "otro"];
const FREQUENCIES = ["monthly", "quarterly", "annual", "one_time"];
const CURRENCIES  = ["CLP", "USD", "EUR"];

const fieldCls = "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";

const empty = {
  name: "", category: "servicio", vendor: "", amount: "",
  currency: "CLP", frequency: "monthly", due_day: "1",
  start_date: "", end_date: "", notes: "",
};

export default function PayableModal({ open, onClose, onSubmit, initialData }) {
  const { t } = useTranslation();
  const [form, setForm]     = useState(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        name:       initialData.name       ?? "",
        category:   initialData.category   ?? "servicio",
        vendor:     initialData.vendor     ?? "",
        amount:     initialData.amount     ?? "",
        currency:   initialData.currency   ?? "CLP",
        frequency:  initialData.frequency  ?? "monthly",
        due_day:    initialData.due_day    ?? "1",
        start_date: initialData.start_date ?? "",
        end_date:   initialData.end_date   ?? "",
        notes:      initialData.notes      ?? "",
      });
    } else {
      setForm(empty);
    }
  }, [open, initialData]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        amount:  Number(form.amount),
        due_day: Number(form.due_day),
        end_date: form.end_date || null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">
            {initialData ? t("editPayable") : t("newPayable")}
          </h2>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Fila 1: Nombre + Proveedor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("name")} *</label>
              <input className={fieldCls} value={form.name} onChange={(e) => set("name", e.target.value)} disabled={loading} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("vendor")}</label>
              <input className={fieldCls} value={form.vendor} onChange={(e) => set("vendor", e.target.value)} disabled={loading} />
            </div>
          </div>

          {/* Fila 2: Categoría + Frecuencia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("category")} *</label>
              <select className={fieldCls} value={form.category} onChange={(e) => set("category", e.target.value)} disabled={loading}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat_${c}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("frequency")} *</label>
              <select className={fieldCls} value={form.frequency} onChange={(e) => set("frequency", e.target.value)} disabled={loading}>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{t(`freq_${f}`)}</option>)}
              </select>
            </div>
          </div>

          {/* Fila 3: Monto + Moneda + Día vencimiento */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("amount")} *</label>
              <input type="number" min="0" step="0.01" className={fieldCls} value={form.amount} onChange={(e) => set("amount", e.target.value)} disabled={loading} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("currency")} *</label>
              <select className={fieldCls} value={form.currency} onChange={(e) => set("currency", e.target.value)} disabled={loading}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("dueDay")} *</label>
              <input type="number" min="1" max="31" className={fieldCls} value={form.due_day} onChange={(e) => set("due_day", e.target.value)} disabled={loading} required />
            </div>
          </div>

          {/* Fila 4: Fecha inicio + Fecha fin */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("startDate")} *</label>
              <input type="date" className={fieldCls} value={form.start_date} onChange={(e) => set("start_date", e.target.value)} disabled={loading} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("endDate")}</label>
              <input type="date" className={fieldCls} value={form.end_date} onChange={(e) => set("end_date", e.target.value)} disabled={loading} />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("notes")}</label>
            <textarea rows={2} className={fieldCls} value={form.notes} onChange={(e) => set("notes", e.target.value)} disabled={loading} />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition">
              {t("cancel")}
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-[#0b1b3b] text-white rounded-lg hover:bg-[#162d5e] disabled:opacity-60 transition flex items-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
