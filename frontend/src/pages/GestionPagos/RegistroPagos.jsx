import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Eye, Pencil, FileText, Paperclip, CalendarDays, ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";
import { initializePaymentPeriod, createAdditionalPayment } from "../../api/payables/payable.service";
import { getAllPaymentPeriods } from "../../api/periodos/periodoPago.service";
import { updatePayablePayment } from "../../api/payables/payable.service";
import { fmtDate } from "../../utils/date";
import PaymentDetailModal from "../../components/ui/CuentasPagar/PaymentDetailModal";
import AdditionalPaymentModal from "../../components/ui/CuentasPagar/AdditionalPaymentModal";

const fmt = (n) => Number(n ?? 0).toLocaleString("es-CL");

export default function RegistroPagos() {
  const { t } = useTranslation();

  // Períodos
  const [periods, setPeriods]           = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Lista de pagos del período
  const [payments, setPayments]         = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Modales
  const [detailPayment, setDetailPayment]   = useState(null);
  const [detailMode, setDetailMode]         = useState("view");
  const [showAdditional, setShowAdditional] = useState(false);

  // ── Cargar períodos ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingPeriods(true);
      try {
        const res = await getAllPaymentPeriods({ sort: "year", direction: "desc" });
        const all = res.data.data ?? [];
        setPeriods(all);
        // Auto-seleccionar el período activo si existe
        const active = all.find((p) => p.active);
        if (active) {
          handleSelectPeriod(String(active.id), all);
        }
      } catch {
        toast.error(t("rp.periodsLoadError"));
      } finally {
        setLoadingPeriods(false);
      }
    };
    load();
  }, []);

  // ── Inicializar período seleccionado ─────────────────────────────────────────
  const handleSelectPeriod = async (id, periodList = null) => {
    setSelectedPeriodId(id);
    if (!id) { setPayments([]); setSelectedPeriod(null); return; }

    const list   = periodList ?? periods;
    const period = list.find((p) => String(p.id) === id) ?? null;
    setSelectedPeriod(period);
    setLoadingPayments(true);
    try {
      const res = await initializePaymentPeriod(id);
      setPayments(res.data.payments ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t("rp.initError"));
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const reloadPeriod = async () => {
    if (!selectedPeriodId) return;
    setLoadingPayments(true);
    try {
      const res = await initializePaymentPeriod(selectedPeriodId);
      setPayments(res.data.payments ?? []);
    } catch { /* silencioso */ }
    finally { setLoadingPayments(false); }
  };

  const openDetail = (pay) => { setDetailPayment(pay); setDetailMode("view"); };
  const openEdit   = (pay) => { setDetailPayment(pay); setDetailMode("edit"); };

  // Stats del período actual
  const templateRows   = payments.filter((p) => !p.is_additional);
  const additionalRows = payments.filter((p) => p.is_additional);
  const totalAmount    = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPaid      = payments.reduce((s, p) => s + (p.amount_paid ?? 0), 0);

  const grid = "grid-cols-[2.2fr_1.2fr_1fr_1fr_1fr_90px_70px]";

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("paymentLedger")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("rp.subtitle")}</p>
        </div>
        {selectedPeriodId && (
          <button
            onClick={() => setShowAdditional(true)}
            className="bg-[#0b1b3b] text-white text-sm px-4 py-2 rounded-md flex items-center gap-1.5 hover:bg-[#162d5e] transition"
          >
            <Plus size={15} /> {t("rp.addAdditional")}
          </button>
        )}
      </div>

      {/* Selector de período */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <CalendarDays size={14} className="text-gray-400 shrink-0" />
        <div className="relative">
          <select
            value={selectedPeriodId}
            onChange={(e) => handleSelectPeriod(e.target.value)}
            disabled={loadingPeriods || loadingPayments}
            className="appearance-none border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
          >
            <option value="">{loadingPeriods ? t("rp.loadingPeriods") : t("rp.choosePeriod")}</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.active ? "● " : ""}{p.label} — {p.type === "monthly" ? t("pp.monthly") : t("pp.annual")}
                {p.active ? ` (${t("pp.statusActive")})` : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {selectedPeriod && (
          <>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {t("rp.rangeInfo", { start: selectedPeriod.start_day, end: selectedPeriod.end_day })}
            </span>
            <span className={`text-xs font-semibold ${selectedPeriod.active ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
              {selectedPeriod.active ? `● ${t("pp.statusActive")}` : `○ ${t("pp.statusInactive")}`}
            </span>
          </>
        )}
      </div>

      {/* Stats del período */}
      {selectedPeriodId && !loadingPayments && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label={t("rp.statAccounts")}    value={templateRows.length}   color="text-gray-800 dark:text-gray-100" />
          <StatCard label={t("rp.statAdditionals")} value={additionalRows.length} color="text-purple-600 dark:text-purple-400" />
          <StatCard label={t("rp.statTotal")}        value={`$${fmt(totalAmount)}`}  color="text-gray-800 dark:text-gray-100" money />
          <StatCard label={t("rp.statPaid")}         value={`$${fmt(totalPaid)}`}    color="text-green-600 dark:text-green-400" money />
        </div>
      )}

      {/* Estado inicial: sin período seleccionado */}
      {!selectedPeriodId && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <CalendarDays size={48} className="mb-3 opacity-20" />
          <p className="text-sm">{t("rp.noperiodSelected")}</p>
          <p className="text-xs mt-1 opacity-70">{t("rp.selectToLoad")}</p>
        </div>
      )}

      {/* Tabla */}
      {selectedPeriodId && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {/* Header tabla */}
          <div className={`grid ${grid} gap-3 px-4 py-3 bg-[#0b1b3b] text-white text-xs font-semibold`}>
            <span>{t("rp.colName")}</span>
            <span>{t("vendor")}</span>
            <span>{t("dueDate")}</span>
            <span>{t("refAmount")}</span>
            <span>{t("amountPaid")}</span>
            <span className="text-center">{t("comprobante")}</span>
            <span className="text-right">{t("actions")}</span>
          </div>

          {loadingPayments ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400 dark:text-gray-500">
              <FileText size={38} className="mb-3 opacity-30" />
              <p className="text-sm">{t("rp.noPayables")}</p>
            </div>
          ) : (
            <>
              {/* Filas de plantilla (cuentas por pagar) */}
              {templateRows.length > 0 && (
                <>
                  <SectionHeader label={t("rp.sectionAccounts")} count={templateRows.length} />
                  {templateRows.map((pay) => (
                    <PaymentRow
                      key={pay.id}
                      pay={pay}
                      grid={grid}
                      onView={() => openDetail(pay)}
                      onEdit={() => openEdit(pay)}
                    />
                  ))}
                </>
              )}

              {/* Filas adicionales */}
              {additionalRows.length > 0 && (
                <>
                  <SectionHeader label={t("rp.sectionAdditionals")} count={additionalRows.length} additional />
                  {additionalRows.map((pay) => (
                    <PaymentRow
                      key={pay.id}
                      pay={pay}
                      grid={grid}
                      additional
                      onView={() => openDetail(pay)}
                      onEdit={() => openEdit(pay)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Modales */}
      {detailPayment && (
        <PaymentDetailModal
          key={detailPayment.id}
          payment={detailPayment}
          initialMode={detailMode}
          onClose={() => setDetailPayment(null)}
          onUpdated={() => { setDetailPayment(null); reloadPeriod(); }}
        />
      )}

      {showAdditional && selectedPeriod && (
        <AdditionalPaymentModal
          period={selectedPeriod}
          onClose={() => setShowAdditional(false)}
          onSaved={() => { setShowAdditional(false); reloadPeriod(); }}
        />
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, money }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color} ${money ? "text-base" : ""}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ label, count, additional = false }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-t dark:border-gray-700
      ${additional ? "bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400"
                   : "bg-gray-50 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400"}`}>
      {label}
      <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5 text-[10px]">
        {count}
      </span>
    </div>
  );
}

function PaymentRow({ pay, grid, additional, onView, onEdit }) {
  const name   = additional
    ? (pay.title ?? "—")
    : (pay.payable?.name ?? "—");
  const vendor = additional
    ? "—"
    : (pay.payable?.vendor || "—");

  return (
    <div
      className={`grid ${grid} gap-3 px-4 py-3 border-t dark:border-gray-700 items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition
        ${pay.amount_paid != null ? "bg-green-50/40 dark:bg-green-900/5" : ""}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {additional && (
          <span className="shrink-0 inline-block w-1.5 h-1.5 rounded-full bg-purple-400" />
        )}
        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{name}</span>
      </div>
      <span className="text-gray-500 dark:text-gray-400 truncate">{vendor}</span>
      <span className="text-gray-600 dark:text-gray-400 text-xs">{fmtDate(pay.due_date) ?? "—"}</span>
      <span className="font-semibold text-gray-800 dark:text-gray-200">${Number(pay.amount ?? 0).toLocaleString("es-CL")}</span>
      <span className={pay.amount_paid != null ? "text-green-600 dark:text-green-400 font-semibold" : "text-gray-400"}>
        {pay.amount_paid != null ? `$${Number(pay.amount_paid).toLocaleString("es-CL")}` : "—"}
      </span>
      <div className="flex justify-center">
        {pay.comprobante_path && (
          <span className="relative group flex items-center">
            <Paperclip size={13} className="text-gray-400" />
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-gray-800 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition z-10">
              {pay.comprobante_name ?? "Comprobante"}
            </span>
          </span>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={onView} title="Ver detalle" className="text-gray-400 hover:text-blue-600 transition">
          <Eye size={15} />
        </button>
        <button onClick={onEdit} title="Editar" className="text-gray-400 hover:text-blue-600 transition">
          <Pencil size={15} />
        </button>
      </div>
    </div>
  );
}
