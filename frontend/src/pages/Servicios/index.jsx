import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DataTable from "../../components/ui/DataTable";
import { getServices, updateService, createService } from "../../api/services/service.service";
import ServiceModal from "../../components/ui/Services/ServiceModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import toast from "react-hot-toast";
import { Pencil, Power } from "lucide-react";

const SKELETON_COLS = 8;

const ServicesPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async (s = debouncedSearch, p = page) => {
    setLoading(true);
    try {
      const res = await getServices({ search: s, page: p });
      setData(res.data.data);
      setMeta(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    loadData(debouncedSearch, page);
  }, [debouncedSearch, page]);

  const handleSubmit = async (form) => {
    try {
      if (selected) {
        await updateService(selected.id, form);
        toast.success(t("serviceUpdated"));
      } else {
        await createService(form);
        toast.success(t("serviceCreated"));
      }
      setModalOpen(false);
      loadData();
    } catch {
      toast.error(t("serviceError"));
    }
  };

  const handleToggle = (item) => { setSelected(item); setConfirmOpen(true); };

  const confirmToggle = async () => {
    await updateService(selected.id, { ...selected, status: selected.status === 1 ? 0 : 1 });
    toast.success(t("statusUpdated"));
    setConfirmOpen(false);
    loadData();
  };

  const grid = "grid-cols-[2fr_1fr_3fr_1fr_1fr_1fr_1fr_1fr]";

  const columns = [
    { key: "name",        label: t("service") || t("services") },
    { key: "code",        label: t("code") },
    { key: "description", label: t("descriptionLabel") },
    { key: "price",       label: t("basePrice") },
    { key: "currency",    label: t("baseCurrency") },
    { key: "unit",        label: t("unit") },
    { key: "status",      label: t("status") },
    { key: "actions",     label: t("actions") },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("services")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("servicesSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t("search")}
            className="w-52 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={() => { setSelected(null); setModalOpen(true); }}
            disabled={loading}
            className="bg-[#0b1b3b] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#162d5e] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {t("newButton")}
          </button>
        </div>
      </div>

      <DataTable columns={columns} grid={grid}>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className={`grid ${grid} px-4 py-3 border-b dark:border-gray-700 items-center gap-2`}>
              {[...Array(SKELETON_COLS)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">{t("noServices")}</div>
        ) : (
          data.map((s) => (
            <div key={s.id} className={`grid ${grid} px-4 py-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition`}>
              <div className="dark:text-gray-200">{s.name}</div>
              <div className="dark:text-gray-300">{s.code}</div>
              <div className="dark:text-gray-300">{s.description}</div>
              <div className="font-medium text-gray-700 dark:text-gray-200">
                {(s.currency === "USD" || s.currency === "CLP") && "$"}
                {Number(s.price).toLocaleString("es-CL")}
                <span className="text-xs text-gray-400 ml-1">{s.currency}</span>
              </div>
              <div className="dark:text-gray-300">{s.currency}</div>
              <div className="dark:text-gray-300">{s.unit}</div>
              <div>
                <span className={s.status === 1 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  {s.status === 1 ? t("active") : t("inactive")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelected(s); setModalOpen(true); }}
                  disabled={loading}
                  className="text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleToggle(s)}
                  disabled={loading}
                  className={`disabled:opacity-50 disabled:cursor-not-allowed transition ${s.status === 1 ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}`}
                >
                  <Power size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </DataTable>

      <div className="flex justify-end mt-3 text-xs gap-2">
        <button
          disabled={!meta.prev_page_url || loading}
          onClick={() => setPage(page - 1)}
          className="px-2 py-1 border dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          {t("previous")}
        </button>
        <span className="text-gray-500 dark:text-gray-400">
          {t("page")} {meta.current_page} {t("of")} {meta.last_page}
        </span>
        <button
          disabled={!meta.next_page_url || loading}
          onClick={() => setPage(page + 1)}
          className="px-2 py-1 border dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          {t("next")}
        </button>
      </div>

      <ServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selected}
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmToggle}
        title={t("confirmAction")}
        description={t("changeStatusConfirm", { name: selected?.name })}
      />
    </div>
  );
};

export default ServicesPage;
