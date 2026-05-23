import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Paperclip } from "lucide-react";
import { toast } from "react-hot-toast";
import { createAdditionalPayment } from "../../../api/payables/payable.service";

const fieldCls =
  "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";

export default function AdditionalPaymentModal({ period, onClose, onSaved }) {
  const { t } = useTranslation();

  const [form, setForm] = useState({
    title:       "",
    description: "",
    amount_paid: "",
    paid_at:     "",
    vendor:      "",
    reference:   "",
    notes:       "",
  });
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.title.trim()) err.title = t("rp.required");
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }

    setSaving(true);
    try {
      let payload;
      if (comprobanteFile) {
        payload = new FormData();
        payload.append("payment_period_id", period.id);
        payload.append("title", form.title);
        if (form.description) payload.append("description", form.description);
        if (form.vendor)      payload.append("vendor",      form.vendor);
        if (form.amount_paid) payload.append("amount_paid", form.amount_paid);
        if (form.paid_at)     payload.append("paid_at",     form.paid_at);
        if (form.reference)   payload.append("reference",   form.reference);
        if (form.notes)       payload.append("notes",       form.notes);
        payload.append("comprobante", comprobanteFile);
      } else {
        payload = {
          payment_period_id: period.id,
          title:             form.title,
          description:       form.description || undefined,
          vendor:            form.vendor      || undefined,
          amount_paid:       form.amount_paid ? Number(form.amount_paid) : undefined,
          paid_at:           form.paid_at     || undefined,
          reference:         form.reference   || undefined,
          notes:             form.notes       || undefined,
        };
      }

      await createAdditionalPayment(payload);
      toast.success(t("rp.additionalCreated"));
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t("rp.additionalError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: "92vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("rp.additionalTitle")}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {t("rp.forPeriod")}: <span className="font-mono font-bold">{period.label}</span>
              </p>
            </div>
            <span className="inline-block bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {t("rp.additionalBadge")}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X size={18} />
          </button>
        </div>

        <form id="add-pay-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto min-h-0 flex-1">

          {/* Título — ancho completo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t("rp.payTitle")} *</label>
            <input
              className={fieldCls}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              disabled={saving}
              placeholder={t("rp.payTitlePlaceholder")}
            />
            {errors.title && <p className="text-red-500 text-xs mt-0.5">{errors.title}</p>}
          </div>

          {/* Descripción — ancho completo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t("description")}</label>
            <textarea
              rows={2}
              className={fieldCls}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              disabled={saving}
              placeholder={t("rp.descriptionPlaceholder")}
            />
          </div>

          {/* Proveedor + Referencia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t("vendor")} ({t("rp.optional")})</label>
              <input
                className={fieldCls}
                value={form.vendor}
                onChange={(e) => set("vendor", e.target.value)}
                disabled={saving}
                placeholder={t("rp.vendorPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t("reference")}</label>
              <input
                className={fieldCls}
                value={form.reference}
                onChange={(e) => set("reference", e.target.value)}
                disabled={saving}
                placeholder="Nº boleta, factura, orden…"
              />
            </div>
          </div>

          {/* Monto pagado + Fecha de pago */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t("amountPaid")}</label>
              <input
                type="number" min="0" step="0.01"
                className={fieldCls}
                value={form.amount_paid}
                onChange={(e) => set("amount_paid", e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t("paidAt")}</label>
              <input
                type="date"
                className={fieldCls}
                value={form.paid_at}
                onChange={(e) => set("paid_at", e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Notas — textarea grande, ancho completo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t("notes")}</label>
            <textarea
              rows={4}
              className={fieldCls}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              disabled={saving}
              placeholder="Observaciones, instrucciones de pago, contexto adicional…"
            />
          </div>

          {/* Comprobante */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t("uploadComprobante")}</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setComprobanteFile(e.target.files?.[0] ?? null)}
              disabled={saving}
              className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#0b1b3b] file:text-white hover:file:bg-[#162d5e] file:cursor-pointer disabled:opacity-60"
            />
            {comprobanteFile && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Paperclip size={11} /> {comprobanteFile.name}
              </p>
            )}
          </div>

        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            form="add-pay-form"
            disabled={saving}
            className="px-4 py-2 text-sm bg-[#0b1b3b] text-white rounded-lg hover:bg-[#162d5e] disabled:opacity-60 transition flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? t("saving") : t("rp.createAdditional")}
          </button>
        </div>
      </div>
    </div>
  );
}
