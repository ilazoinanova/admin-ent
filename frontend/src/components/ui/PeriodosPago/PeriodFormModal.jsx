import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { createPaymentPeriod, updatePaymentPeriod } from "../../../api/periodos/periodoPago.service";

const MONTHS = [
  { value: 1, label: "Enero" }, { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" }, { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" }, { value: 6, label: "Junio" },
  { value: 7, label: "Julio" }, { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" }, { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" }, { value: 12, label: "Diciembre" },
];

const Spinner = () => (
  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);

export default function PeriodFormModal({ period, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = Boolean(period);

  const [form, setForm] = useState({
    type:      "monthly",
    month:     new Date().getMonth() + 1,
    year:      currentYear,
    start_day: 1,
    end_day:   31,
  });
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (period) {
      setForm({
        type:      period.type,
        month:     period.month ?? 1,
        year:      period.year,
        start_day: period.start_day,
        end_day:   period.end_day,
      });
    }
  }, [period]);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (form.type === "monthly" && !form.month) err.month = t("pp.required");
    if (!form.year) err.year = t("pp.required");
    if (!form.start_day) err.start_day = t("pp.required");
    if (!form.end_day) err.end_day = t("pp.required");
    if (Number(form.start_day) > Number(form.end_day)) {
      err.end_day = t("pp.endDayError");
    }
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }

    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.type === "annual") delete payload.month;
      payload.month     = payload.type === "monthly" ? Number(payload.month) : undefined;
      payload.year      = Number(payload.year);
      payload.start_day = Number(payload.start_day);
      payload.end_day   = Number(payload.end_day);

      if (isEdit) {
        await updatePaymentPeriod(period.id, payload);
        toast.success(t("pp.updated"));
      } else {
        await createPaymentPeriod(payload);
        toast.success(t("pp.created"));
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t("pp.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-lg overflow-hidden border dark:border-gray-700">

        <div className="bg-[#0b1b3b] text-white px-5 py-3">
          <h2 className="text-sm font-semibold">
            {isEdit ? t("pp.editTitle") : t("pp.newTitle")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("pp.type")}</label>
            <div className="flex gap-3">
              {["monthly", "annual"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={opt}
                    checked={form.type === opt}
                    onChange={() => set("type", opt)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {opt === "monthly" ? t("pp.monthly") : t("pp.annual")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Mes + Año */}
          <div className={`grid gap-3 ${form.type === "monthly" ? "grid-cols-2" : "grid-cols-1"}`}>
            {form.type === "monthly" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("pp.month")}</label>
                <select
                  value={form.month}
                  onChange={(e) => set("month", Number(e.target.value))}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {errors.month && <p className="text-red-500 text-xs mt-0.5">{errors.month}</p>}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("pp.year")}</label>
              <select
                value={form.year}
                onChange={(e) => set("year", Number(e.target.value))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {errors.year && <p className="text-red-500 text-xs mt-0.5">{errors.year}</p>}
            </div>
          </div>

          {/* Días */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("pp.startDay")}</label>
              <input
                type="number"
                min={1} max={31}
                value={form.start_day}
                onChange={(e) => set("start_day", e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.start_day && <p className="text-red-500 text-xs mt-0.5">{errors.start_day}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("pp.endDay")}</label>
              <input
                type="number"
                min={1} max={31}
                value={form.end_day}
                onChange={(e) => set("end_day", e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.end_day && <p className="text-red-500 text-xs mt-0.5">{errors.end_day}</p>}
            </div>
          </div>

          {/* Resumen visual */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
            {t("pp.preview")}{" "}
            <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
              {form.type === "monthly"
                ? `${String(form.month).padStart(2, "0")}-${form.year}`
                : String(form.year)}
            </span>
            {" · "}{t("pp.from")} {t("pp.day")} {form.start_day} {t("pp.to")} {t("pp.day")} {form.end_day}
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 text-sm border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-50 transition"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-sm text-white bg-[#0b1b3b] hover:bg-[#162d5e] rounded-md flex items-center gap-1.5 disabled:opacity-70 transition"
            >
              {saving && <Spinner />}
              {isEdit ? t("pp.save") : t("pp.create")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
