import { usePDF } from "@react-pdf/renderer";
import InvoicePdfDocument from "./InvoicePdfDocument";

function consolidateForPreview(items) {
  const autoGroups = new Map();
  const autoOrder  = [];
  const manualItems = [];

  for (const item of items) {
    if (item._auto && item.tenant_service_id != null) {
      const key = item.tenant_service_id;
      if (!autoGroups.has(key)) {
        autoGroups.set(key, { firstItem: item, total: 0 });
        autoOrder.push(key);
      }
      autoGroups.get(key).total += Number(item.quantity) * Number(item.unit_price);
    } else {
      manualItems.push(item);
    }
  }

  const autoItems = autoOrder.map((key) => {
    const { firstItem, total } = autoGroups.get(key);
    const serviceName = firstItem.description.split(" · ")[0];
    return { ...firstItem, description: serviceName, quantity: 1, unit_price: total };
  });

  return [...autoItems, ...manualItems];
}

export default function InvoicePreview({ form, items, tenant, deptName }) {
  const previewItems = consolidateForPreview(items);

  const [instance] = usePDF({
    document: (
      <InvoicePdfDocument
        form={form}
        items={previewItems}
        tenant={tenant}
        deptName={deptName}
      />
    ),
  });

  if (instance.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-gray-100 dark:bg-gray-900">
        <span className="w-10 h-10 border-4 border-gray-300 border-t-[#0b1b3b] rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Generando vista previa…
        </p>
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
      style={{ width: "100%", height: "100%", border: "none" }}
      title="Vista previa factura"
    />
  );
}
