import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, CheckCircle, XCircle, CalendarDays } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getPaymentPeriods,
  togglePaymentPeriodActive,
} from "../../api/periodos/periodoPago.service";
import PeriodFormModal from "../../components/ui/PeriodosPago/PeriodFormModal";

const TYPE_LABELS = { monthly: "Mensual", annual: "Anual" };

export default function PeriodosPago() {
  const { t } = useTranslation();

  const [periods, setPeriods]     = useState([]);
  const [meta, setMeta]           = useState({});
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage]           = useState(1);

  const [showForm, setShowForm]     = useState(false);
  const [editPeriod, setEditPeriod] = useState(null);
  const [toggling, setToggling]     = useState(null);

  const load = async (s = debouncedSearch, p = page, type = typeFilter) => {
    setLoading(true);
    try {
      const res = await getPaymentPeriods({
        search:    s || undefined,
        type:      type || undefined,
        page:      p,
        per_page:  15,
        sort:      "year",
        direction: "desc",
      });
      setPeriods(res.data.data ?? []);
      setMeta(res.data);
    } catch {
      toast.error(t("pp.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); load(debouncedSearch, 1, typeFilter); }, [debouncedSearch, typeFilter]);
  useEffect(() => { load(debouncedSearch, page, typeFilter); }, [page]);

  const handleSaved = () => {
    setShowForm(false);
    setEditPeriod(null);
    setPage(1);
    load(debouncedSearch, 1, typeFilter);
  };

  const handleToggle = async (period) => {
    setToggling(period.id);
    try {
      await togglePaymentPeriodActive(period.id);
      toast.success(period.active ? t("pp.deactivated") : t("pp.activated"));
      load(debouncedSearch, page, typeFilter);
    } catch {
      toast.error(t("pp.toggleError"));
    } finally {
      setToggling(null);
    }
  };

  const openEdit = (p) => { setEditPeriod(p); setShowForm(true); };

  const grid = "grid-cols-[1.5fr_1fr_1fr_1fr_1fr_90px]";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("pp.title")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("pp.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">{t("pp.allTypes")}</option>
            <option value="monthly">{t("pp.monthly")}</option>
            <option value="annual">{t("pp.annual")}</option>
          </select>
          <input
            type="text"
            placeholder={t("pp.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 rounded-md px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition">
              {t("clearFilters")}
            </button>
          )}
          <button
            onClick={() => { setEditPeriod(null); setShowForm(true); }}
            className="bg-[#0b1b3b] text-white text-sm px-4 py-2 rounded-md flex items-center gap-1.5 hover:bg-[#162d5e] transition"
          >
            <Plus size={15} /> {t("pp.addPeriod")}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className={`grid ${grid} gap-3 px-4 py-3 bg-[#0b1b3b] text-white text-xs font-semibold`}>
          <span>{t("pp.periodLabel")}</span>
          <span>{t("pp.type")}</span>
          <span>{t("pp.startDay")}</span>
          <span>{t("pp.endDay")}</span>
          <span>{t("pp.status")}</span>
          <span className="text-right">{t("actions")}</span>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : periods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <CalendarDays size={40} className="mb-3 opacity-30" />
            <p className="text-sm">{t("pp.noData")}</p>
            <button
              onClick={() => { setEditPeriod(null); setShowForm(true); }}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              {t("pp.addPeriod")}
            </button>
          </div>
        ) : (
          periods.map((p) => (
            <div
              key={p.id}
              className={`grid ${grid} gap-3 px-4 py-3 border-t dark:border-gray-700 items-center text-sm transition
                ${p.active ? "bg-green-50/60 dark:bg-green-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}
            >
              <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{p.label}</span>
              <span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                  ${p.type === "monthly"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                  }`}>
                  {TYPE_LABELS[p.type]}
                </span>
              </span>
              <span className="text-gray-600 dark:text-gray-400">{t("pp.dayN", { n: p.start_day })}</span>
              <span className="text-gray-600 dark:text-gray-400">{t("pp.dayN", { n: p.end_day })}</span>
              <span>
                {p.active ? (
                  <span className="text-green-600 dark:text-green-400 text-xs font-semibold">{t("pp.statusActive")}</span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">{t("pp.statusInactive")}</span>
                )}
              </span>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => openEdit(p)} title={t("edit")} className="text-gray-400 hover:text-blue-600 transition">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleToggle(p)}
                  disabled={toggling === p.id}
                  title={p.active ? t("pp.deactivate") : t("pp.activate")}
                  className="disabled:opacity-50 transition"
                >
                  {p.active ? (
                    <XCircle size={16} className="text-green-500 hover:text-red-500 transition" />
                  ) : (
                    <CheckCircle size={16} className="text-gray-300 dark:text-gray-600 hover:text-green-500 transition" />
                  )}
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

      {/* Modal */}
      {showForm && (
        <PeriodFormModal
          period={editPeriod}
          onClose={() => { setShowForm(false); setEditPeriod(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
