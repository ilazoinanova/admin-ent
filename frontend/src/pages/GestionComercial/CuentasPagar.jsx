import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Power, History, FileText, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { getPayables, createPayable, updatePayable, updatePayablePayment } from "../../api/payables/payable.service";
import { fmtDate } from "../../utils/date";
import PayableModal from "../../components/ui/CuentasPagar/PayableModal";
import PayableHistoryModal from "../../components/ui/CuentasPagar/PayableHistoryModal";
import ConfirmModal from "../../components/ui/ConfirmModal";

const STAT_CARDS = [
  { key: "total_monthly",  labelKey: "totalMonthly",   color: "text-gray-900 dark:text-gray-100" },
  { key: "paid_this_month", labelKey: "paidThisMonth", color: "text-green-600 dark:text-green-400" },
  { key: "pending_amount", labelKey: "pendingAmount",   color: "text-blue-600 dark:text-blue-400" },
  { key: "overdue_amount", labelKey: "overdueAmount",   color: "text-red-600 dark:text-red-400" },
];

const FREQ_KEYS = {
  monthly:   "freq_monthly",
  quarterly: "freq_quarterly",
  annual:    "freq_annual",
  one_time:  "freq_one_time",
};

const CAT_KEYS = {
  servicio:     "cat_servicio",
  mantenimiento: "cat_mantenimiento",
  arriendo:     "cat_arriendo",
  suscripcion:  "cat_suscripcion",
  otro:         "cat_otro",
};

export default function CuentasPagar() {
  const { t } = useTranslation();

  const [payables, setPayables]           = useState([]);
  const [stats, setStats]                 = useState({});
  const [meta, setMeta]                   = useState({});
  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter]   = useState("");
  const [debouncedCategory, setDebouncedCategory] = useState("");
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(false);

  const [modalOpen, setModalOpen]         = useState(false);
  const [selected, setSelected]           = useState(null);
  const [historyPayable, setHistoryPayable] = useState(null);
  const [confirmToggle, setConfirmToggle]   = useState(null);
  const [confirmQuickPay, setConfirmQuickPay] = useState(null); // { payable, payment }

  const loadPayables = async (s = debouncedSearch, cat = debouncedCategory, p = page) => {
    setLoading(true);
    try {
      const res = await getPayables({ search: s, category: cat || undefined, page: p });
      setPayables(res.data.data ?? []);
      setStats(res.data.stats ?? {});
      setMeta(res.data);
    } catch {
      toast.error(t("payableLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
      setDebouncedCategory(categoryFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  useEffect(() => {
    loadPayables(debouncedSearch, debouncedCategory, page);
  }, [debouncedSearch, debouncedCategory, page]);

  const handleSubmit = async (data) => {
    try {
      if (selected) {
        await updatePayable(selected.id, data);
        toast.success(t("payableUpdated"));
      } else {
        await createPayable(data);
        toast.success(t("payableCreated"));
      }
      setModalOpen(false);
      setSelected(null);
      loadPayables();
    } catch {
      toast.error(t("payableSaveError"));
    }
  };

  const handleConfirmToggle = async () => {
    try {
      await updatePayable(confirmToggle.id, { status: confirmToggle.status === 1 ? 0 : 1 });
      toast.success(confirmToggle.status === 1 ? t("payableDeactivated") : t("payableActivated"));
      setConfirmToggle(null);
      loadPayables();
    } catch {
      toast.error(t("changeStatusError"));
    }
  };

  const handleQuickMarkPaid = async () => {
    try {
      await updatePayablePayment(confirmQuickPay.payment.id, { status: "paid" });
      toast.success(t("paymentMarkedPaid"));
      setConfirmQuickPay(null);
      loadPayables();
    } catch {
      toast.error(t("paymentUpdateError"));
    }
  };

  const fmt = (n) => Number(n ?? 0).toLocaleString("es-CL");

  const MONTH_STATUS_COLORS = {
    paid:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    none:    "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };

  const grid = "grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_1fr_110px_80px_110px]";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("accountsPayable")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("payableSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t("searchPayable")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={loading}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">{t("allCategories")}</option>
            {Object.entries(CAT_KEYS).map(([v, k]) => (
              <option key={v} value={v}>{t(k)}</option>
            ))}
          </select>
          <button
            onClick={() => { setSelected(null); setModalOpen(true); }}
            disabled={loading}
            className="bg-[#0b1b3b] text-white text-sm px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-[#162d5e] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            <Plus size={15} /> {t("newPayable")}
          </button>
        </div>
      </div>

      {/* Tarjetas estadísticas */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {STAT_CARDS.map((s) => (
          <div key={s.key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">{t(s.labelKey)}</p>
            {["USD", "CLP"].map((currency) => (
              <div key={currency} className="flex items-baseline justify-between mt-1">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{currency}</span>
                <span className={`text-lg font-bold ${s.color}`}>${fmt(stats[currency]?.[s.key])}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Encabezado */}
        <div className={`grid ${grid} gap-3 px-4 py-3 bg-[#0b1b3b] text-white text-xs font-semibold`}>
          <span>{t("name")}</span>
          <span>{t("category")}</span>
          <span>{t("vendor")}</span>
          <span>{t("amount")}</span>
          <span>{t("currency")}</span>
          <span>{t("frequency")}</span>
          <span>{t("currentMonthPayment")}</span>
          <span>{t("status")}</span>
          <span className="text-right">{t("actions")}</span>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : payables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <FileText size={40} className="mb-3 opacity-30" />
            <p className="text-sm">{t("noPayables")}</p>
            <button onClick={() => { setSelected(null); setModalOpen(true); }} className="mt-3 text-sm text-blue-600 hover:underline">
              {t("createFirstPayable")}
            </button>
          </div>
        ) : (
          payables.map((pay) => (
            <div
              key={pay.id}
              className={`grid ${grid} gap-3 px-4 py-3 border-t dark:border-gray-700 items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition`}
            >
              <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{pay.name}</span>
              <span className="text-gray-600 dark:text-gray-400">{t(CAT_KEYS[pay.category] ?? pay.category)}</span>
              <span className="text-gray-500 dark:text-gray-400 truncate">{pay.vendor || "—"}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">${fmt(pay.amount)}</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{pay.currency}</span>
              <span className="text-gray-500 dark:text-gray-400">{t(FREQ_KEYS[pay.frequency] ?? pay.frequency)}</span>
              {/* Estado pago mes actual */}
              {(() => {
                const currentPayment = pay.payments?.[0] ?? null;
                const statusKey = currentPayment?.status ?? "none";
                const labelKey  = currentPayment ? `payStatus_${statusKey}` : "payStatus_none";
                return (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${MONTH_STATUS_COLORS[statusKey]}`}>
                    {t(labelKey)}
                  </span>
                );
              })()}
              <span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${pay.status === 1 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                  {pay.status === 1 ? t("active") : t("inactive")}
                </span>
              </span>
              <div className="flex items-center justify-end gap-3">
                {pay.payments?.[0] && ["pending", "overdue"].includes(pay.payments[0].status) && (
                  <button
                    onClick={() => setConfirmQuickPay({ payable: pay, payment: pay.payments[0] })}
                    disabled={loading}
                    title={t("markAsPaid")}
                    className="text-gray-400 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <CheckCircle size={15} />
                  </button>
                )}
                <button
                  onClick={() => setHistoryPayable(pay)}
                  disabled={loading}
                  title={t("paymentHistory")}
                  className="text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <History size={15} />
                </button>
                <button
                  onClick={() => { setSelected(pay); setModalOpen(true); }}
                  disabled={loading}
                  className="text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setConfirmToggle(pay)}
                  disabled={loading}
                  className={`disabled:opacity-50 disabled:cursor-not-allowed transition ${pay.status === 1 ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}`}
                >
                  <Power size={15} />
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
      <PayableModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelected(null); }}
        onSubmit={handleSubmit}
        initialData={selected}
      />

      {historyPayable && (
        <PayableHistoryModal
          payable={historyPayable}
          onClose={() => setHistoryPayable(null)}
          onUpdated={() => loadPayables()}
        />
      )}

      <ConfirmModal
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={handleConfirmToggle}
        title={confirmToggle?.status === 1 ? t("deactivatePayable") : t("activatePayable")}
        description={
          confirmToggle
            ? t(confirmToggle.status === 1 ? "deactivatePayableConfirm" : "activatePayableConfirm", { name: confirmToggle.name })
            : ""
        }
        confirmText={confirmToggle?.status === 1 ? t("deactivate") : t("activate")}
        type={confirmToggle?.status === 1 ? "danger" : "success"}
      />

      <ConfirmModal
        open={!!confirmQuickPay}
        onClose={() => setConfirmQuickPay(null)}
        onConfirm={handleQuickMarkPaid}
        title={t("markAsPaid")}
        description={t("markPayableAsPaidConfirm", { name: confirmQuickPay?.payable?.name })}
        confirmText={t("markAsPaidButton")}
        type="success"
      />
    </div>
  );
}
