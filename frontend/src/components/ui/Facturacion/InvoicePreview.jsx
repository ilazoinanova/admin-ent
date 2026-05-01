import { PDFViewer } from "@react-pdf/renderer";
import InvoicePdfDocument from "./InvoicePdfDocument";

export default function InvoicePreview({ form, items, tenant, deptName }) {
  return (
    <PDFViewer
      style={{ width: "100%", height: "100%", border: "none" }}
      showToolbar={true}
    >
      <InvoicePdfDocument
        form={form}
        items={items}
        tenant={tenant}
        deptName={deptName}
      />
    </PDFViewer>
  );
}
