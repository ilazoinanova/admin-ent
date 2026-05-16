import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Download, Paperclip, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { updatePayablePayment, getPaymentComprobante } from "../../../api/payables/payable.service";
import { fmtDate } from "../../../utils/date";

const fieldCls =
  "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";

const CAT_KEYS  = { servicio: "cat_servicio", mantenimiento: "cat_mantenimiento", arriendo: "cat_arriendo", suscripcion: "cat_suscripcion", otro: "cat_otro" };
const FREQ_KEYS = { monthly: "freq_monthly", quarterly: "freq_quarterly", annual: "freq_annual", one_time: "freq_one_time" };

function isImage(mime = "") { return mime.startsWith("image/"); }
function isPdf(mime = "")   { return mime === "application/pdf"; }

export default function PaymentDetailModal({ payment, initialMode = "view", onClose, onUpdated }) {
  const { t }             = useTranslation();
  const [mode, setMode]   = useState(initialMode);
  const [saving, setSaving] = useState(false);

  // Comprobante existente
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [previewMime, setPreviewMime] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Archivo nuevo seleccionado
  const [comprobanteFile, setComprobanteFile]         = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl]         = useState(null);
  const [localPreviewMime, setLocalPreviewMime]       = useState(null);

  const [editForm, setEditForm] = useState({
    amount_paid: payment.amount_paid ?? "",
    paid_at:     payment.paid_at     ?? "",
    reference:   payment.reference   ?? "",
    notes:       payment.notes       ?? "",
  });

  // Carga preview del comprobante existente
  useEffect(() => {
    if (!payment.comprobante_path) return;
    let url;
    const load = async () => {
      setLoadingPreview(true);
      try {
        const res  = await getPaymentComprobante(payment.id, false);
        const mime = res.headers["content-type"] ?? "application/octet-stream";
        url = URL.createObjectURL(new Blob([res.data], { type: mime }));
        setPreviewUrl(url);
        setPreviewMime(mime);
      } catch { /* silencioso */ }
      finally { setLoadingPreview(false); }
    };
    load();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [payment.id, payment.comprobante_path]);

  // Cleanup al desmontar
  useEffect(() => () => {
    if (previewUrl)      URL.revokeObjectURL(previewUrl);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setComprobanteFile(file);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalPreviewUrl(url);
      setLocalPreviewMime(file.type);
    } else {
      setLocalPreviewUrl(null);
      setLocalPreviewMime(null);
    }
  };

  const set = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));
  const fmt = (n) => Number(n ?? 0).toLocaleString("es-CL");

  const handleSave = async () => {
    setSaving(true);
    try {
      let payload;
      if (comprobanteFile) {
        payload = new FormData();
        if (editForm.amount_paid !== "") payload.append("amount_paid", editForm.amount_paid);
        if (editForm.paid_at)            payload.append("paid_at",     editForm.paid_at);
        if (editForm.reference)          payload.append("reference",   editForm.reference);
        if (editForm.notes)              payload.append("notes",       editForm.notes);
        payload.append("comprobante", comprobanteFile);
      } else {
        payload = {
          amount_paid: editForm.amount_paid !== "" ? Number(editForm.amount_paid) : null,
          paid_at:     editForm.paid_at     || null,
          reference:   editForm.reference   || null,
          notes:       editForm.notes       || null,
        };
      }
      await updatePayablePayment(payment.id, payload);
      toast.success(t("paymentUpdated"));
      onUpdated?.();
      onClose();
    } catch {
      toast.error(t("paymentUpdateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res  = await getPaymentComprobante(payment.id, true);
      const mime = res.headers["content-type"] ?? "application/octet-stream";
      const url  = URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a    = document.createElement("a");
      a.href     = url;
      a.download = payment.comprobante_name ?? `comprobante-${payment.period}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("comprobanteLoadError"));
    }
  };

  const p = payment.payable ?? {};

  // Preview a mostrar (nuevo archivo o existente)
  const showUrl  = localPreviewUrl  ?? previewUrl;
  const showMime = localPreviewMime ?? previewMime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">
              {mode === "view" ? t("paymentDetail") : t("editPayment")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.name} · {payment.period}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body — 2 columnas */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── Columna izquierda: info cuenta ────────────────────────────── */}
          <div className="w-64 flex-shrink-0 border-r dark:border-gray-700 p-5 overflow-y-auto space-y-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t("accountInfo")}</p>
            <InfoRow label={t("name")}      value={p.name      ?? "—"} />
            <InfoRow label={t("vendor")}    value={p.vendor    || "—"} />
            <InfoRow label={t("category")}  value={p.category  ? t(CAT_KEYS[p.category]   ?? p.category)  : "—"} />
            <InfoRow label={t("frequency")} value={p.frequency ? t(FREQ_KEYS[p.frequency] ?? p.frequency) : "—"} />
            <InfoRow label={t("amount")}    value={p.amount != null ? `${p.currency} $${fmt(p.amount)}` : "—"} />
            <InfoRow label={t("dueDay")}    value={p.due_day != null ? t("dayN", { n: p.due_day }) : "—"} />
          </div>

          {/* ── Columna derecha: datos del pago + comprobante ─────────────── */}
          <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-5">

            {/* Datos del pago */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t("paymentData")}</p>

              {mode === "view" ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <InfoRow label={t("period")}    value={<span className="font-mono font-semibold">{payment.period}</span>} />
                  <InfoRow label={t("dueDate")}   value={fmtDate(payment.due_date) ?? "—"} />
                  <InfoRow label={t("amount")}    value={`$${fmt(payment.amount)}`} />
                  <InfoRow label={t("amountPaid")} value={payment.amount_paid != null ? `$${fmt(payment.amount_paid)}` : "—"} />
                  <InfoRow label={t("paidAt")}    value={payment.paid_at ? fmtDate(payment.paid_at) : "—"} />
                  <InfoRow label={t("reference")} value={payment.reference || "—"} />
                  {payment.notes && <InfoRow label={t("notes")} value={payment.notes} full />}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Fila 1: Monto · Fecha · Referencia */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("amountPaid")}</label>
                      <input type="number" min="0" step="0.01" className={fieldCls} value={editForm.amount_paid} onChange={(e) => set("amount_paid", e.target.value)} disabled={saving} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("paidAt")}</label>
                      <input type="date" className={fieldCls} value={editForm.paid_at} onChange={(e) => set("paid_at", e.target.value)} disabled={saving} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("reference")}</label>
                      <input className={fieldCls} value={editForm.reference} onChange={(e) => set("reference", e.target.value)} disabled={saving} />
                    </div>
                  </div>
                  {/* Fila 2: Notas (full width) */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("notes")}</label>
                    <textarea
                      rows={3}
                      className={fieldCls}
                      value={editForm.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  {/* Upload comprobante */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("uploadComprobante")}</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      disabled={saving}
                      className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#0b1b3b] file:text-white hover:file:bg-[#162d5e] file:cursor-pointer disabled:opacity-60"
                    />
                    {!comprobanteFile && payment.comprobante_name && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Paperclip size={11} /> {t("currentFile")}: {payment.comprobante_name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Comprobante preview (siempre visible si hay archivo) */}
            {(showUrl || loadingPreview) && (
              <>
                <hr className="border-gray-100 dark:border-gray-700" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t("comprobante")}</p>
                    {!loadingPreview && payment.comprobante_path && mode === "view" && (
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border dark:border-gray-600 rounded px-2 py-1 transition"
                      >
                        <Download size={12} /> {t("downloadComprobante")}
                      </button>
                    )}
                  </div>

                  {loadingPreview ? (
                    <div className="flex items-center justify-center h-40 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
                      <span className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  ) : showUrl && isImage(showMime) ? (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900/30 flex items-center justify-center p-2">
                      <img
                        src={showUrl}
                        alt={payment.comprobante_name ?? "comprobante"}
                        className="max-h-72 object-contain rounded"
                      />
                    </div>
                  ) : showUrl && isPdf(showMime) ? (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <iframe
                        src={showUrl}
                        title="comprobante"
                        className="w-full h-72"
                      />
                    </div>
                  ) : showUrl ? (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-xl">
                      <FileText size={28} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {comprobanteFile?.name ?? payment.comprobante_name ?? t("comprobanteFile")}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{showMime}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            )}

            {/* Sin comprobante */}
            {mode === "view" && !payment.comprobante_path && (
              <>
                <hr className="border-gray-100 dark:border-gray-700" />
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                  <Paperclip size={14} />
                  <span className="text-sm">{t("noComprobante")}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t dark:border-gray-700 flex-shrink-0">
          {mode === "view" ? (
            <button onClick={onClose} className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              {t("close")}
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  if (initialMode === "edit") {
                    onClose();
                  } else {
                    setMode("view");
                    setComprobanteFile(null);
                    setLocalPreviewUrl(null);
                  }
                }}
                disabled={saving}
                className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
              >
                {t("cancel")}
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#0b1b3b] text-white rounded-lg hover:bg-[#162d5e] disabled:opacity-60 transition flex items-center gap-2">
                {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? t("saving") : t("save")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, full = false }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{value}</div>
    </div>
  );
}
