import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Paperclip } from "lucide-react";
import { toast } from "react-hot-toast";
import { getPayables, createPayablePayment } from "../../../api/payables/payable.service";

const fieldCls =
  "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";

const emptyForm = { period: "", due_date: "", amount: "", reference: "", notes: "" };

function prefillForm(payable) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day   = String(payable?.due_day ?? 1).padStart(2, "0");
  return {
    period:    `${year}-${month}`,
    due_date:  `${year}-${month}-${day}`,
    amount:    String(payable?.amount ?? ""),
    reference: "",
    notes:     "",
  };
}

export default function RegisterPaymentModal({ open, onClose, onSuccess }) {
  const { t } = useTranslation();

  const [payables, setPayables]         = useState([]);
  const [loadingList, setLoadingList]   = useState(false);
  const [selectedId, setSelectedId]     = useState("");
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [submitting, setSubmitting]     = useState(false);
  const [comprobanteFile, setComprobanteFile] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSelectedId("");
    setSelectedPayable(null);
    setForm(emptyForm);
    setComprobanteFile(null);
    const load = async () => {
      setLoadingList(true);
      try {
        const res = await getPayables({ per_page: 999, page: 1 });
        setPayables(res.data.data ?? []);
      } catch { /* silencioso */ }
      finally { setLoadingList(false); }
    };
    load();
  }, [open]);

  const handleSelect = (id) => {
    setSelectedId(id);
    const payable = payables.find((p) => String(p.id) === id) ?? null;
    setSelectedPayable(payable);
    setForm(payable ? prefillForm(payable) : emptyForm);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let payload;
      if (comprobanteFile) {
        payload = new FormData();
        payload.append("period",    form.period);
        payload.append("due_date",  form.due_date);
        payload.append("amount",    form.amount);
        if (form.reference) payload.append("reference", form.reference);
        if (form.notes)     payload.append("notes",     form.notes);
        payload.append("comprobante", comprobanteFile);
      } else {
        payload = {
          period:    form.period,
          due_date:  form.due_date,
          amount:    Number(form.amount),
          reference: form.reference || undefined,
          notes:     form.notes     || undefined,
        };
      }
      await createPayablePayment(selectedId, payload);
      toast.success(t("paymentRegistered"));
      onSuccess?.();
      onClose();
    } catch {
      toast.error(t("paymentRegisterError"));
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => Number(n ?? 0).toLocaleString("es-CL");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 flex-shrink-0">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("registerPayment")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X size={18} />
          </button>
        </div>

        <form id="reg-pay-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">

          {/* Selector de cuenta */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t("selectAccount")} *
            </label>
            <select
              className={fieldCls}
              value={selectedId}
              onChange={(e) => handleSelect(e.target.value)}
              disabled={loadingList || submitting}
              required
            >
              <option value="">{t("selectAccountPlaceholder")}</option>
              {payables.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.vendor ? ` — ${p.vendor}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Info de la cuenta seleccionada */}
          {selectedPayable && (
            <div className="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
              <InfoCol label={t("amount")}    value={`${selectedPayable.currency} $${fmt(selectedPayable.amount)}`} />
              <InfoCol label={t("frequency")} value={t(`freq_${selectedPayable.frequency}`)} />
              <InfoCol label={t("dueDay")}    value={`${t("dayN", { n: selectedPayable.due_day })}`} />
            </div>
          )}

          {/* Formulario del pago */}
          <div className={`space-y-3 transition-opacity duration-200 ${selectedPayable ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t("paymentData")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("period")} * (YYYY-MM)</label>
                <input
                  className={fieldCls}
                  placeholder="2026-05"
                  maxLength={7}
                  value={form.period}
                  onChange={(e) => set("period", e.target.value)}
                  disabled={submitting}
                  required
                  pattern="\d{4}-\d{2}"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("dueDate")} *</label>
                <input
                  type="date"
                  className={fieldCls}
                  value={form.due_date}
                  onChange={(e) => set("due_date", e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("amount")} *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={fieldCls}
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("reference")}</label>
                <input
                  className={fieldCls}
                  value={form.reference}
                  onChange={(e) => set("reference", e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("notes")}</label>
              <input
                className={fieldCls}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Comprobante */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("uploadComprobante")}</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setComprobanteFile(e.target.files?.[0] ?? null)}
                disabled={submitting}
                className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#0b1b3b] file:text-white hover:file:bg-[#162d5e] file:cursor-pointer disabled:opacity-60"
              />
              {comprobanteFile && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Paperclip size={11} /> {comprobanteFile.name}
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            form="reg-pay-form"
            disabled={!selectedId || submitting}
            className="px-4 py-2 text-sm bg-[#0b1b3b] text-white rounded-lg hover:bg-[#162d5e] disabled:opacity-60 transition flex items-center gap-2"
          >
            {submitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCol({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{value}</p>
    </div>
  );
}
