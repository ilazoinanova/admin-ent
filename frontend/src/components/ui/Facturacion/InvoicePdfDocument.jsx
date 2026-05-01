import {
  Document, Page, View, Text, Image, StyleSheet,
} from "@react-pdf/renderer";
import logoSrc from "../../../assets/stratek.png";

const COMPANY = {
  name:    "STRATEK SPA",
  rut:     "78.296.748-7",
  giro:    "Prestación de servicios informáticos y tecnológicos en general",
  address: "APOQUINDO 6410 BD 605 SB 6 - LAS CONDES",
  city:    "Santiago, Chile",
  email:   "consulting.ays@gmail.com",
  phone:   "",
  sii:     "S.I.I. - SANTIAGO ORIENTE",
};

const C = {
  navy:      "#0b1b3b",
  blue:      "#0b3e91",
  red:       "#c0392b",
  gray50:    "#f9fafb",
  gray100:   "#f3f4f6",
  gray200:   "#e5e7eb",
  gray300:   "#d1d5db",
  gray400:   "#9ca3af",
  gray500:   "#6b7280",
  gray600:   "#4b5563",
  gray800:   "#1f2937",
  black:     "#111827",
};

const s = StyleSheet.create({
  page: {
    fontFamily:      "Helvetica",
    fontSize:        9,
    backgroundColor: "white",
    paddingTop:      18,
    paddingBottom:   28,
    paddingLeft:     24,
    paddingRight:    32,
    color:           C.black,
  },

  /* ── HEADER ──────────────────────────────────── */
  header: {
    flexDirection:    "row",
    justifyContent:   "space-between",
    alignItems:       "flex-start",
    marginBottom:     16,
    paddingBottom:    14,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  companyBlock: {
    flex:        1,
    paddingRight: 20,
  },
  logo: {
    width:        190,
    marginBottom: 5,
    objectFit:    "contain",
    objectPositionX: 0,
  },
  companyName: {
    fontSize:     13,
    fontFamily:   "Helvetica-Bold",
    color:        C.blue,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  companyRow: {
    flexDirection: "row",
    alignItems:    "center",
    marginBottom:  3,
  },
  companyLabel: {
    fontSize:    8,
    color:       C.blue,
    fontFamily:  "Helvetica-Bold",
    width:       36,
  },
  companyValue: {
    fontSize: 8,
    color:    C.gray600,
    flex:     1,
  },
  rutBadge: {
    fontSize:         8,
    color:            C.gray400,
    marginBottom:     5,
    fontFamily:       "Helvetica",
  },
  giroText: {
    fontSize:     7.5,
    color:        C.gray500,
    fontStyle:    "italic",
    marginBottom: 6,
    lineHeight:   1.4,
  },

  /* Invoice type box */
  invoiceBox: {
    borderWidth:   2,
    borderColor:   C.red,
    borderRadius:  5,
    padding:       14,
    alignItems:    "center",
    width:         200,
    flexShrink:    0,
  },
  invoiceTypeText: {
    fontSize:    10,
    fontFamily:  "Helvetica-Bold",
    color:       C.red,
    textAlign:   "center",
    lineHeight:  1.4,
  },
  invoiceNum: {
    fontSize:      22,
    fontFamily:    "Helvetica-Bold",
    color:         C.blue,
    marginTop:     6,
    marginBottom:  4,
    textAlign:     "center",
  },
  invoiceSii: {
    fontSize:     7,
    color:        C.gray500,
    fontFamily:   "Helvetica-Bold",
    textAlign:    "center",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  invoiceDateBox: {
    backgroundColor: C.gray100,
    borderRadius:    4,
    paddingTop:      4,
    paddingBottom:   4,
    paddingLeft:     8,
    paddingRight:    8,
    width:           "100%",
  },
  invoiceDateText: {
    fontSize:   7.5,
    color:      C.gray800,
    textAlign:  "center",
    fontFamily: "Helvetica-Bold",
  },
  invoiceDateSub: {
    fontSize:   7,
    color:      C.gray400,
    textAlign:  "center",
    marginTop:  4,
  },

  /* ── RECEPTOR ─────────────────────────────────── */
  sectionWrapper: {
    borderWidth:   1,
    borderColor:   C.gray300,
    borderRadius:  5,
    marginBottom:  16,
    overflow:      "hidden",
  },
  sectionHead: {
    backgroundColor: C.navy,
    paddingTop:      5,
    paddingBottom:   5,
    paddingLeft:     12,
    paddingRight:    12,
  },
  sectionHeadText: {
    fontSize:     7.5,
    color:        "white",
    fontFamily:   "Helvetica-Bold",
    letterSpacing: 0.6,
  },
  clientGrid: {
    flexDirection: "row",
    flexWrap:      "wrap",
  },
  clientCell: {
    width:          "50%",
    flexDirection:  "row",
    paddingTop:     6,
    paddingBottom:  6,
    paddingLeft:    12,
    paddingRight:   12,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
    alignItems:     "flex-start",
  },
  clientCellBorderRight: {
    borderRightWidth:  1,
    borderRightColor:  C.gray100,
  },
  clientCellLabel: {
    fontFamily:  "Helvetica-Bold",
    color:       C.blue,
    fontSize:    7.5,
    width:       75,
    flexShrink:  0,
  },
  clientCellValue: {
    color:    C.black,
    fontSize: 7.5,
    flex:     1,
  },
  clientCellValueBold: {
    fontFamily: "Helvetica-Bold",
    color:      C.black,
    fontSize:   7.5,
    flex:       1,
  },

  /* ── TABLA ─────────────────────────────────────── */
  table: {
    marginBottom: 16,
  },
  tableHead: {
    flexDirection:   "row",
    backgroundColor: C.navy,
    paddingTop:      7,
    paddingBottom:   7,
    paddingLeft:     10,
    paddingRight:    10,
    borderTopLeftRadius:  3,
    borderTopRightRadius: 3,
  },
  thText: {
    color:      "white",
    fontSize:   7.5,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection:   "row",
    paddingTop:      7,
    paddingBottom:   7,
    paddingLeft:     10,
    paddingRight:    10,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  tableRowAlt: {
    backgroundColor: C.gray50,
  },
  tableRowEmpty: {
    paddingTop:    12,
    paddingBottom: 12,
  },
  tdText: {
    color:    C.black,
    fontSize: 7.5,
  },
  tdTextGray: {
    color:    C.gray400,
    fontSize: 7.5,
  },
  tdTextBold: {
    color:      C.black,
    fontSize:   7.5,
    fontFamily: "Helvetica-Bold",
  },

  /* col widths */
  colNum:   { width: 22 },
  colDesc:  { flex: 1 },
  colQty:   { width: 55, textAlign: "right" },
  colPrice: { width: 75, textAlign: "right" },
  colDisc:  { width: 42, textAlign: "right" },
  colTotal: { width: 75, textAlign: "right" },

  /* ── PIE ──────────────────────────────────────── */
  footer: {
    flexDirection: "row",
    marginTop:     4,
    gap:           10,
  },
  stampBox: {
    flex:          1,
    borderWidth:   1,
    borderColor:   C.gray300,
    borderRadius:  6,
    paddingTop:    14,
    paddingBottom: 14,
    paddingLeft:   12,
    paddingRight:  12,
    alignItems:    "center",
    justifyContent: "center",
    minHeight:     90,
    backgroundColor: C.gray50,
  },
  stampText: {
    fontSize:   6.5,
    color:      C.gray400,
    textAlign:  "center",
    fontFamily: "Helvetica-Bold",
    marginTop:  6,
  },
  stampSub: {
    fontSize:  5.5,
    color:     C.gray300,
    textAlign: "center",
    marginTop: 3,
  },
  totalsBox: {
    width:        190,
    borderWidth:  1,
    borderColor:  C.gray200,
    borderRadius: 6,
    overflow:     "hidden",
    flexShrink:   0,
  },
  totalsHead: {
    backgroundColor: C.gray100,
    paddingTop:      5,
    paddingBottom:   5,
    paddingLeft:     12,
    paddingRight:    12,
    fontSize:        7,
    fontFamily:      "Helvetica-Bold",
    color:           C.gray600,
    letterSpacing:   0.5,
  },
  totalsBody: {
    paddingTop:    10,
    paddingBottom: 10,
    paddingLeft:   12,
    paddingRight:  12,
  },
  totalsRow: {
    flexDirection:   "row",
    justifyContent:  "space-between",
    fontSize:        8,
    marginBottom:    5,
  },
  totalsLabel: { color: C.gray600 },
  totalsValue: { fontFamily: "Helvetica-Bold" },
  totalsFinal: {
    flexDirection:  "row",
    justifyContent: "space-between",
    fontSize:       10,
    fontFamily:     "Helvetica-Bold",
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingTop:     8,
    marginTop:      4,
  },

  /* ── NOTAS ────────────────────────────────────── */
  notesSection: {
    marginTop:       14,
    paddingTop:      12,
    borderTopWidth:  1,
    borderTopColor:  C.gray200,
  },
  notesLabel: {
    fontSize:     8,
    fontFamily:   "Helvetica-Bold",
    color:        C.blue,
    marginBottom: 4,
  },
  notesText: {
    fontSize:        8,
    color:           C.gray800,
    backgroundColor: C.gray50,
    borderRadius:    4,
    paddingTop:      6,
    paddingBottom:   6,
    paddingLeft:     10,
    paddingRight:    10,
    lineHeight:      1.5,
  },

  /* ── WATERMARK ────────────────────────────────── */
  watermark: {
    position:  "absolute",
    top:       300,
    left:      100,
    fontSize:  72,
    color:     "#e5e7eb",
    fontFamily: "Helvetica-Bold",
    opacity:   0.6,
    transform: "rotate(-30deg)",
    letterSpacing: 10,
  },
});

/* ─── helpers ────────────────────────────── */
const fmt = (n) => Number(n ?? 0).toLocaleString("es-CL");

const fmtLong = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
};

/* ─── QR placeholder (simple SVG path via canvas-like rects) ─ */
function QRPlaceholder() {
  const blocks = [
    [0,0,3,3],[4,0,1,1],[6,0,1,1],[0,4,1,1],[2,4,1,1],[4,4,1,1],[6,4,1,1],
    [0,6,3,3],[4,6,1,1],[6,6,1,1],[3,2,1,1],[2,3,1,1],[5,2,1,1],[3,5,1,1],
    [5,5,1,1],[2,6,1,1],[4,2,1,1],[6,2,1,1],[3,3,1,1],[5,3,1,1],
  ];
  const unit = 5;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", width: 40, height: 40 }}>
      {blocks.map(([cx, cy, w, h], i) => (
        <View
          key={i}
          style={{
            position:        "absolute",
            left:            cx * unit,
            top:             cy * unit,
            width:           w * unit,
            height:          h * unit,
            backgroundColor: "#9ca3af",
            borderRadius:    1,
          }}
        />
      ))}
    </View>
  );
}

/* ─── Main document ─────────────────────── */
export default function InvoicePdfDocument({ form, items, tenant, deptName }) {
  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);

  const clientRows = [
    { label: "SEÑOR(ES):",    value: tenant?.name    ?? "—", bold: true },
    { label: "TIPO MONEDA:",  value: form.currency },
    { label: "R.U.T.:",       value: tenant?.code    ?? "—" },
    { label: "PAÍS DESTINO:", value: tenant?.country ?? "—" },
    { label: "DIRECCIÓN:",    value: tenant?.address ?? "—" },
    { label: "CIUDAD:",       value: tenant?.city    ?? "—" },
    { label: "EMAIL:",        value: tenant?.email   ?? "—" },
    { label: deptName ? "DEPARTAMENTO:" : "", value: deptName ?? "" },
  ];

  const EMPTY_ROWS = Math.max(0, 5 - items.length);

  return (
    <Document title={`Factura - ${tenant?.name ?? ""}`} author="Stratek SPA">
      <Page size="A4" style={s.page}>

        {/* Marca de agua */}
        <Text style={s.watermark} fixed>BORRADOR</Text>

        {/* ══ CABECERA ══════════════════════════════════ */}
        <View style={s.header}>

          {/* Bloque empresa */}
          <View style={s.companyBlock}>
            <Image src={logoSrc} style={s.logo} />
            <Text style={s.companyName}>{COMPANY.name}</Text>
            <Text style={s.rutBadge}>R.U.T.: {COMPANY.rut}</Text>
            <Text style={s.giroText}>Giro: {COMPANY.giro}</Text>
            <View style={s.companyRow}>
              <Text style={s.companyLabel}>Dir.:</Text>
              <Text style={s.companyValue}>{COMPANY.address}</Text>
            </View>
            <View style={s.companyRow}>
              <Text style={s.companyLabel}>Ciudad:</Text>
              <Text style={s.companyValue}>{COMPANY.city}</Text>
            </View>
            <View style={s.companyRow}>
              <Text style={s.companyLabel}>Email:</Text>
              <Text style={s.companyValue}>{COMPANY.email}</Text>
            </View>
          </View>

          {/* Caja tipo documento */}
          <View style={s.invoiceBox}>
            <Text style={s.invoiceTypeText}>FACTURA DE EXPORTACIÓN{"\n"}ELECTRÓNICA</Text>
            <Text style={s.invoiceNum}>Nº —</Text>
            <Text style={s.invoiceSii}>{COMPANY.sii}</Text>
            <View style={s.invoiceDateBox}>
              <Text style={s.invoiceDateText}>Fecha Emisión:</Text>
              <Text style={[s.invoiceDateText, { fontFamily: "Helvetica", marginTop: 2 }]}>
                {fmtLong(form.issue_date)}
              </Text>
            </View>
            {form.due_date && (
              <Text style={s.invoiceDateSub}>
                Vence: {fmtLong(form.due_date)}
              </Text>
            )}
          </View>
        </View>

        {/* ══ RECEPTOR ══════════════════════════════════ */}
        <View style={s.sectionWrapper}>
          <View style={s.sectionHead}>
            <Text style={s.sectionHeadText}>DATOS DEL RECEPTOR</Text>
          </View>
          <View style={s.clientGrid}>
            {clientRows.map(({ label, value, bold }, i) => (
              <View
                key={i}
                style={[
                  s.clientCell,
                  i % 2 === 0 ? s.clientCellBorderRight : {},
                ]}
              >
                <Text style={s.clientCellLabel}>{label}</Text>
                <Text style={bold ? s.clientCellValueBold : s.clientCellValue}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══ TABLA DE ÍTEMS ════════════════════════════ */}
        <View style={s.table}>
          {/* Encabezado */}
          <View style={s.tableHead}>
            <Text style={[s.thText, s.colNum]}>#</Text>
            <Text style={[s.thText, s.colDesc]}>Descripción</Text>
            <Text style={[s.thText, s.colQty, { textAlign: "right" }]}>Cantidad</Text>
            <Text style={[s.thText, s.colPrice, { textAlign: "right" }]}>Precio Unit.</Text>
            <Text style={[s.thText, s.colDisc, { textAlign: "right" }]}>%Desc.</Text>
            <Text style={[s.thText, s.colTotal, { textAlign: "right" }]}>Valor</Text>
          </View>

          {/* Ítems */}
          {items.map((item, i) => (
            <View
              key={i}
              style={[s.tableRow, i % 2 !== 0 ? s.tableRowAlt : {}]}
            >
              <Text style={[s.tdTextGray, s.colNum]}>{i + 1}</Text>
              <Text style={[s.tdText, s.colDesc]}>{item.description || "—"}</Text>
              <Text style={[s.tdText, s.colQty, { textAlign: "right" }]}>
                {Number(item.quantity).toLocaleString("es-CL")}
              </Text>
              <Text style={[s.tdText, s.colPrice, { textAlign: "right" }]}>
                ${fmt(item.unit_price)}
              </Text>
              <Text style={[s.tdTextGray, s.colDisc, { textAlign: "right" }]}>—</Text>
              <Text style={[s.tdTextBold, s.colTotal, { textAlign: "right" }]}>
                ${fmt(Number(item.quantity) * Number(item.unit_price))}
              </Text>
            </View>
          ))}

          {/* Filas vacías de relleno */}
          {[...Array(EMPTY_ROWS)].map((_, i) => (
            <View
              key={`e${i}`}
              style={[
                s.tableRow,
                s.tableRowEmpty,
                (items.length + i) % 2 !== 0 ? s.tableRowAlt : {},
              ]}
            >
              <Text style={s.colDesc}> </Text>
            </View>
          ))}
        </View>

        {/* ══ PIE: TIMBRE + TOTALES ═════════════════════ */}
        <View style={s.footer}>

          {/* Timbre */}
          <View style={s.stampBox}>
            <QRPlaceholder />
            <Text style={s.stampText}>Timbre Electrónico SII</Text>
            <Text style={s.stampSub}>Res.99 de 2014 — Verifique documento: www.sii.cl</Text>
          </View>

          {/* Totales */}
          <View style={s.totalsBox}>
            <View style={s.totalsHead}>
              <Text>RESUMEN</Text>
            </View>
            <View style={s.totalsBody}>
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>EXENTO</Text>
                <Text style={s.totalsValue}>${fmt(subtotal)}</Text>
              </View>
              <View style={s.totalsFinal}>
                <Text>TOTAL {form.currency}</Text>
                <Text>${fmt(subtotal)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ══ OBSERVACIONES ════════════════════════════ */}
        {form.notes ? (
          <View style={s.notesSection}>
            <Text style={s.notesLabel}>Observaciones:</Text>
            <Text style={s.notesText}>{form.notes}</Text>
          </View>
        ) : null}

      </Page>
    </Document>
  );
}
