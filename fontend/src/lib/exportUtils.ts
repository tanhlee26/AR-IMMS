import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToExcel(data: Record<string, any>[], fileName: string, sheetName = "Report") {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    return true;
  } catch (error) {
    console.error("Lỗi xuất Excel:", error);
    return false;
  }
}

export function exportPueReportPdf(pueData: {
  pue: number;
  itPower: number;
  facilityPower: number;
  totalPower: number;
  statusText: string;
  racks: Array<{ name: string; power: number; nodes: number }>;
}) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Tiêu đề báo cáo
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("AR-IMMS COMMAND CENTER", 14, 16);

    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("BAO CAO HIEU QUA SU DUNG NANG LUONG DATA CENTER (PUE)", 14, 25);
    doc.text(`Ngay xuat: ${new Date().toLocaleString("vi-VN")}`, 14, 30);

    // Bảng chỉ số tổng quan KPI
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text("1. Chi So PUE & Cong Suat Tieu Thu Tong The", 14, 46);

    autoTable(doc, {
      startY: 50,
      head: [["Chi So Nang Luong", "Gia Tri", "Don Vi", "Danh Gia Hieu Qua"]],
      body: [
        ["Power Usage Effectiveness (PUE)", pueData.pue.toFixed(2), "Ratio", pueData.statusText],
        ["Cong suat thiet bi IT (IT Equipment)", pueData.itPower.toFixed(2), "kW", "Tai huu ich"],
        ["Cong suat lam mat & Phu tro", pueData.facilityPower.toFixed(2), "kW", "HVAC / UPS / Lighting"],
        ["Tong cong suat toan trung tam", pueData.totalPower.toFixed(2), "kW", "Tong tai tieu thu"],
      ],
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10, cellPadding: 4 },
    });

    // Bảng phân rã chi tiết theo Tủ Rack
    const nextY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.text("2. Phan Ra Cong Suat Theo Tu Rack May Chu", 14, nextY);

    const rackRows = (pueData.racks || []).map((r, idx) => [
      idx + 1,
      r.name,
      `${r.power.toFixed(1)} W`,
      `${(r.power / 1000).toFixed(2)} kW`,
      r.nodes,
      r.power > 3000 ? "Tai Cao" : "Binh Thuong",
    ]);

    autoTable(doc, {
      startY: nextY + 4,
      head: [["STT", "Ten Tu Rack", "Cong Suat (W)", "Cong Suat (kW)", "So May Chu", "Trang Thai"]],
      body: rackRows.length > 0 ? rackRows : [["-", "Khong co du lieu", "-", "-", "-", "-"]],
      theme: "striped",
      headStyles: { fillColor: [15, 118, 110] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Chân trang
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("He thong Giam sat & Bao tri Tang cuong AR-IMMS - Phong Dieu Hanh Chi Huy", 14, finalY);

    doc.save(`Bao_cao_PUE_AR-IMMS_${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  } catch (err) {
    console.error("Lỗi xuất PDF:", err);
    return false;
  }
}
