import { useState, useEffect } from "react";
import { X, FileText, Loader2, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { getIntegrationDocuments } from "../../../api/invoices/invoice.service";
import { fmtPeriodDate } from "../../../utils/billingPeriod";

export default function InvoiceIntegrationViewModal({ invoice, onClose }) {
  const { t } = useTranslation();
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    getIntegrationDocuments({
      tenant_id:     invoice.tenant_id,
      department_id: invoice.department_id ?? undefined,
      period_from:   invoice.period_from,
      period_to:     invoice.period_to,
    })
      .then((res) => { if (!cancelled) setDocs(res.data?.documents ?? []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [invoice.tenant_id, invoice.department_id, invoice.period_from, invoice.period_to]);

  const handleExcel = () => {
    const rows = docs.map((doc, i) => ({
      "#":                        i + 1,
      [t("date")]:                fmtPeriodDate(doc.date),
      [t("integrationProject")]:  String(doc.project_id),
      [t("integrationSystem")]:   doc.system_integration_name,
      [t("integrationOtNumber")]: doc.ot_number,
      [t("integrationReportType")]: doc.report_type,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Docs Integración");
    XLSX.writeFile(wb, `integraciones-${invoice.invoice_number}.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 flex flex-col w-full max-w-4xl max-h-[85vh]">

        {/* Header */}
        <div className="bg-[#0b1b3b] text-white px-5 py-4 rounded-t-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <FileText size={16} className="text-emerald-400" />
            <div>
              <p className="text-sm font-semibold">{t("integrationDocsInvoiced")}</p>
              <p className="text-xs text-white/50 mt-0.5">
                {invoice.invoice_number} · {fmtPeriodDate(invoice.period_from)} → {fmtPeriodDate(invoice.period_to)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && !error && docs.length > 0 && (
              <button
                type="button"
                onClick={handleExcel}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition"
              >
                <Download size={12} /> {t("downloadExcel")}
              </button>
            )}
            <button onClick={onClose} className="text-white/60 hover:text-white transition ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 py-16">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">{t("loading")}</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center py-16 text-sm text-red-500 dark:text-red-400">
              {t("integrationDocsError")}
            </div>
          ) : docs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-16 text-sm text-gray-400 dark:text-gray-500">
              {t("integrationDocsEmpty")}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-10">#</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-28">{t("date")}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-24">{t("integrationProject")}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("integrationSystem")}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("integrationOtNumber")}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("integrationReportType")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {docs.map((doc, i) => (
                      <tr
                        key={i}
                        className={i % 2 !== 0 ? "bg-gray-50/50 dark:bg-gray-700/20" : ""}
                      >
                        <td className="px-4 py-2.5 text-gray-400 dark:text-gray-500 tabular-nums">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-200 tabular-nums whitespace-nowrap">
                          {fmtPeriodDate(doc.date)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 tabular-nums">{doc.project_id}</td>
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                            {doc.system_integration_name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-gray-700 dark:text-gray-200">{doc.ot_number}</td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {doc.report_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 px-5 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/60">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t("integrationDocsDedup")}
                </span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {docs.length} {t("documentsProcessed")}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
