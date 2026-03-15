export type ApprovalDocumentItem = {
  evaluation_id: number
  title: string
  quantity: number
  unit: string
  unit_price: string
  total_price: string
  net_price?: string
  vendor_name: string
}

const escapeHtml = (input: string): string => {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const toThaiNumber = (value: number): string => {
  return new Intl.NumberFormat("th-TH").format(value)
}

const toNumberOrNull = (value: unknown): number | null => {
  const numeric = Number.parseFloat(String(value ?? "").replace(/,/g, ""))
  return Number.isNaN(numeric) ? null : numeric
}

const getBestPriceValue = (item: ApprovalDocumentItem): number | null => {
  return toNumberOrNull(item.total_price) ?? toNumberOrNull(item.net_price) ?? toNumberOrNull(item.unit_price)
}

const normalizePrice = (value: string): string => {
  const numeric = Number.parseFloat(String(value).replace(/,/g, ""))
  if (Number.isNaN(numeric)) {
    return "-"
  }
  return toThaiNumber(Math.round(numeric))
}

export const buildApprovalDocumentHtml = (
  items: ApprovalDocumentItem[],
  batchDateText?: string | null,
): string => {
  const totalAmount = items.reduce((sum, item) => {
    const parsed = getBestPriceValue(item)
    return sum + (parsed ?? 0)
  }, 0)

  const headerDate = batchDateText ?? "-"
  const rows = items
    .map((item, index) => {
      const displayPrice = normalizePrice(String(getBestPriceValue(item) ?? ""))
      return `<li>Title : ${escapeHtml(item.title)}<br/>จำนวน ${toThaiNumber(item.quantity)} ${escapeHtml(item.unit || "รายการ")} ราคา ${displayPrice} บาท (ร้าน ${escapeHtml(item.vendor_name || "-")})</li>`
    })
    .join("")

  return `
    <h2>เอกสารขออนุมัติซื้อทรัพยากรสารสนเทศ</h2>
    <p>ช่วงวันที่: ${escapeHtml(headerDate)}</p>
    <p>เลขที่ใบจัดซื้อ: ${escapeHtml(String(items[0]?.evaluation_id ?? "-"))}</p>
    <p>รายการที่เสนออนุมัติทั้งหมด ${toThaiNumber(items.length)} รายการ</p>
    <ol>
      ${rows || "<li>-</li>"}
    </ol>
    <p><strong>รวมเป็นเงินประมาณ ${toThaiNumber(Math.round(totalAmount))} บาท</strong></p>
    <p>หมายเหตุ:</p>
    <ol>
      <li>ราคาที่ปรากฏในเอกสารเป็นราคาจากใบเสนอราคาล่าสุดที่ผ่านการพิจารณา</li>
      <li>ข้อมูลสามารถปรับแก้เพิ่มเติมก่อนยืนยันเอกสาร</li>
    </ol>
  `
}
