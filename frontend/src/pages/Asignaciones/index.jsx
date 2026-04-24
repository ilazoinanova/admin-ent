import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAssignments, toggleAssignment } from "../../api/assignments/assignment.service";
import AssignmentModal from "../../components/ui/Asignaciones/AssignmentModal";
import ServiceCard from "../../components/ui/Asignaciones/ServiceCard";

const SkeletonCard = () => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
    <div className="flex justify-between items-center">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    </div>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    ))}
  </div>
);

const SkeletonBlock = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5 space-y-4">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="flex gap-4">
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  </div>
);

const AssignmentsPage = () => {
  const { t } = useTranslation();
  const [tenants, setTenants]         = useState([]);
  const [services, setServices]       = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(null);
  const [modalOpen, setModalOpen]     = useState(false);
  const [loading, setLoading]         = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAssignments();
      setTenants(res.data.tenants);
      setServices(res.data.services);
      setAssignments(res.data.assignments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const isActive = (tenantId, serviceId) =>
    assignments.find((a) => a.tenant_id === tenantId && a.service_id === serviceId && a.status === 1);

  const handleToggle = async (tenantId, serviceId, checked) => {
    await toggleAssignment({ tenant_id: tenantId, service_id: serviceId, status: checked ? 1 : 0 });
    loadData();
  };

  const getStats = (tenantId) => {
    const active = assignments.filter((a) => a.tenant_id === tenantId && a.status === 1);
    return { total: services.length, active: active.length };
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("assignments")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("assignmentsSubtitle")}</p>
        </div>
        <input
          type="text"
          placeholder={t("searchCompany")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
          className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 px-3 py-2 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div className="space-y-6">
        {loading ? (
          [...Array(2)].map((_, i) => <SkeletonBlock key={i} />)
        ) : (
          tenants
            .filter((ten) => {
              if (!search) return true;
              const q = search.toLowerCase();

              const tenantMatch = [ten.name, ten.code, ten.email, ten.domain, ten.phone, ten.country, ten.city]
                .some((f) => f?.toLowerCase().includes(q));
              if (tenantMatch) return true;

              const serviceMatch = services.some((s) =>
                [s.name, s.code, s.description].some((f) => f?.toLowerCase().includes(q))
              );
              if (serviceMatch) return true;

              return assignments
                .filter((a) => a.tenant_id === ten.id && a.status === 1)
                .some((a) =>
                  [a.license_type, a.license_modalidad, a.billing_cycle, a.currency, a.development_type]
                    .some((f) => f?.toLowerCase().includes(q))
                );
            })
            .map((ten) => {
              const stats = getStats(ten.id);
              return (
                <div key={ten.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5 space-y-4">

                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{ten.name}</h2>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t("activeServiceManagement")}</p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <p className="text-gray-400 dark:text-gray-500">{t("activeCount")}</p>
                        <p className="font-semibold text-blue-600">{stats.active}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-gray-500">{t("services")}</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{stats.total}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {services.map((s) => {
                      const active = isActive(ten.id, s.id);
                      return (
                        <ServiceCard
                          key={s.id}
                          tenant={ten}
                          service={s}
                          data={active}
                          onToggle={handleToggle}
                          onEdit={(payload) => { setSelected(payload); setModalOpen(true); }}
                        />
                      );
                    })}
                  </div>

                  {stats.active === 0 && (
                    <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-6">
                      {t("noActiveServices")}
                    </div>
                  )}

                </div>
              );
            })
        )}
      </div>

      <AssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={selected}
        reload={loadData}
      />
    </div>
  );
};

export default AssignmentsPage;
