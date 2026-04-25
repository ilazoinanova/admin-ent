import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getTenants,
  updateTenant,
  createTenant,
} from "../../api/tenants/tenant.service";
import DataTable from "../../components/ui/DataTable";
import { Pencil, Power } from "lucide-react";
import TenantDetailModal from "../../components/ui/Tenants/TenantDetailModal";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

const SKELETON_COLS = 9;

const TenantsPage = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  const loadTenants = async (s = debouncedSearch, p = page) => {
    setLoading(true);
    try {
      const res = await getTenants({ search: s, page: p });
      setTenants(res.data.data);
      setMeta(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce: actualiza debouncedSearch y resetea página (React 18 batchea ambos setState)
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  // Única carga: dispara cuando cambia debouncedSearch o page
  useEffect(() => {
    loadTenants(debouncedSearch, page);
  }, [debouncedSearch, page]);

  const columns = [
    { key: "name",        label: t("name") },
    { key: "code",        label: t("code") },
    { key: "domain",      label: t("domain") },
    { key: "email",       label: t("email") },
    { key: "country",     label: t("country") },
    { key: "city",        label: t("city") },
    { key: "departments", label: t("departments"), className: "text-center" },
    { key: "status",      label: t("status") },
    { key: "actions",     label: t("actions") },
  ];

  const grid = "grid-cols-[2fr_1fr_1.5fr_1.8fr_1fr_1fr_2fr_0.8fr_0.8fr]";

  const handleCreate = () => { setSelectedTenant(null); setDetailOpen(true); };
  const handleEdit   = (tenant) => { setSelectedTenant(tenant); setDetailOpen(true); };

  const handleDetailSubmit = async (data) => {
    try {
      if (selectedTenant?.id) {
        await updateTenant(selectedTenant.id, data);
        toast.success(t("companyUpdated"));
        setDetailOpen(false);
      } else {
        const res = await createTenant(data);
        toast.success(t("companyCreated"));
        // Mantiene el modal abierto con el tenant recién creado para configurar deps/facturación
        setSelectedTenant(res.data);
      }
      loadTenants();
    } catch (error) {
      toast.error(t("companySaveError"));
      console.error(error);
    }
  };

  const handleToggleClick = (tenant) => { setSelectedTenant(tenant); setConfirmOpen(true); };

  const handleConfirmToggle = async () => {
    try {
      await updateTenant(selectedTenant.id, {
        ...selectedTenant,
        status: selectedTenant.status === 1 ? 0 : 1,
      });
      toast.success(selectedTenant.status === 1 ? t("companyDeactivated") : t("companyActivated"));
      setConfirmOpen(false);
      loadTenants();
    } catch {
      toast.error(t("changeStatusError"));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("companies")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("tenantsSubtitle")}</p>
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
            onClick={handleCreate}
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
        ) : tenants.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">{t("noTenants")}</div>
        ) : (
          tenants.map((ten) => (
            <div
              key={ten.id}
              className={`grid ${grid} px-4 py-3 border-b dark:border-gray-700 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition`}
            >
              <div className="font-medium text-gray-700 dark:text-gray-200">{ten.name}</div>
              <div className="text-gray-500 dark:text-gray-400">{ten.code}</div>
              <div className="text-gray-500 dark:text-gray-400">{ten.domain || "-"}</div>
              <div className="text-gray-500 dark:text-gray-400">{ten.email || "-"}</div>
              <div className="text-gray-500 dark:text-gray-400">{ten.country || "-"}</div>
              <div className="text-gray-500 dark:text-gray-400">{ten.city || "-"}</div>
              <div className="text-gray-500 dark:text-gray-400 text-center">
                {ten.departments_count > 0 ? ten.departments_count : "-"}
              </div>
              <div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  ten.status === 1
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {ten.status === 1 ? t("active") : t("inactive")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEdit(ten)}
                  disabled={loading}
                  className="text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleToggleClick(ten)}
                  disabled={loading}
                  className={`disabled:opacity-50 disabled:cursor-not-allowed transition ${ten.status === 1 ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}`}
                >
                  <Power size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </DataTable>

      <div className="flex justify-end items-center gap-2 mt-3 text-xs">
        <button
          disabled={!meta.prev_page_url || loading}
          onClick={() => setPage(page - 1)}
          className="px-2 py-1 border dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          {t("previous")}
        </button>
        <span className="text-gray-500 dark:text-gray-400">
          {t("page")} {meta.current_page || 1} {t("of")} {meta.last_page || 1}
        </span>
        <button
          disabled={!meta.next_page_url || loading}
          onClick={() => setPage(page + 1)}
          className="px-2 py-1 border dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          {t("next")}
        </button>
      </div>

      <TenantDetailModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedTenant(null); }}
        onSubmit={handleDetailSubmit}
        tenant={selectedTenant}
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
        title={selectedTenant?.status === 1 ? t("deactivateCompany") : t("activateCompany")}
        description={
          selectedTenant
            ? t(selectedTenant.status === 1 ? "deactivateCompanyConfirm" : "activateCompanyConfirm", { name: selectedTenant.name })
            : ""
        }
        confirmText={selectedTenant?.status === 1 ? t("deactivate") : t("activate")}
        type={selectedTenant?.status === 1 ? "danger" : "success"}
      />
    </div>
  );
};

export default TenantsPage;
