import { PDFViewer } from "@react-pdf/renderer";
import InvoicePdfDocument from "./InvoicePdfDocument";

// Agrupa ítems automáticos por servicio en un único ítem (cantidad=1, precio=total)
// Los ítems manuales se mantienen sin cambios.
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

  return (
    <PDFViewer
      style={{ width: "100%", height: "100%", border: "none" }}
      showToolbar={true}
    >
      <InvoicePdfDocument
        form={form}
        items={previewItems}
        tenant={tenant}
        deptName={deptName}
      />
    </PDFViewer>
  );
}
