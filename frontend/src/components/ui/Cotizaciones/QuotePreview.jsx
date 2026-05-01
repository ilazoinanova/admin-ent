import { PDFViewer } from "@react-pdf/renderer";
import QuotePdfDocument from "./QuotePdfDocument";

export default function QuotePreview({ form, items, tenant, deptName }) {
  return (
    <PDFViewer style={{ width: "100%", height: "100%", border: "none" }} showToolbar={true}>
      <QuotePdfDocument form={form} items={items} tenant={tenant} deptName={deptName} />
    </PDFViewer>
  );
}
