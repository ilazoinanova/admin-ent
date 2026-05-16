import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Eye, Pencil, FileText, Paperclip } from "lucide-react";
import { toast } from "react-hot-toast";
import { getPayables, getAllPayments } from "../../api/payables/payable.service";
import { fmtDate } from "../../utils/date";
import RegisterPaymentModal from "../../components/ui/CuentasPagar/RegisterPaymentModal";
import PaymentDetailModal   from "../../components/ui/CuentasPagar/PaymentDetailModal";

const STAT_CARDS = [
  { key: "total_monthly",     labelKey: "totalMonthly",       color: "text-gray-900 dark:text-gray-100" },
  { key: "registered_amount", labelKey: "registeredThisMonth", color: "text-blue-600 dark:text-blue-400" },
  { key: "paid_amount",       labelKey: "paidThisMonth",       color: "text-green-600 dark:text-green-400" },
];

export default function RegistroPagos() {
  const { t } = useTranslation();

  // Stats (llamada separada a getPayables)
  const [stats, setStats] = useState({});

  // Lista de pagos
  const [payments, setPayments]             = useState([]);
  const [meta, setMeta]                     = useState({});
  const [loading, setLoading]               = useState(false);
  const [search, setSearch]                 = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [periodFilter, setPeriodFilter]     = useState("");
  const [page, setPage]                     = useState(1);

  // Modales
  const [showRegister, setShowRegister]     = useState(false);
  const [detailPayment, setDetailPayment]   = useState(null);
  const [detailMode, setDetailMode]         = useState("view");

  // ── Stats ───────────────────────────────────────────────────────────────────
  const loadStats = async () => {
    try {
      const res = await getPayables({ per_page: 1, page: 1 });
      setStats(res.data.stats ?? {});
    } catch { /* silencioso */ }
  };

  // ── Lista de pagos ──────────────────────────────────────────────────────────
  const loadPayments = async (s = debouncedSearch, per = periodFilter, p = page) => {
    setLoading(true);
    try {
      const res = await getAllPayments({
        search:  s   || undefined,
        period:  per || undefined,
        page:    p,
      });
      setPayments(res.data.data ?? []);
      setMeta(res.data);
    } catch {
      toast.error(t("paymentLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Recarga cuando cambian filtros
  useEffect(() => {
    setPage(1);
    loadPayments(debouncedSearch, periodFilter, 1);
  }, [debouncedSearch, periodFilter]);

  // Recarga cuando cambia la página
  useEffect(() => {
    loadPayments(debouncedSearch, periodFilter, page);
  }, [page]);

  const handleRegistered = () => {
    loadPayments(debouncedSearch, periodFilter, 1);
    setPage(1);
    loadStats();
  };

  const handleUpdated = () => {
    loadPayments(debouncedSearch, periodFilter, page);
    loadStats();
  };

  const openDetail = (payment) => { setDetailPayment(payment); setDetailMode("view"); };
  const openEdit   = (payment) => { setDetailPayment(payment); setDetailMode("edit"); };

  const fmt = (n) => Number(n ?? 0).toLocaleString("es-CL");

  const grid = "grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr_110px_80px]";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("paymentLedger")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("paymentLedgerSubtitle")}</p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="bg-[#0b1b3b] text-white text-sm px-4 py-2 rounded-md flex items-center gap-1.5 hover:bg-[#162d5e] transition"
        >
          <Plus size={15} /> {t("registerPayment")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {STAT_CARDS.map((s) => (
          <div key={s.key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">{t(s.labelKey)}</p>
            {["USD", "CLP"].map((cur) => (
              <div key={cur} className="flex items-baseline justify-between mt-1">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{cur}</span>
                <span className={`text-lg font-bold ${s.color}`}>${fmt(stats[cur]?.[s.key])}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          placeholder={t("searchPayable")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
          className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
        />
        <input
          type="month"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          disabled={loading}
          className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
        />
        {(search || periodFilter) && (
          <button
            onClick={() => { setSearch(""); setPeriodFilter(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className={`grid ${grid} gap-3 px-4 py-3 bg-[#0b1b3b] text-white text-xs font-semibold`}>
          <span>{t("accountsPayable")}</span>
          <span>{t("vendor")}</span>
          <span>{t("period")}</span>
          <span>{t("dueDate")}</span>
          <span>{t("refAmount")}</span>
          <span>{t("amountPaid")}</span>
          <span>{t("comprobante")}</span>
          <span className="text-right">{t("actions")}</span>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <FileText size={40} className="mb-3 opacity-30" />
            <p className="text-sm">{t("noPaymentsRegistered")}</p>
            <button
              onClick={() => setShowRegister(true)}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              {t("registerPayment")}
            </button>
          </div>
        ) : (
          payments.map((pay) => (
            <div
              key={pay.id}
              className={`grid ${grid} gap-3 px-4 py-3 border-t dark:border-gray-700 items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition`}
            >
              <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                {pay.payable?.name ?? "—"}
              </span>
              <span className="text-gray-500 dark:text-gray-400 truncate">
                {pay.payable?.vendor || "—"}
              </span>
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                {pay.period}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {fmtDate(pay.due_date) ?? "—"}
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                ${fmt(pay.amount)}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {pay.amount_paid != null ? `$${fmt(pay.amount_paid)}` : "—"}
              </span>
              <span className="flex justify-center items-center">
                {pay.comprobante_path && (
                  <span className="relative group flex items-center">
                    <Paperclip size={13} className="text-gray-400" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-gray-800 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {pay.comprobante_name ?? t("comprobanteFile")}
                    </span>
                  </span>
                )}
              </span>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => openDetail(pay)}
                  title={t("viewDetail")}
                  className="text-gray-400 hover:text-blue-600 transition"
                >
                  <Eye size={15} />
                </button>
                <button
                  onClick={() => openEdit(pay)}
                  title={t("editPayment")}
                  className="text-gray-400 hover:text-blue-600 transition"
                >
                  <Pencil size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between text-sm mt-3">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {t("page")} {meta.current_page ?? 1} {t("of")} {meta.last_page ?? 1}
          {meta.total != null && <span className="ml-2">· {meta.total} {t("records")}</span>}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={!meta.prev_page_url || loading}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border dark:border-gray-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition"
          >
            {t("previous")}
          </button>
          <button
            disabled={!meta.next_page_url || loading}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border dark:border-gray-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition"
          >
            {t("next")}
          </button>
        </div>
      </div>

      {/* Modales */}
      <RegisterPaymentModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={handleRegistered}
      />

      {detailPayment && (
        <PaymentDetailModal
          key={detailPayment.id}
          payment={detailPayment}
          initialMode={detailMode}
          onClose={() => setDetailPayment(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
