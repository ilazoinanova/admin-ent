import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Eye, CheckCircle, XCircle, Trash2, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { getQuotes, updateQuote, deleteQuote } from "../../api/quotes/quote.service";
import { fmtDate } from "../../utils/date";
import QuoteCreateModal from "../../components/ui/Cotizaciones/QuoteCreateModal";
import QuoteDetailModal from "../../components/ui/Cotizaciones/QuoteDetailModal";
import ConfirmModal from "../../components/ui/ConfirmModal";

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

const STAT_CARDS = [
  { key: "total_quoted",   labelKey: "totalQuoted",    color: "text-gray-900 dark:text-gray-100" },
  { key: "total_accepted", labelKey: "totalAccepted",  color: "text-green-600 dark:text-green-400" },
  { key: "total_pending",  labelKey: "pendingQuotes",  color: "text-blue-600 dark:text-blue-400" },
  { key: "total_rejected", labelKey: "rejectedQuotes", color: "text-red-600 dark:text-red-400" },
];

export default function Cotizaciones() {
  const { t } = useTranslation();
  const [quotes, setQuotes]           = useState([]);
  const [stats, setStats]             = useState({});
  const [meta, setMeta]               = useState({});
  const [search, setSearch]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]       = useState("");
  const [debouncedStatus, setDebouncedStatus] = useState("");
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [createOpen, setCreateOpen]   = useState(false);
  const [detailQuote, setDetailQuote] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadQuotes = async (s = debouncedSearch, st = debouncedStatus, p = page) => {
    setLoading(true);
    try {
      const res = await getQuotes({ search: s, page: p, status: st || undefined });
      setQuotes(res.data.data ?? []);
      setStats(res.data.stats ?? {});
      setMeta(res.data);
    } catch {
      toast.error(t("quoteLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
      setDebouncedStatus(statusFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  useEffect(() => {
    loadQuotes(debouncedSearch, debouncedStatus, page);
  }, [debouncedSearch, debouncedStatus, page]);

  const handleDelete = async () => {
    try {
      await deleteQuote(confirmDelete.id);
      toast.success(t("quoteDeleted"));
      setConfirmDelete(null);
      loadQuotes();
    } catch {
      toast.error(t("quoteDeleteError"));
    }
  };

  const fmt      = (n) => Number(n ?? 0).toLocaleString("es-CL");
  const statKeys = Object.keys(stats);
  const mainCurrency = statKeys[0] ?? "CLP";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("quotes")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("quotesSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t("searchQuote")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={loading}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60"
          >
            <option value="">{t("allStatuses")}</option>
            <option value="draft">{t("statusDraft")}</option>
            <option value="sent">{t("statusSent")}</option>
            <option value="accepted">{t("quoteAccepted")}</option>
            <option value="rejected">{t("quoteRejected")}</option>
            <option value="expired">{t("quoteExpired")}</option>
          </select>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm px-4 py-1.5 rounded-lg transition font-medium"
          >
            <Plus size={15} /> {t("newQuote")}
          </button>
        </div>
      </div>

      {/* Stats */}
      {statKeys.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map(({ key, labelKey, color }) => (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t(labelKey)}</p>
              {statKeys.map((cur) => (
                <div key={cur} className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold tabular-nums ${color}`}>
                    ${fmt(stats[cur]?.[key] ?? 0)}
                  </span>
                  <span className="text-xs text-gray-400">{cur}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
            <tr>
              {[t("quoteNumber"), t("client"), t("issueDate"), t("expiryDate"), t("total"), t("status"), t("actions")].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {loading && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">{t("loading")}...</td></tr>
            )}
            {!loading && quotes.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <FileText size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("noQuotes")}</p>
                  <button onClick={() => setCreateOpen(true)} className="mt-3 text-sm text-teal-600 hover:underline">{t("createFirstQuote")}</button>
                </td>
              </tr>
            )}
            {!loading && quotes.map((quote) => {
              const colorClass = STATUS_COLORS[quote.status] ?? STATUS_COLORS.draft;
              const labelKey   = STATUS_KEYS[quote.status]   ?? "statusDraft";
              return (
                <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{quote.quote_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{quote.tenant?.name ?? "—"}</p>
                    {quote.department && <p className="text-xs text-teal-600 dark:text-teal-400">{quote.department.name}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{fmtDate(quote.issue_date)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                    {fmtDate(quote.expiry_date) ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                    ${fmt(quote.total)} <span className="text-xs font-normal text-gray-400">{quote.currency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorClass}`}>{t(labelKey)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailQuote(quote)} title={t("viewDetails")}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">
                        <Eye size={14} />
                      </button>
                      {["draft", "sent"].includes(quote.status) && (
                        <button
                          onClick={async () => {
                            try { await updateQuote(quote.id, { status: "accepted" }); toast.success(t("quoteStatusUpdated")); loadQuotes(); }
                            catch { toast.error(t("quoteUpdateError")); }
                          }}
                          title={t("markAccepted")}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {["draft", "sent"].includes(quote.status) && (
                        <button
                          onClick={async () => {
                            try { await updateQuote(quote.id, { status: "rejected" }); toast.success(t("quoteStatusUpdated")); loadQuotes(); }
                            catch { toast.error(t("quoteUpdateError")); }
                          }}
                          title={t("markRejected")}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                          <XCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => setConfirmDelete(quote)} title={t("deleteQuote")}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Paginación */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("page")} {meta.current_page} {t("of")} {meta.last_page}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs border dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition">
                {t("previous")}
              </button>
              <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
                className="px-3 py-1 text-xs border dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition">
                {t("next2")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {createOpen && (
        <QuoteCreateModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); loadQuotes(); }}
        />
      )}
      {detailQuote && (
        <QuoteDetailModal
          quote={detailQuote}
          onClose={() => setDetailQuote(null)}
          onStatusChange={() => { setDetailQuote(null); loadQuotes(); }}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title={t("deleteQuote")}
          message={t("deleteQuoteConfirm", { number: confirmDelete.quote_number })}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
