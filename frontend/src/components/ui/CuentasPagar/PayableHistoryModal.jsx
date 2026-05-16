import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Eye, Paperclip } from "lucide-react";
import { toast } from "react-hot-toast";
import { getPayablePayments, createPayablePayment } from "../../../api/payables/payable.service";
import { fmtDate } from "../../../utils/date";
import PaymentDetailModal from "./PaymentDetailModal";

const fieldCls = "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";

const emptyForm = { period: "", due_date: "", amount: "", reference: "", notes: "" };

export default function PayableHistoryModal({ payable, onClose, readOnly = false }) {
  const { t }                   = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);

  // Detalle de pago seleccionado
  const [detailPayment, setDetailPayment] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPayablePayments(payable.id);
      setPayments(res.data.payments ?? []);
    } catch {
      toast.error(t("paymentLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [payable.id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPayablePayment(payable.id, { ...form, amount: Number(form.amount) });
      toast.success(t("paymentRegistered"));
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error(t("paymentRegisterError"));
    } finally {
      setSubmitting(false);
    }
  };

  // Construye el objeto de pago enriquecido con la relación payable
  const openDetail = (payment) => {
    setDetailPayment({ ...payment, payable });
  };

  const fmt = (n) => Number(n ?? 0).toLocaleString("es-CL");

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 flex-shrink-0">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">{payable.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("paymentHistory")}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden min-h-0">

            {/* Panel izquierdo: info cuenta */}
            <div className="w-64 flex-shrink-0 border-r dark:border-gray-700 p-5 space-y-4 overflow-y-auto">
              <InfoRow label={t("vendor")}    value={payable.vendor || "—"} />
              <InfoRow label={t("category")}  value={t(`cat_${payable.category}`)} />
              <InfoRow label={t("frequency")} value={t(`freq_${payable.frequency}`)} />
              <InfoRow label={t("amount")}    value={`${payable.currency} ${fmt(payable.amount)}`} />
              <InfoRow label={t("dueDay")}    value={t("dayN", { n: payable.due_day })} />
              <InfoRow label={t("startDate")} value={fmtDate(payable.start_date) ?? "—"} />
              {payable.end_date && <InfoRow label={t("endDate")} value={fmtDate(payable.end_date)} />}
              {payable.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">{t("notes")}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{payable.notes}</p>
                </div>
              )}
            </div>

            {/* Panel derecho: historial */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {payments.length} {t("paymentsRegistered")}
                </span>
                {!readOnly && (
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1.5 text-sm bg-[#0b1b3b] text-white px-3 py-1.5 rounded-lg hover:bg-[#162d5e] transition"
                  >
                    <Plus size={14} /> {t("registerPayment")}
                  </button>
                )}
              </div>

              {/* Formulario */}
              {!readOnly && showForm && (
                <form onSubmit={handleAddPayment} className="p-5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 space-y-3 flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("newPaymentRecord")}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("period")} * (YYYY-MM)</label>
                      <input className={fieldCls} placeholder="2026-05" maxLength={7} value={form.period} onChange={(e) => set("period", e.target.value)} disabled={submitting} required pattern="\d{4}-\d{2}" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("dueDate")} *</label>
                      <input type="date" className={fieldCls} value={form.due_date} onChange={(e) => set("due_date", e.target.value)} disabled={submitting} required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("amount")} *</label>
                      <input type="number" min="0" step="0.01" className={fieldCls} value={form.amount} onChange={(e) => set("amount", e.target.value)} disabled={submitting} required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("reference")}</label>
                      <input className={fieldCls} value={form.reference} onChange={(e) => set("reference", e.target.value)} disabled={submitting} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("notes")}</label>
                      <input className={fieldCls} value={form.notes} onChange={(e) => set("notes", e.target.value)} disabled={submitting} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowForm(false)} disabled={submitting} className="px-3 py-1.5 text-sm border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition">
                      {t("cancel")}
                    </button>
                    <button type="submit" disabled={submitting} className="px-3 py-1.5 text-sm bg-[#0b1b3b] text-white rounded-lg hover:bg-[#162d5e] disabled:opacity-60 transition flex items-center gap-2">
                      {submitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {submitting ? t("saving") : t("save")}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de pagos */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_36px] gap-3 px-5 py-2 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase sticky top-0">
                  <span>{t("period")}</span>
                  <span>{t("dueDate")}</span>
                  <span>{t("amount")}</span>
                  <span>{t("amountPaid")}</span>
                  <span>{t("reference")}</span>
                  <span></span>
                </div>

                {loading ? (
                  <div className="space-y-2 p-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-9 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">{t("noPaymentsRegistered")}</div>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_36px] gap-3 px-5 py-3 border-b dark:border-gray-700 text-sm items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{p.period}</span>
                      <span className="text-gray-600 dark:text-gray-400">{fmtDate(p.due_date)}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">${fmt(p.amount)}</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {p.amount_paid != null ? `$${fmt(p.amount_paid)}` : "—"}
                      </span>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-gray-500 dark:text-gray-400 truncate">{p.reference || "—"}</span>
                        {p.comprobante_path && <Paperclip size={11} className="text-gray-400 flex-shrink-0" />}
                      </div>
                      <button
                        onClick={() => openDetail(p)}
                        title={t("viewDetail")}
                        className="text-gray-400 hover:text-blue-600 transition flex-shrink-0"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle del pago (z-60 para ir sobre el historial) */}
      {detailPayment && (
        <div className="relative z-[60]">
          <PaymentDetailModal
            key={detailPayment.id}
            payment={detailPayment}
            initialMode="view"
            onClose={() => setDetailPayment(null)}
            onUpdated={() => { setDetailPayment(null); load(); }}
          />
        </div>
      )}
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5">{value}</p>
    </div>
  );
}
