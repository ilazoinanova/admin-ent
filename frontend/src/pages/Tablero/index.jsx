import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { Building2, FileText, AlertTriangle, Clock } from "lucide-react";
import { getDashboard } from "../../api/dashboard/dashboard.service";
import { fmtDate } from "../../utils/date";

const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const STATUS_COLORS = {
  draft:     "#9ca3af",
  sent:      "#3b82f6",
  paid:      "#22c55e",
  overdue:   "#ef4444",
  cancelled: "#6b7280",
};

const STATUS_LABELS = {
  draft:     "Borrador",
  sent:      "Enviada",
  paid:      "Pagada",
  overdue:   "Vencida",
  cancelled: "Cancelada",
};

const PAYMENT_STATUS_COLORS = {
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const INV_STATUS_COLORS = {
  draft:     "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  sent:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500",
};

function fmtMonth(ym) {
  const [, m] = ym.split("-");
  return MONTHS_ES[parseInt(m, 10) - 1];
}

function buildMonthlyChartData(raw) {
  const map = {};
  raw.forEach(({ month, currency, total }) => {
    if (!map[month]) map[month] = { month: fmtMonth(month) };
    map[month][currency] = (map[month][currency] ?? 0) + parseFloat(total);
  });
  return Object.values(map);
}

function buildPieData(byStatus) {
  return Object.entries(byStatus).map(([status, count]) => ({
    name:  STATUS_LABELS[status] ?? status,
    value: parseInt(count, 10),
    color: STATUS_COLORS[status] ?? "#9ca3af",
  }));
}

const fmt = (n) => Number(n ?? 0).toLocaleString("es-CL");

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey}: ${fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const monthlyChart = data ? buildMonthlyChartData(data.monthly_invoicing) : [];
  const pieData      = data ? buildPieData(data.invoice_by_status) : [];

  const hasCLP = monthlyChart.some((d) => d.CLP);
  const hasUSD = monthlyChart.some((d) => d.USD);

  return (
    <div className="space-y-6">

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">

        {/* Compañías */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate("/tenants")}>
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("companies")}</p>
            {loading ? <div className="h-7 w-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mt-1" /> : (
              <>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{data?.companies?.active ?? 0}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t("of")} {data?.companies?.total ?? 0} {t("totalLabel")}</p>
              </>
            )}
          </div>
        </div>

        {/* Facturación pendiente */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate("/facturacion")}>
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("pendingInvoices")}</p>
            {loading ? <div className="h-7 w-24 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mt-1" /> : (
              <>
                {["USD", "CLP"].map((cur) => (
                  <div key={cur} className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{cur}</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">${fmt(data?.invoice_stats?.[cur]?.total_pending)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Pagos vencidos */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate("/cuentas-pagar")}>
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("overduePayments")}</p>
            {loading ? <div className="h-7 w-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mt-1" /> : (
              <>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data?.payable_stats?.overdue_count ?? 0}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t("paymentsPending")}: {data?.payable_stats?.pending_count ?? 0}</p>
              </>
            )}
          </div>
        </div>

        {/* Pagos pendientes este mes */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate("/cuentas-pagar")}>
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("pendingThisMonth")}</p>
            {loading ? <div className="h-7 w-24 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mt-1" /> : (
              <>
                {["USD", "CLP"].map((cur) => (
                  <div key={cur} className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{cur}</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">${fmt(data?.pending_payables_by_currency?.[cur])}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-3 gap-4">

        {/* Barras: facturación mensual */}
        <div className="col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{t("monthlyBilling")}</h3>
            <span className="text-xs text-gray-400">{t("last6Months")}</span>
          </div>
          {loading ? (
            <div className="h-56 bg-gray-50 dark:bg-gray-700/30 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyChart} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                {hasCLP && <Bar dataKey="CLP" fill="#3b82f6" radius={[4, 4, 0, 0]} />}
                {hasUSD && <Bar dataKey="USD" fill="#8b5cf6" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut: estados de facturas */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-4">{t("invoicesByStatus")}</h3>
          {loading ? (
            <div className="h-56 bg-gray-50 dark:bg-gray-700/30 rounded animate-pulse" />
          ) : pieData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">{t("noInvoices")}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Tablas inferiores */}
      <div className="grid grid-cols-2 gap-4">

        {/* Últimas facturas */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{t("recentInvoices")}</h3>
            <button onClick={() => navigate("/facturacion")} className="text-xs text-blue-500 hover:underline">{t("viewAll")}</button>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />)}</div>
          ) : (data?.recent_invoices ?? []).length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">{t("noInvoices")}</div>
          ) : (
            <div>
              {(data?.recent_invoices ?? []).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                  <div>
                    <p className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">{inv.invoice_number}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{inv.tenant?.name ?? "—"} · {fmtDate(inv.issue_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{inv.currency} ${fmt(inv.total)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INV_STATUS_COLORS[inv.status] ?? ""}`}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximos pagos pendientes */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{t("upcomingPayments")}</h3>
            <button onClick={() => navigate("/cuentas-pagar")} className="text-xs text-blue-500 hover:underline">{t("viewAll")}</button>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />)}</div>
          ) : (data?.upcoming_payments ?? []).length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">{t("noUpcomingPayments")}</div>
          ) : (
            <div>
              {(data?.upcoming_payments ?? []).map((pay) => (
                <div key={pay.id} className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{pay.payable?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t("dueDate")}: {fmtDate(pay.due_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{pay.payable?.currency} ${fmt(pay.amount)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_STATUS_COLORS[pay.status] ?? ""}`}>
                      {pay.status === "overdue" ? t("payStatus_overdue") : t("payStatus_pending")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
