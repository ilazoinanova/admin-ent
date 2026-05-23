import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Link2, ChevronRight, Download, Save, CheckCircle } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { getInvoice, updateInvoice } from "../../../api/invoices/invoice.service";
import InvoicePdfDocument from "./InvoicePdfDocument";
import InvoicePreviewWithQr from "./InvoicePreviewWithQr";

const inputClass =
  "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60";

export default function InvoiceQrModal({ invoice, onClose }) {
  const { t } = useTranslation();

  const [step, setStep]         = useState(1); // 1 = URL, 2 = preview
  const [url, setUrl]           = useState("");
  const [urlError, setUrlError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [fullInvoice, setFullInvoice] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  const validateUrl = (v) => {
    try { new URL(v); return true; } catch { return false; }
  };

  const handleNext = async () => {
    if (!url.trim()) { setUrlError(t("qrModal.urlRequired")); return; }
    if (!validateUrl(url.trim())) { setUrlError(t("qrModal.urlInvalid")); return; }

    setLoading(true);
    try {
      const [invoiceRes, dataUrl] = await Promise.all([
        getInvoice(invoice.id),
        QRCode.toDataURL(url.trim(), { width: 300, margin: 1, errorCorrectionLevel: "M" }),
      ]);
      setFullInvoice(invoiceRes.data);
      setQrDataUrl(dataUrl);
      setStep(2);
    } catch {
      setUrlError(t("qrModal.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const buildForm = (inv) => ({
    issue_date:     inv.issue_date,
    due_date:       inv.due_date,
    currency:       inv.currency,
    tax_rate:       inv.tax_rate ?? 0,
    tax_name:       inv.tax_name ?? "",
    notes:          inv.notes ?? "",
    billing_period: inv.billing_period ?? null,
    period_from:    inv.period_from ?? null,
    period_to:      inv.period_to ?? null,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateInvoice(invoice.id, { qr_url: url.trim() });
      setSaved(true);
    } catch {
      // silencioso — no interrumpe el flujo
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!fullInvoice || !qrDataUrl) return;
    setDownloading(true);
    try {
      const blob = await pdf(
        <InvoicePdfDocument
          form={buildForm(fullInvoice)}
          items={fullInvoice.items ?? []}
          tenant={fullInvoice.tenant}
          deptName={fullInvoice.department?.name ?? ""}
          draft={false}
          qrImageUrl={qrDataUrl}
        />
      ).toBlob();
      const link = document.createElement("a");
      link.href     = URL.createObjectURL(blob);
      link.download = `${fullInvoice.invoice_number}-qr.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      // silencioso — el usuario puede reintentar
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl flex flex-col overflow-hidden"
        style={{ width: step === 2 ? "min(96vw, 860px)" : "min(96vw, 680px)", maxHeight: "94vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Link2 size={16} className="text-[#0b1b3b] dark:text-blue-400" />
              {t("qrModal.title")}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
              {invoice.invoice_number}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">

          {/* PASO 1 — URL */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("qrModal.step1Description")}
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  className={inputClass}
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder="https://ejemplo.com/factura/123"
                  disabled={loading}
                  autoFocus
                />
                {urlError && <p className="text-red-500 text-xs mt-1">{urlError}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-[#0b1b3b] text-white rounded-lg hover:bg-[#162d5e] disabled:opacity-60 transition flex items-center gap-2"
                >
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? t("loading") : t("qrModal.next")}
                  {!loading && <ChevronRight size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* PASO 2 — VISTA PREVIA */}
          {step === 2 && fullInvoice && qrDataUrl && (
            <>
              <div className="flex-1 min-h-0">
                <InvoicePreviewWithQr
                  form={buildForm(fullInvoice)}
                  items={fullInvoice.items ?? []}
                  tenant={fullInvoice.tenant}
                  deptName={fullInvoice.department?.name ?? ""}
                  qrImageUrl={qrDataUrl}
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-6 py-4 border-t dark:border-gray-700 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setStep(1); setSaved(false); }}
                  className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  ← {t("qrModal.changeUrl")}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className={`px-4 py-2 text-sm rounded-lg transition flex items-center gap-2 border
                      ${saved
                        ? "border-green-400 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 cursor-default"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                      }`}
                  >
                    {saving
                      ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : saved
                        ? <CheckCircle size={14} />
                        : <Save size={14} />
                    }
                    {saving ? t("saving") : saved ? t("qrModal.saved") : t("qrModal.save")}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="px-4 py-2 text-sm bg-[#0b1b3b] text-white rounded-lg hover:bg-[#162d5e] disabled:opacity-60 transition flex items-center gap-2"
                  >
                    {downloading
                      ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Download size={14} />
                    }
                    {downloading ? t("downloading") : t("qrModal.download")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
