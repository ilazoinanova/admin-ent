import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, UploadCloud, FileCheck, Loader2, Send } from "lucide-react";
import { uploadFiscalPdf } from "../../../api/invoices/invoice.service";
import { periodLabel } from "../../../utils/billingPeriod";

export default function InvoiceUploadPdfModal({ invoice, onClose, onUploaded }) {
  const { t } = useTranslation();
  const inputRef           = useRef(null);
  const [file, setFile]    = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]  = useState("");

  const tenant = invoice.tenant ?? {};
  const period = invoice.billing_period ? periodLabel(invoice.billing_period) : null;

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError(t("uploadModal.onlyPdf"));
      return;
    }
    setError("");
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) { setError(t("uploadModal.noFile")); return; }
    setUploading(true);
    try {
      await uploadFiscalPdf(invoice.id, file);
      onUploaded?.();
    } catch {
      setError(t("uploadModal.uploadError"));
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl flex flex-col w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <UploadCloud size={16} className="text-[#0b1b3b] dark:text-blue-400" />
            {t("uploadModal.title")}
          </h2>
          <button onClick={onClose} disabled={uploading} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Info de la factura */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3 text-sm space-y-1 border dark:border-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t("client")}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">{tenant.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t("invoiceNumber")}</span>
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{invoice.invoice_number}</span>
            </div>
            {period && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("billingPeriod")}</span>
                <span className="text-gray-700 dark:text-gray-300">{period}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">{t("uploadModal.description")}</p>

          {/* Zona de drop */}
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition
              ${dragging
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }
              ${uploading ? "pointer-events-none opacity-60" : ""}
            `}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileCheck size={32} className="text-green-500" />
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · PDF</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-red-400 hover:text-red-600 transition"
                >
                  {t("uploadModal.changeFile")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UploadCloud size={32} className="text-gray-300 dark:text-gray-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("uploadModal.dropZone")}</p>
                <p className="text-xs text-gray-400">{t("uploadModal.pdfOnly")}</p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 text-sm bg-[#0b1b3b] text-white rounded-lg hover:bg-[#162d5e] disabled:opacity-60 transition flex items-center gap-2"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {uploading ? t("uploadModal.uploading") : t("uploadModal.submit")}
          </button>
        </div>

      </div>
    </div>
  );
}
