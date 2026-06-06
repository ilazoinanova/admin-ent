import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Send, Loader2 } from "lucide-react";
import { getInvoice, updateInvoice } from "../../../api/invoices/invoice.service";
import { periodLabel, fmtPeriodDate } from "../../../utils/billingPeriod";
import { fmtDate } from "../../../utils/date";

const NAVY = "#0b1b3b";
const BLUE = "#0b3e91";

const inputClass =
  "flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60";

const buildDefaultSubject = (inv) => {
  const tenant = inv.tenant?.name ?? "";
  if (inv.billing_period)
    return `Factura ${inv.invoice_number} · ${periodLabel(inv.billing_period)} — ${tenant}`;
  if (inv.period_from && inv.period_to)
    return `Factura ${inv.invoice_number} · ${fmtPeriodDate(inv.period_from)} – ${fmtPeriodDate(inv.period_to)} — ${tenant}`;
  return `Factura ${inv.invoice_number} — ${tenant}`;
};

export default function InvoiceSendClientModal({ invoice, onClose, onSent }) {
  const { t } = useTranslation();
  const [fullInvoice, setFullInvoice] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [toEmail, setToEmail]         = useState("");
  const [ccEmail, setCcEmail]         = useState("");
  const [subject, setSubject]         = useState("");
  const [bodyIntro, setBodyIntro]     = useState("");
  const [footerText, setFooterText]   = useState("");
  const [toError, setToError]         = useState("");

  useEffect(() => {
    getInvoice(invoice.id)
      .then((res) => {
        const inv        = res.data;
        const tenantName = inv.tenant?.name ?? "—";
        setFullInvoice(inv);
        setToEmail(inv.tenant?.email ?? "");
        setSubject(buildDefaultSubject(inv));
        setBodyIntro(
          `Estimado(a) ${tenantName},\n\nAdjuntamos la factura ${inv.invoice_number} para su revisión y conocimiento. A continuación encontrará el detalle de referencia correspondiente.`
        );
        setFooterText(
          "Ante cualquier consulta, no dude en contactarnos. Quedamos a su disposición."
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invoice.id]);

  const handleSend = async () => {
    if (!toEmail.trim()) { setToError(t("emailModal.toRequired")); return; }
    setSending(true);
    try {
      await updateInvoice(invoice.id, { status: "sent" });
      onSent?.();
    } catch {
      setSending(false);
    }
  };

  const inv    = fullInvoice ?? invoice;
  const items  = fullInvoice?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl flex flex-col overflow-hidden w-full max-w-5xl max-h-[94vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 bg-[#0b1b3b]">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Send size={15} className="text-blue-300" />
            Enviar Factura al Cliente
          </h2>
          <button onClick={onClose} disabled={sending} className="text-gray-300 hover:text-white transition disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 size={24} className="animate-spin mr-2" />
              <span className="text-sm">{t("loading")}</span>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden text-sm">

              {/* Campos de destino */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b dark:border-gray-600 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-400 w-14 shrink-0 pt-1.5">{t("emailModal.to")}</span>
                  <div className="flex-1">
                    <input
                      type="email"
                      className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                      value={toEmail}
                      onChange={(e) => { setToEmail(e.target.value); setToError(""); }}
                      placeholder="correo@cliente.com"
                      disabled={sending}
                    />
                    {toError && <p className="text-red-500 text-xs mt-0.5">{toError}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 w-14 shrink-0">CC</span>
                  <input
                    type="email"
                    className={inputClass}
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="correo@copia.com (opcional)"
                    disabled={sending}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 w-14 shrink-0">{t("emailModal.subject")}</span>
                  <input
                    type="text"
                    className={inputClass}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={sending}
                  />
                </div>
              </div>

              {/* Cuerpo del email */}
              <div className="px-6 py-5 space-y-4 bg-white dark:bg-gray-800">

                {/* Texto intro editable */}
                <textarea
                  value={bodyIntro}
                  onChange={(e) => setBodyIntro(e.target.value)}
                  disabled={sending}
                  rows={4}
                  className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent border border-dashed border-gray-300 dark:border-gray-600 rounded px-3 py-2 resize-y focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-60"
                />

                {/* Card de referencia — sin montos */}
                <div className="border border-gray-200 dark:border-gray-600 rounded overflow-hidden">
                  <div className="px-3 py-2" style={{ backgroundColor: NAVY }}>
                    <span className="text-white text-xs font-bold tracking-wider">DETALLE DE REFERENCIA</span>
                  </div>

                  <div className="grid grid-cols-2 text-xs">
                    <div className="flex px-3 py-2 border-b border-r border-gray-100 dark:border-gray-700">
                      <span className="font-bold w-28 shrink-0" style={{ color: BLUE }}>Nº Factura:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{inv.invoice_number}</span>
                    </div>
                    <div className="flex px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="font-bold w-28 shrink-0" style={{ color: BLUE }}>Período:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {inv.billing_period ? periodLabel(inv.billing_period) : "—"}
                        {inv.period_from && inv.period_to && (
                          <span className="text-gray-400 ml-1">
                            ({fmtPeriodDate(inv.period_from)} – {fmtPeriodDate(inv.period_to)})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex px-3 py-2 border-r border-gray-100 dark:border-gray-700">
                      <span className="font-bold w-28 shrink-0" style={{ color: BLUE }}>Fecha emisión:</span>
                      <span className="text-gray-700 dark:text-gray-300">{fmtDate(inv.issue_date) ?? "—"}</span>
                    </div>
                    <div className="flex px-3 py-2">
                      <span className="font-bold w-28 shrink-0" style={{ color: BLUE }}>Vencimiento:</span>
                      <span className="text-gray-700 dark:text-gray-300">{fmtDate(inv.due_date) ?? "—"}</span>
                    </div>
                  </div>

                  {/* Descripciones de ítems — sin montos */}
                  {items.length > 0 && (
                    <>
                      <div className="px-3 py-2" style={{ backgroundColor: BLUE }}>
                        <span className="text-white text-xs font-bold tracking-wider">DESCRIPCIÓN DE SERVICIOS</span>
                      </div>
                      {items.map((item, i) => (
                        <div
                          key={i}
                          className={`px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 ${
                            i < items.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""
                          } ${i % 2 === 1 ? "bg-gray-50 dark:bg-gray-700/30" : ""}`}
                        >
                          {item.description || "—"}
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Footer editable */}
                <textarea
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  disabled={sending}
                  rows={2}
                  className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent border border-dashed border-gray-300 dark:border-gray-600 rounded px-3 py-2 resize-y focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-60"
                />

                {/* Nota PDF adjunto */}
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded text-xs text-blue-700 dark:text-blue-300">
                  <span>📎</span>
                  <span>Se adjuntará la factura <strong>{inv.invoice_number}.pdf</strong> (versión final con QR).</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer del modal */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSend}
            disabled={loading || sending}
            className="px-4 py-2 text-sm bg-[#0b1b3b] text-white rounded-lg hover:bg-[#162d5e] disabled:opacity-60 transition flex items-center gap-2"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? "Procesando…" : "Enviar al Cliente"}
          </button>
        </div>

      </div>
    </div>
  );
}
