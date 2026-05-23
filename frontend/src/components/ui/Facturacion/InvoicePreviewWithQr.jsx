import { usePDF } from "@react-pdf/renderer";
import InvoicePdfDocument from "./InvoicePdfDocument";

export default function InvoicePreviewWithQr({ form, items, tenant, deptName, qrImageUrl }) {
  const [instance] = usePDF({
    document: (
      <InvoicePdfDocument
        form={form}
        items={items}
        tenant={tenant}
        deptName={deptName}
        draft={false}
        qrImageUrl={qrImageUrl}
      />
    ),
  });

  if (instance.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-gray-100 dark:bg-gray-900">
        <span className="w-10 h-10 border-4 border-gray-300 border-t-[#0b1b3b] rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Generando vista previa…</p>
      </div>
    );
  }

  if (instance.error) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500">
        Error al generar la vista previa.
      </div>
    );
  }

  return (
    <iframe
      src={instance.url}
      style={{ width: "100%", height: "100%", border: "none", minHeight: "560px" }}
      title="Vista previa factura con QR"
    />
  );
}
