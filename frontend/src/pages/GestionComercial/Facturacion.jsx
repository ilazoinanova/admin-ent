import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Eye, CheckCircle, Trash2, FileText, Download, FileDown, Pencil, Mail, UploadCloud, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { getInvoices, getInvoice, updateInvoice, deleteInvoice, getTenantsWithInvoices, getInvoiceBillingPeriods } from "../../api/invoices/invoice.service";
import { periodLabel } from "../../utils/billingPeriod";

import { fmtDate } from "../../utils/date";
import InvoiceCreateModal from "../../components/ui/Facturacion/InvoiceCreateModal";
import InvoiceDetailModal from "../../components/ui/Facturacion/InvoiceDetailModal";
import InvoicePdfDocument from "../../components/ui/Facturacion/InvoicePdfDocument";
import InvoiceEmailModal from "../../components/ui/Facturacion/InvoiceEmailModal";
import InvoiceSendClientModal from "../../components/ui/Facturacion/InvoiceSendClientModal";
import InvoiceUploadPdfModal from "../../components/ui/Facturacion/InvoiceUploadPdfModal";
import ConfirmModal from "../../components/ui/ConfirmModal";

const STATUS_COLORS = {
  draft:      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  accounting: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ready:      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  sent:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid:       "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled:  "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

const STATUS_KEYS = {
  draft:      "statusDraft",
  accounting: "statusAccounting",
  ready:      "statusReady",
  sent:       "statusSent",
  paid:       "statusPaid",
  overdue:    "statusOverdue",
  cancelled:  "statusCancelled",
};

const STAT_CARDS = [
  { key: "total_invoiced", labelKey: "totalInvoiced", color: "text-gray-900 dark:text-gray-100" },
  { key: "total_paid",     labelKey: "paidAmount",    color: "text-green-600 dark:text-green-400" },
  { key: "total_pending",  labelKey: "pendingAmount", color: "text-blue-600 dark:text-blue-400" },
  { key: "total_overdue",  labelKey: "overdueAmount", color: "text-red-600 dark:text-red-400" },
];

export default function Facturacion() {
  const { t } = useTranslation();
  const [invoices, setInvoices]         = useState([]);
  const [stats, setStats]               = useState({});
  const [meta, setMeta]                 = useState({});
  const [statusFilter, setStatusFilter]           = useState("");
  const [debouncedStatus, setDebouncedStatus]     = useState("");
  const [page, setPage]                           = useState(1);
  const [loading, setLoading]           = useState(false);
  const [createOpen, setCreateOpen]         = useState(false);
  const [editInvoice, setEditInvoice]       = useState(null);
  const [loadingEditId, setLoadingEditId]   = useState(null);
  const [detailInvoice, setDetailInvoice]   = useState(null);
  const [confirmDelete, setConfirmDelete]   = useState(null);
  const [confirmPaid, setConfirmPaid]       = useState(null);
  const [confirmSent, setConfirmSent]       = useState(null);
  const [downloadingId, setDownloadingId]   = useState(null);
  const [emailInvoice, setEmailInvoice]     = useState(null);
  const [uploadInvoice, setUploadInvoice]   = useState(null);
  const [tenantFilter, setTenantFilter]     = useState("");
  const [periodFilter, setPeriodFilter]     = useState("");
  const [tenantOptions, setTenantOptions]   = useState([]);
  const [periodOptions, setPeriodOptions]   = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  const loadInvoices = async (st = debouncedStatus, p = page, tenant = tenantFilter, period = periodFilter) => {
    setLoading(true);
    try {
      const res = await getInvoices({
        page:           p,
        status:         st      || undefined,
        tenant_id:      tenant  || undefined,
        billing_period: period  || undefined,
      });
      setInvoices(res.data.data ?? []);
      setStats(res.data.stats ?? {});
      setMeta(res.data);
    } catch {
      toast.error(t("invoiceLoadError"));
    } finally {
      setLoading(false);
    }
  };

  // Al montar: cargar clientes y todos los períodos; pre-seleccionar el último período
  useEffect(() => {
    getTenantsWithInvoices()
      .then((res) => setTenantOptions(res.data.data ?? []))
      .catch(() => {});

    setLoadingPeriods(true);
    getInvoiceBillingPeriods()
      .then((res) => {
        const periods = res.data.data ?? [];
        setPeriodOptions(periods);
        if (periods.length > 0) setPeriodFilter(periods[0]); // último período
      })
      .catch(() => {})
      .finally(() => setLoadingPeriods(false));
  }, []);

  // Cuando cambia el cliente: recargar períodos para ese cliente (o todos si se limpia)
  useEffect(() => {
    setPeriodFilter("");
    setPeriodOptions([]);
    setLoadingPeriods(true);
    getInvoiceBillingPeriods(tenantFilter || null)
      .then((res) => {
        const periods = res.data.data ?? [];
        setPeriodOptions(periods);
      })
      .catch(() => {})
      .finally(() => setLoadingPeriods(false));
  }, [tenantFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedStatus(statusFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [statusFilter]);

  useEffect(() => {
    loadInvoices(debouncedStatus, page, tenantFilter, periodFilter);
  }, [debouncedStatus, page, tenantFilter, periodFilter]);

  const handleMarkPaid = async () => {
    try {
      await updateInvoice(confirmPaid.id, { status: "paid" });
      toast.success(t("invoiceMarkedPaid"));
      setConfirmPaid(null);
      loadInvoices();
    } catch {
      toast.error(t("invoiceUpdateError"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(confirmDelete.id);
      toast.success(t("invoiceDeleted"));
      setConfirmDelete(null);
      loadInvoices();
    } catch {
      toast.error(t("invoiceDeleteError"));
    }
  };

  const handleOpenEdit = async (inv) => {
    setLoadingEditId(inv.id);
    try {
      const res = await getInvoice(inv.id);
      setEditInvoice(res.data);
    } catch {
      toast.error(t("invoiceLoadError"));
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleDownloadPdf = async (inv) => {
    setDownloadingId(inv.id);
    try {
      const res  = await getInvoice(inv.id);
      const full = res.data;
      const form = {
        issue_date:     full.issue_date,
        due_date:       full.due_date,
        currency:       full.currency,
        tax_rate:       full.tax_rate ?? 0,
        tax_name:       full.tax_name ?? "",
        notes:          full.notes ?? "",
        billing_period: full.billing_period ?? null,
        period_from:    full.period_from ?? null,
        period_to:      full.period_to ?? null,
      };
      const qrImageUrl = full.qr_url
        ? await QRCode.toDataURL(full.qr_url, { width: 300, margin: 1, errorCorrectionLevel: "M" })
        : null;
      const blob = await pdf(
        <InvoicePdfDocument form={form} items={full.items ?? []} tenant={full.tenant} deptName={full.department?.name ?? ""} draft={false} qrImageUrl={qrImageUrl} />
      ).toBlob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `${full.invoice_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("invoiceLoadError"));
    } finally {
      setDownloadingId(null);
    }
  };

  const fmt = (n) => Number(n ?? 0).toLocaleString("es-CL");

  return (
    <div>

      {/* Header + Filtros en una sola fila */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="mr-2">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("billing")}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("facturacionSubtitle")}</p>
          </div>

          <select
            value={tenantFilter}
            onChange={(e) => { setTenantFilter(e.target.value); setPage(1); }}
            disabled={loading}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed min-w-[190px]"
          >
            <option value="">{t("allClients")}</option>
            {tenantOptions.map((ten) => (
              <option key={ten.id} value={ten.id}>{ten.name}</option>
            ))}
          </select>

          <select
            value={periodFilter}
            onChange={(e) => { setPeriodFilter(e.target.value); setPage(1); }}
            disabled={loading || loadingPeriods}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed min-w-[155px]"
          >
            <option value="">
              {loadingPeriods ? t("loading") : t("allPeriods")}
            </option>
            {periodOptions.map((p) => (
              <option key={p} value={p}>{periodLabel(p)}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={loading}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">{t("allStatuses")}</option>
            {Object.entries(STATUS_KEYS).map(([v, k]) => (
              <option key={v} value={v}>{t(k)}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          disabled={loading}
          className="bg-[#0b1b3b] text-white text-sm px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-[#162d5e] disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          <Plus size={15} /> {t("newInvoice")}
        </button>
      </div>

      {/* Tarjetas resumen */}
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
        <div className="grid grid-cols-[2fr_2fr_110px_90px_90px_110px_60px_180px_130px] gap-3 px-4 py-3 bg-[#0b1b3b] text-white text-xs font-semibold">
          <span>{t("invoiceNumber")}</span>
          <span>{t("client")}</span>
          <span>{t("period")}</span>
          <span>{t("issueDate")}</span>
          <span>{t("dueDate")}</span>
          <span>{t("total")}</span>
          <span>{t("currency")}</span>
          <span>{t("status")}</span>
          <span className="text-right">{t("actions")}</span>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <FileText size={40} className="mb-3 opacity-30" />
            <p className="text-sm">{t("noInvoices")}</p>
            <button onClick={() => setCreateOpen(true)} className="mt-3 text-sm text-blue-600 hover:underline">
              {t("createFirstInvoice")}
            </button>
          </div>
        ) : (
          invoices.map((inv) => {
            const colorClass = STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft;
            const labelKey   = STATUS_KEYS[inv.status]  ?? "statusDraft";
            const canMarkPaid = ["sent", "overdue"].includes(inv.status);
            return (
              <div
                key={inv.id}
                className="grid grid-cols-[2fr_2fr_110px_90px_90px_110px_60px_180px_130px] gap-3 px-4 py-3 border-t dark:border-gray-700 items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{inv.invoice_number}</span>
                <span className="truncate text-gray-800 dark:text-gray-200">{inv.tenant?.name ?? "—"}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{inv.billing_period ? periodLabel(inv.billing_period) : "—"}</span>
                <span className="text-gray-600 dark:text-gray-400">{fmtDate(inv.issue_date)}</span>
                <span className="text-gray-600 dark:text-gray-400">{fmtDate(inv.due_date) ?? "—"}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">${fmt(inv.total)}</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{inv.currency ?? "—"}</span>
                <span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>
                    {t(labelKey)}
                  </span>
                </span>
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => setDetailInvoice(inv)} disabled={loading} title={t("viewDetails")} className="text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <Eye size={15} />
                  </button>
                  {inv.status === "draft" && (
                    <>
                      <button
                        onClick={() => setEmailInvoice(inv)}
                        title={t("emailModal.openButton")}
                        className="text-gray-400 hover:text-amber-600 transition"
                      >
                        <Mail size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(inv)}
                        disabled={loadingEditId === inv.id}
                        title={t("editDraft")}
                        className="text-gray-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {loadingEditId === inv.id
                          ? <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          : <Pencil size={15} />
                        }
                      </button>
                    </>
                  )}
                  {inv.status === "accounting" && (
                    <button
                      onClick={() => setUploadInvoice(inv)}
                      title={t("uploadModal.openButton")}
                      className="text-gray-400 hover:text-blue-600 transition"
                    >
                      <UploadCloud size={15} />
                    </button>
                  )}
                  {inv.status === "ready" && (
                    <button
                      onClick={() => setConfirmSent(inv)}
                      title={t("markSent")}
                      className="text-gray-400 hover:text-teal-600 transition"
                    >
                      <Send size={15} />
                    </button>
                  )}
                  {inv.fiscal_pdf_url && (
                    <a
                      href={`${import.meta.env.VITE_API_URL}/fiscal/${inv.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("downloadFiscal")}
                      className="text-gray-400 hover:text-amber-600 transition"
                    >
                      <FileDown size={15} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDownloadPdf(inv)}
                    disabled={downloadingId === inv.id}
                    title={t("downloadPdf")}
                    className="text-gray-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {downloadingId === inv.id
                      ? <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      : <Download size={15} />
                    }
                  </button>
                  {canMarkPaid && (
                    <button onClick={() => setConfirmPaid(inv)} disabled={loading} title={t("markAsPaid")} className="text-gray-400 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  <button onClick={() => setConfirmDelete(inv)} disabled={loading} title={t("delete")} className="text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {invoices.length > 0 && (
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {t("page")} {meta.current_page ?? 1} {t("of")} {meta.last_page ?? 1}
            {meta.total != null && (
              <span className="ml-2">· {meta.total} {t("invoiceNumber").toLowerCase()}s</span>
            )}
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
      )}

      {/* Modales */}
      {createOpen && (
        <InvoiceCreateModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); loadInvoices(); }}
        />
      )}

      {editInvoice && (
        <InvoiceCreateModal
          invoiceToEdit={editInvoice}
          onClose={() => setEditInvoice(null)}
          onCreated={() => { setEditInvoice(null); loadInvoices(); }}
        />
      )}

      {detailInvoice && (
        <InvoiceDetailModal
          invoice={detailInvoice}
          onClose={() => setDetailInvoice(null)}
          onStatusChange={() => { setDetailInvoice(null); loadInvoices(); }}
        />
      )}

      {confirmSent && (
        <InvoiceSendClientModal
          invoice={confirmSent}
          onClose={() => setConfirmSent(null)}
          onSent={() => {
            setConfirmSent(null);
            loadInvoices();
            toast.success(t("invoiceMarkedSent"));
          }}
        />
      )}

      <ConfirmModal
        open={!!confirmPaid}
        onClose={() => setConfirmPaid(null)}
        onConfirm={handleMarkPaid}
        title={t("markAsPaid")}
        description={t("markAsPaidConfirm", { number: confirmPaid?.invoice_number })}
        confirmText={t("markAsPaidButton")}
        type="success"
      />

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title={t("deleteInvoice")}
        description={t("deleteInvoiceConfirm", { number: confirmDelete?.invoice_number })}
        confirmText={t("delete")}
        type="danger"
      />

      {emailInvoice && (
        <InvoiceEmailModal
          invoice={emailInvoice}
          onClose={() => setEmailInvoice(null)}
          onSent={() => { setEmailInvoice(null); loadInvoices(); toast.success(t("emailModal.sentSuccess")); }}
        />
      )}

      {uploadInvoice && (
        <InvoiceUploadPdfModal
          invoice={uploadInvoice}
          onClose={() => setUploadInvoice(null)}
          onUploaded={() => { setUploadInvoice(null); loadInvoices(); toast.success(t("uploadModal.uploadSuccess")); }}
        />
      )}

    </div>
  );
}
