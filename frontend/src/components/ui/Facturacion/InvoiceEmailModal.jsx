import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Mail, Send, Loader2 } from "lucide-react";
import { getInvoice, updateInvoice } from "../../../api/invoices/invoice.service";
import { periodLabel, fmtPeriodDate } from "../../../utils/billingPeriod";

const NAVY = "#0b1b3b";
const BLUE = "#0b3e91";

const fmtNum = (n, currency) => {
  const num = Number(n ?? 0).toLocaleString("es-CL");
  return currency === "CLP" ? `$${num}` : `USD ${num}`;
};

const buildDefaultSubject = (inv) => {
  const tenant = inv.tenant?.name ?? "";
  if (inv.billing_period) return `Factura período ${inv.billing_period} — ${tenant}`;
  if (inv.period_from && inv.period_to)
    return `Factura período ${fmtPeriodDate(inv.period_from)} – ${fmtPeriodDate(inv.period_to)} — ${tenant}`;
  return `Factura — ${tenant}`;
};

const inputClass =
  "flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60";

/* ── Celda de la grilla de receptor ─────────────────── */
function ClientCell({ label, value, bold, borderRight = false }) {
  return (
    <div
      className={`flex w-1/2 px-3 py-2 text-xs border-b border-gray-100 dark:border-gray-700 ${
        borderRight ? "border-r border-r-gray-100 dark:border-r-gray-700" : ""
      }`}
    >
      <span className="font-bold w-28 shrink-0" style={{ color: BLUE }}>{label}</span>
      <span className={`flex-1 text-gray-800 dark:text-gray-100 ${bold ? "font-semibold" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function InvoiceEmailModal({ invoice, onClose, onSent }) {
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
        setFullInvoice(res.data);
        setSubject(buildDefaultSubject(res.data));
        const tenantName = res.data.tenant?.name ?? "—";
        setBodyIntro(`${t("emailModal.greeting")}\n\n${t("emailModal.body", { tenant: tenantName })}`);
        setFooterText(t("emailModal.footer"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invoice.id]);

  const handleSend = async () => {
    if (!toEmail.trim()) { setToError(t("emailModal.toRequired")); return; }
    setSending(true);
    try {
      await updateInvoice(invoice.id, {
        status:                   "accounting",
        accounting_email_to:      toEmail.trim(),
        accounting_email_cc:      ccEmail.trim() || undefined,
        accounting_email_subject: subject.trim(),
        accounting_email_body:    bodyIntro.trim(),
        accounting_email_footer:  footerText.trim(),
      });
      onSent?.();
    } catch {
      setSending(false);
    }
  };

  const inv      = fullInvoice ?? invoice;
  const tenant   = inv.tenant ?? {};
  const items    = fullInvoice?.items ?? [];
  const currency = inv.currency ?? "CLP";
  const subtotal = items.reduce((s, i) => s + Number(i.quantity ?? 1) * Number(i.unit_price ?? 0), 0);
  const taxRate  = Number(inv.tax_rate ?? 0);
  const tax      = subtotal * (taxRate / 100);
  const total    = subtotal + tax;

  const clientRows = [
    { label: "SEÑOR(ES):",            value: tenant.name    ?? "—", bold: true  },
    { label: "TIPO MONEDA:",          value: currency                           },
    { label: "Transaction ID:",        value: tenant.code    ?? "—"              },
    { label: "PAÍS:",                 value: tenant.country ?? "—"              },
    { label: "DIRECCIÓN:",            value: tenant.address ?? "—"              },
    { label: "CIUDAD:",               value: tenant.city    ?? "—"              },
    { label: "EMAIL:",                value: tenant.email   ?? "—"              },
    ...(inv.department?.name
      ? [{ label: "DEPARTAMENTO:", value: inv.department.name }]
      : [{ label: "", value: "" }]
    ),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl flex flex-col overflow-hidden w-full max-w-5xl max-h-[94vh]">

        {/* Header del modal */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 bg-[#0b1b3b]">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Mail size={16} className="text-blue-300" />
            {t("emailModal.title")}
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition">
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

              {/* ── Encabezado editable del email ── */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b dark:border-gray-600 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-400 w-14 shrink-0 pt-1.5">{t("emailModal.to")}</span>
                  <div className="flex-1">
                    <input
                      type="email"
                      className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                      value={toEmail}
                      onChange={(e) => { setToEmail(e.target.value); setToError(""); }}
                      placeholder={t("emailModal.toPlaceholder")}
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

              {/* ── Cuerpo del email ── */}
              <div className="px-6 py-5 space-y-4 bg-white dark:bg-gray-800">

                <textarea
                  value={bodyIntro}
                  onChange={(e) => setBodyIntro(e.target.value)}
                  disabled={sending}
                  rows={4}
                  className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent border border-dashed border-gray-300 dark:border-gray-600 rounded px-3 py-2 resize-y focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-60 placeholder-gray-300"
                />

                {/* ── DATOS DEL RECEPTOR ── */}
                <div className="border border-gray-200 dark:border-gray-600 rounded overflow-hidden">
                  <div className="px-3 py-2" style={{ backgroundColor: NAVY }}>
                    <span className="text-white text-xs font-bold tracking-wider">DATOS DEL RECEPTOR</span>
                  </div>
                  <div className="flex flex-wrap">
                    {clientRows.map(({ label, value, bold }, i) => (
                      <ClientCell
                        key={i}
                        label={label}
                        value={value}
                        bold={bold}
                        borderRight={i % 2 === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* ── PERÍODO DE FACTURACIÓN ── */}
                {inv.billing_period && (
                  <div className="border border-gray-200 dark:border-gray-600 rounded overflow-hidden">
                    <div className="px-3 py-2" style={{ backgroundColor: BLUE }}>
                      <span className="text-white text-xs font-bold tracking-wider">PERÍODO DE FACTURACIÓN</span>
                    </div>
                    <div className="flex items-center gap-4 px-3 py-2.5 text-xs">
                      <span className="font-bold w-20 shrink-0" style={{ color: BLUE }}>PERÍODO:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">
                        {periodLabel(inv.billing_period)}
                      </span>
                      {inv.period_from && inv.period_to && (
                        <span className="text-gray-500 dark:text-gray-400">
                          Del {fmtPeriodDate(inv.period_from)} al {fmtPeriodDate(inv.period_to)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TABLA DE ÍTEMS ── */}
                {items.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-600 rounded overflow-hidden">
                    {/* Cabecera */}
                    <div
                      className="grid text-white text-xs font-bold px-3 py-2"
                      style={{ backgroundColor: NAVY, gridTemplateColumns: "32px 1fr 80px 90px 60px 80px" }}
                    >
                      <span>#</span>
                      <span>Descripción</span>
                      <span className="text-right">Cantidad</span>
                      <span className="text-right">Precio Unit.</span>
                      <span className="text-right">%Desc.</span>
                      <span className="text-right">Valor</span>
                    </div>
                    {/* Filas */}
                    {items.map((item, i) => (
                      <div
                        key={i}
                        className="grid text-xs px-3 py-2 border-t border-gray-100 dark:border-gray-700"
                        style={{
                          gridTemplateColumns: "32px 1fr 80px 90px 60px 80px",
                          backgroundColor: i % 2 !== 0 ? "#f9fafb" : undefined,
                        }}
                      >
                        <span className="text-gray-400">{i + 1}</span>
                        <span className="text-gray-800 dark:text-gray-100">{item.description || "—"}</span>
                        <span className="text-right text-gray-700 dark:text-gray-300">
                          {Number(item.quantity).toLocaleString("es-CL")}
                          {item.unit ? ` ${item.unit}` : ""}
                        </span>
                        <span className="text-right text-gray-700 dark:text-gray-300">
                          {fmtNum(item.unit_price, currency)}
                        </span>
                        <span className="text-right text-gray-400">—</span>
                        <span className="text-right font-semibold text-gray-800 dark:text-gray-100">
                          {fmtNum(Number(item.quantity) * Number(item.unit_price), currency)}
                        </span>
                      </div>
                    ))}

                    {/* Totales alineados a la derecha */}
                    <div className="flex justify-end px-3 py-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="w-48 space-y-1 text-xs">
                        <div className="flex justify-between text-gray-500 dark:text-gray-400">
                          <span>Subtotal</span>
                          <span className="font-medium text-gray-700 dark:text-gray-200">{fmtNum(subtotal, currency)}</span>
                        </div>
                        {taxRate > 0 ? (
                          <div className="flex justify-between text-gray-500 dark:text-gray-400">
                            <span>{inv.tax_name || "IVA"} ({taxRate}%)</span>
                            <span className="font-medium text-gray-700 dark:text-gray-200">{fmtNum(tax, currency)}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-gray-400">
                            <span>Exento</span>
                            <span>—</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-800 dark:text-gray-100 text-sm pt-1.5 border-t border-gray-200 dark:border-gray-600">
                          <span>Total {currency}</span>
                          <span>{fmtNum(total, currency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {inv.notes && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                    <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">{t("notes")}</p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">{inv.notes}</p>
                  </div>
                )}

                <textarea
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  disabled={sending}
                  rows={2}
                  className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent border border-dashed border-gray-300 dark:border-gray-600 rounded px-3 py-2 resize-y focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-60"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
            {sending ? t("emailModal.sending") : t("emailModal.send")}
          </button>
        </div>

      </div>
    </div>
  );
}
