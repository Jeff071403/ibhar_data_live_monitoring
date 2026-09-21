import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ReportDetailData } from '../types';

export const exportReportToPDF = (title: string, data: ReportDetailData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text("IBHAR LIVE HOSPITAL DATA MONITORING SYSTEM", 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`AUDIT REPORT: ${title.toUpperCase()}`, 14, 18);

  // Metadata Block
  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const genTime = data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString();
  doc.text(`Generated At: ${genTime}`, 14, 30);

  const filtersStr = Object.entries(data.filters_applied || {})
    .filter(([_, v]) => v && v !== 'ALL')
    .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
    .join(' | ') || 'All Data (No Active Filters)';
  doc.text(`Applied Filters: ${filtersStr}`, 14, 35);

  // Summary Metrics Section
  let currentY = 42;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Executive Report Summary", 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const summaryEntries = Object.entries(data.summary || {});
  const summaryText = summaryEntries.map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`).join('   |   ');
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 36);
  doc.text(splitSummary, 18, currentY + 12);

  currentY += 26;

  // Build Table Data
  let tableHeaders: string[] = [];
  let tableRows: (string | number)[][] = [];

  const rawRows = data.rows || data.breakdown || [];

  if (rawRows.length > 0) {
    const sample = rawRows[0];
    if ('delay_minutes' in sample && 'actual_received_time' in sample) {
      // Delay Report
      tableHeaders = ['Hospital Name', 'Data Type', 'Expected', 'Actual Received', 'Delay (Min)', 'Status'];
      tableRows = rawRows.map(r => [
        r.hospital_name || r.hospital_id,
        r.data_type || 'TELEMETRY',
        r.expected_time || 'N/A',
        r.actual_received_time ? new Date(r.actual_received_time).toLocaleTimeString() : 'N/A',
        r.delay_minutes ?? 0,
        r.status || 'N/A'
      ]);
    } else if ('record_count' in sample && 'data_size_mb' in sample && 'hospital_name' in sample && !('encounters_count' in sample)) {
      // Volume / Latency Report
      if ('response_time_ms' in sample) {
        tableHeaders = ['Hospital Name', 'Data Type', 'Timestamp', 'Response (ms)', 'Baseline Avg', 'Spike Flag'];
        tableRows = rawRows.map(r => [
          r.hospital_name || r.hospital_id,
          r.data_type || 'TELEMETRY',
          r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'N/A',
          r.response_time_ms ?? 0,
          r.baseline_avg_ms ?? 'N/A',
          r.is_high_latency_spike ? 'HIGH LATENCY' : 'NORMAL'
        ]);
      } else {
        tableHeaders = ['Hospital Name', 'Data Type', 'Timestamp', 'Record Count', 'Volume (MB)'];
        tableRows = rawRows.map(r => [
          r.hospital_name || r.hospital_id,
          r.data_type || 'TELEMETRY',
          r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'N/A',
          r.record_count ?? 0,
          r.data_size_mb ?? 0
        ]);
      }
    } else if ('error_message' in sample || 'severity' in sample) {
      // Error Report
      tableHeaders = ['Hospital Name', 'Data Type', 'Timestamp', 'Severity', 'Status', 'Error Message'];
      tableRows = rawRows.map(r => [
        r.hospital_name || r.hospital_id,
        r.data_type || 'TELEMETRY',
        r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'N/A',
        r.severity || 'WARNING',
        r.status || 'ACTIVE',
        (r.error_message || 'N/A').substring(0, 40)
      ]);
    } else if ('current_status' in sample) {
      // Integration Health Report
      tableHeaders = ['Hospital Name', 'Status', 'Last Received', 'Delay (Min)', 'Frequency', 'Latest Vol (MB)', 'Alerts'];
      tableRows = rawRows.map(r => [
        r.hospital_name || r.hospital_id,
        r.current_status || 'UNKNOWN',
        r.last_received ? new Date(r.last_received).toLocaleTimeString() : 'N/A',
        r.delay_minutes ?? 0,
        `${r.data_frequency_minutes || 30} min`,
        r.latest_volume_mb ?? 0,
        r.active_alerts_count ?? 0
      ]);
    } else {
      // Data Summary Breakdown
      tableHeaders = ['Hospital Name', 'Encounters', 'Discharges', 'Records', 'Volume (MB)', 'Avg Latency (ms)'];
      tableRows = rawRows.map(r => [
        r.hospital_name || r.hospital_id,
        r.encounters_count ?? 0,
        r.discharges_count ?? 0,
        r.records_received ?? 0,
        r.data_volume_mb ?? 0,
        r.avg_response_time_ms ?? 0
      ]);
    }
  }

  if (tableHeaders.length > 0 && tableRows.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: 50 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(data.message || "No telemetry records found matching the selected period.", 14, currentY + 10);
  }

  // Footer / Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`IBHAR Confidential Telemetry System — Page ${i} of ${pageCount}`, pageWidth / 2, 288, { align: 'center' });
  }

  const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

export const exportReportToExcel = (title: string, data: ReportDetailData) => {
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryRows = [
    ["IBHAR LIVE HOSPITAL DATA MONITORING SYSTEM"],
    [`REPORT: ${title.toUpperCase()}`],
    [`Generated At: ${data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()}`],
    [],
    ["METRIC NAME", "VALUE"]
  ];

  Object.entries(data.summary || {}).forEach(([k, v]) => {
    summaryRows.push([k.replace(/_/g, ' ').toUpperCase(), String(v)]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Report Summary");

  // 2. Data Sheet
  const rawRows = data.rows || data.breakdown || [];
  if (rawRows.length > 0) {
    const dataSheet = XLSX.utils.json_to_sheet(rawRows);
    XLSX.utils.book_append_sheet(wb, dataSheet, "Detailed Data");
  }

  const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const exportReportToCSV = (title: string, data: ReportDetailData) => {
  const rawRows = data.rows || data.breakdown || [];

  let csvContent = `IBHAR TELEMETRY REPORT: ${title}\n`;
  csvContent += `Generated At: ${data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()}\n\n`;

  csvContent += "REPORT SUMMARY METRICS\n";
  Object.entries(data.summary || {}).forEach(([k, v]) => {
    csvContent += `"${k.replace(/_/g, ' ').toUpperCase()}","${v}"\n`;
  });
  csvContent += "\n";

  if (rawRows.length > 0) {
    const headers = Object.keys(rawRows[0]);
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

    rawRows.forEach(row => {
      const line = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
      csvContent += line + '\n';
    });
  } else {
    csvContent += "No records found for the selected period.\n";
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const element = document.createElement('a');
  element.href = URL.createObjectURL(blob);
  element.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
