import * as XLSX from "xlsx"
import { Request } from "@/app/requests-selection/columns"

const COLUMN_WIDTHS = [
  { wch: 8 },  // ลำดับ
  { wch: 40 }, // ชื่อหนังสือ
  { wch: 25 }, // ผู้แต่ง
  { wch: 15 }, // ISBN/ISSN
  { wch: 12 }, // ปีที่พิมพ์
  { wch: 25 }, // สำนักพิมพ์
  { wch: 20 }, // สำหรับสาขา
  { wch: 25 }, // ชื่อผู้ร้องขอ
  { wch: 15 }, // รหัสประจำตัว
  { wch: 15 }, // สถานะผู้ร้องขอ
  { wch: 25 }, // คณะ
  { wch: 25 }, // สาขาวิชา
  { wch: 30 }, // เหตุผลการร้องขอ
  { wch: 40 }  // รายละเอียดเพิ่มเติม
]

export const exportRequestsToExcel = (
  data: Request[],
  fileBaseName: string
) => {
  const exportData = data.map((item, index) => ({
    'ลำดับ': index + 1,
    'ชื่อหนังสือ': item.details.title || '-',
    'ผู้แต่ง': item.details.author || '-',
    'ISBN/ISSN': item.details.isbn || '-',
    'ปีที่พิมพ์': item.details.year || '-',
    'สำนักพิมพ์': item.details.publisher || '-',
    'สำหรับสาขา': item.details.branch || '-',
    'ชื่อผู้ร้องขอ': item.details.requester.name || '-',
    'รหัสประจำตัว': item.details.requester.studentId || '-',
    'สถานะผู้ร้องขอ': item.details.requester.status || '-',
    'คณะ': item.details.requester.faculty || '-',
    'สาขาวิชา': item.details.requester.major || '-',
    'เหตุผลการร้องขอ': item.details.requestReason || '-',
    'รายละเอียดเพิ่มเติม': item.details.detailReason || '-'
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, fileBaseName)
  
  worksheet['!cols'] = COLUMN_WIDTHS

  const today = new Date()
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
  const filename = `${fileBaseName}_${dateStr}.xlsx`

  XLSX.writeFile(workbook, filename)
}
