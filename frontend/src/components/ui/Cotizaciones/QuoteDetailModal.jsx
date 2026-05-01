import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Send, CheckCircle, XCircle, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateQuote } from "../../../api/quotes/quote.service";
import { fmtDate } from "../../../utils/date";

const STATUS_COLORS = {
  draft:    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  sent:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  expired:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const STATUS_KEYS = {
  draft:    "statusDraft",
  sent:     "statusSent",
  accepted: "quoteAccepted",
  rejected: "quoteRejected",
  expired:  "quoteExpired",
};

export default function QuoteDetailModal({ quote, onClose, onStatusChange }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const fmt      = (n) => Number(n ?? 0).toLocaleString("es-CL");
  const colorClass = STATUS_COLORS[quote.status] ?? STATUS_COLORS.draft;
  const labelKey   = STATUS_KEYS[quote.status]   ?? "statusDraft";

  const changeStatus = async (status) => {
    setLoading(true);
    try {
      await updateQuote(quote.id, { status });
      toast.success(t("quoteStatusUpdated"));
      onStatusChange();
    } catch {
      toast.error(t("quoteUpdateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-5xl rounded-xl shadow-lg flex flex-col max-h-[90vh] border dark:border-gray-700">

        {/* Header */}
        <div className="bg-[#0b1b3b] text-white px-6 py-4 rounded-t-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <FileText size={16} />
            <h2 className="text-base font-semibold">{quote.quote_number}</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorClass}`}>{t(labelKey)}</span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-[300px_1fr] h-full divide-x dark:divide-gray-700">

            {/* Panel izquierdo */}
            <div className="overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{t("client")}</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{quote.tenant?.name ?? "—"}</p>
                  {quote.tenant?.code && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{quote.tenant.code}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{t("issueDate")}</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{fmtDate(quote.issue_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{t("expiryDate")}</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{fmtDate(quote.expiry_date) ?? t("noDate")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{t("currency")}</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{quote.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{t("status")}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>{t(labelKey)}</span>
                  </div>
                </div>

                {quote.department && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{t("department")}</p>
                    <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">{quote.department.name}</p>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="bg-[#0b1b3b] rounded-xl p-4">
                <p className="text-xs text-white/60 uppercase tracking-wide mb-1">{t("total")} {quote.currency}</p>
                <p className="text-2xl font-black text-white tabular-nums">${fmt(quote.total)}</p>
              </div>

              {quote.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{t("notes")}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border dark:border-gray-600">{quote.notes}</p>
                </div>
              )}
            </div>

            {/* Panel derecho: ítems */}
            <div className="overflow-y-auto p-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{t("items")}</p>
              <div className="border dark:border-gray-600 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_130px_120px] gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  <span>{t("descriptionLabel")}</span>
                  <span>{t("quantity")}</span>
                  <span>{t("unitPriceShort")}</span>
                  <span className="text-right">{t("total")}</span>
                </div>
                {(quote.items ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">{t("noItems")}</p>
                ) : (
                  (quote.items ?? []).map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_80px_130px_120px] gap-3 px-4 py-3 border-t dark:border-gray-600 text-sm items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <span className="text-gray-800 dark:text-gray-200">{item.description}</span>
                      <span className="text-gray-600 dark:text-gray-400">{item.quantity}</span>
                      <span className="text-gray-600 dark:text-gray-400">${fmt(item.unit_price)}</span>
                      <span className="text-right font-semibold text-gray-800 dark:text-gray-200">${fmt(item.total)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-700 flex items-center justify-end gap-2 shrink-0 bg-gray-50 dark:bg-gray-800/80 rounded-b-xl">
          <button onClick={onClose} className="text-sm border dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition">
            {t("close")}
          </button>
          {quote.status === "draft" && (
            <button onClick={() => changeStatus("sent")} disabled={loading}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
              <Send size={14} />{loading ? t("saving") : t("markSent")}
            </button>
          )}
          {["draft", "sent"].includes(quote.status) && (
            <button onClick={() => changeStatus("accepted")} disabled={loading}
              className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 transition">
              <CheckCircle size={14} />{loading ? t("saving") : t("markAccepted")}
            </button>
          )}
          {["draft", "sent"].includes(quote.status) && (
            <button onClick={() => changeStatus("rejected")} disabled={loading}
              className="flex items-center gap-1.5 bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 transition">
              <XCircle size={14} />{loading ? t("saving") : t("markRejected")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
