import React, { useMemo, useState } from 'react';
import { HistoryRecord, InventoryItem, WeekCatalogItem } from '../types';
import { Download, RefreshCw, BarChart2 } from 'lucide-react';

interface ReportScreenProps {
  items: InventoryItem[];
  history: HistoryRecord[];
  weeks: WeekCatalogItem[];
  onNavigateToDetail: (itemId: string) => void;
  onOpenGoogleSheets?: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  items,
  history,
  weeks,
  onNavigateToDetail,
  onOpenGoogleSheets
}) => {
  const [fromWeek, setFromWeek] = useState('');
  const [toWeek, setToWeek] = useState('');
  const [monthFilter, setMonthFilter] = useState('full');
  const [filterApplied, setFilterApplied] = useState(false);

  const weekOptions = useMemo(() => {
    const options = new Map<string, WeekCatalogItem>(
      weeks.map((week) => [week.code, week] as const)
    );
    history.forEach((record) => {
      if (!record.week || options.has(record.week)) return;
      options.set(record.week, {
        code: record.week,
        year: record.year || 0,
        startDate: record.startDate || '',
        endDate: record.endDate || '',
        label: record.week,
        status: 'Đã đóng'
      });
    });
    return Array.from(options.values()).sort(
      (a, b) => a.startDate.localeCompare(b.startDate) || a.code.localeCompare(b.code)
    );
  }, [history, weeks]);
  const weekOrder = useMemo(
    () => new Map(weekOptions.map((week, index) => [week.code, index])),
    [weekOptions]
  );
  const monthOptions = useMemo(
    () => Array.from(new Set<string>(history.map((record) => record.dateTime.slice(0, 7))))
      .filter((month) => /^\d{4}-\d{2}$/.test(month))
      .sort()
      .reverse(),
    [history]
  );
  const hasPeriodFilter = monthFilter !== 'full' || fromWeek !== '' || toWeek !== '';

  const reportItems = useMemo(() => items.map((item) => {
    if (!hasPeriodFilter) {
      return {
        ...item,
        tonDau: item.initialStock,
        luyKeNhap: item.totalImport,
        luyKeXuat: item.totalExport,
        tonCuoi: item.currentStock
      };
    }

    const itemHistory = history.filter((record) => record.itemId === item.id);
    const selectedRecords = itemHistory.filter((record) => {
      if (monthFilter !== 'full') return record.dateTime.startsWith(monthFilter);
      const week = weekOrder.get(record.week) ?? -1;
      const from = fromWeek ? (weekOrder.get(fromWeek) ?? 0) : 0;
      const to = toWeek ? (weekOrder.get(toWeek) ?? weekOptions.length - 1) : weekOptions.length - 1;
      return week >= from && week <= to;
    });
    const earlierRecords = itemHistory.filter((record) => {
      if (monthFilter !== 'full') return record.dateTime.slice(0, 7) < monthFilter;
      const week = weekOrder.get(record.week) ?? -1;
      return week < (fromWeek ? (weekOrder.get(fromWeek) ?? 0) : 0);
    });
    const tonDau = earlierRecords.reduce(
      (stock, record) => stock + record.importQty - record.exportQty,
      item.initialStock
    );
    const luyKeNhap = selectedRecords.reduce((sum, record) => sum + record.importQty, 0);
    const luyKeXuat = selectedRecords.reduce((sum, record) => sum + record.exportQty, 0);

    return {
      ...item,
      tonDau,
      luyKeNhap,
      luyKeXuat,
      tonCuoi: tonDau + luyKeNhap - luyKeXuat
    };
  }), [fromWeek, hasPeriodFilter, history, items, monthFilter, toWeek, weekOptions.length, weekOrder]);

  // Calculate totals
  const totalTonDau = reportItems.reduce((acc, curr) => acc + curr.tonDau, 0);
  const totalNhap = reportItems.reduce((acc, curr) => acc + curr.luyKeNhap, 0);
  const totalXuat = reportItems.reduce((acc, curr) => acc + curr.luyKeXuat, 0);
  const totalTonCuoi = reportItems.reduce((acc, curr) => acc + curr.tonCuoi, 0);

  const handleExportExcel = () => {
    const escapeCsv = (value: string | number) => {
      const text = String(value);
      const formulaSafe = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${formulaSafe.replace(/"/g, '""')}"`;
    };
    const headers = ['Mã Hàng', 'Tên Hàng', 'Đơn Vị', 'Tồn Đầu', 'Lũy Kế Nhập', 'Lũy Kế Xuất', 'Tồn Cuối'];
    const rows = reportItems.map(it => [
      it.id,
      it.name,
      it.unit,
      it.tonDau,
      it.luyKeNhap,
      it.luyKeXuat,
      it.tonCuoi
    ]);
    const summaryRow = ['Tổng Cộng', '', '', totalTonDau, totalNhap, totalXuat, totalTonCuoi];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(',')),
      summaryRow.map(escapeCsv).join(',')
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Nhap_Xuat_Ton_Nha_Khuon_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyFilter = () => {
    setFilterApplied(true);
    setTimeout(() => setFilterApplied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#191c1d] mb-1">
            Báo Cáo Nhập Xuất Tồn
          </h2>
          <p className="text-[14px] text-[#515f74]">
            Thống kê chi tiết vật tư, nguyên liệu định kỳ.
          </p>
        </div>
      </div>

      {/* Filters & Actions Box */}
      <div className="bg-white border border-[#c1c6d6] rounded-lg p-4 flex flex-col md:flex-row gap-4 items-end shadow-xs">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Từ Tuần */}
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#515f74]">
              Từ Tuần
            </label>
            <select
              id="select-from-week"
              value={fromWeek}
              onChange={(e) => setFromWeek(e.target.value)}
              className="bg-white border border-[#c1c6d6] rounded p-2 text-[13px] text-[#191c1d] focus:border-[#005bbf] focus:ring-1 focus:ring-[#005bbf] outline-none"
            >
              <option value="">Tất cả</option>
              {weekOptions.map((week) => (
                <option key={week.code} value={week.code}>{week.label}</option>
              ))}
            </select>
          </div>

          {/* Đến Tuần */}
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#515f74]">
              Đến Tuần
            </label>
            <select
              id="select-to-week"
              value={toWeek}
              onChange={(e) => setToWeek(e.target.value)}
              className="bg-white border border-[#c1c6d6] rounded p-2 text-[13px] text-[#191c1d] focus:border-[#005bbf] focus:ring-1 focus:ring-[#005bbf] outline-none"
            >
              <option value="">Tất cả</option>
              {weekOptions.map((week) => (
                <option key={week.code} value={week.code}>{week.label}</option>
              ))}
            </select>
          </div>

          {/* Hoặc theo Tháng */}
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#515f74]">
              Hoặc theo Tháng
            </label>
            <select
              id="select-month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-white border border-[#c1c6d6] rounded p-2 text-[13px] text-[#191c1d] focus:border-[#005bbf] focus:ring-1 focus:ring-[#005bbf] outline-none"
            >
              <option value="full">Full dữ liệu</option>
              {monthOptions.map((month) => {
                const [year, value] = month.split('-');
                return <option key={month} value={month}>Tháng {value}/{year}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          {onOpenGoogleSheets && (
            <button
              id="btn-report-google-sheets"
              onClick={onOpenGoogleSheets}
              className="flex-1 md:flex-none bg-[#006c4a] hover:bg-[#004e35] text-white text-[12px] font-bold tracking-wider uppercase px-4 py-2.5 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Google Sheets Sync</span>
            </button>
          )}

          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="flex-1 md:flex-none bg-[#f3f4f5] border border-[#c1c6d6] text-[#191c1d] text-[12px] font-bold tracking-wider uppercase px-4 py-2.5 rounded hover:bg-[#e1e3e4] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </button>

          <button
            id="btn-apply-report-filter"
            onClick={handleApplyFilter}
            className="flex-1 md:flex-none bg-[#005bbf] hover:bg-[#004493] text-white text-[12px] font-bold tracking-wider uppercase px-5 py-2.5 rounded transition-colors shadow-sm cursor-pointer"
          >
            {filterApplied ? 'Đang cập nhật...' : 'Xem Báo Cáo'}
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#c1c6d6] rounded-lg overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-[#f3f4f5] border-b border-[#c1c6d6] text-[12px] font-bold text-[#191c1d] uppercase tracking-wider">
              <th className="p-3 border-r border-[#c1c6d6] sticky left-0 z-10 bg-[#f3f4f5] w-36">
                Mã Hàng
              </th>
              <th className="p-3 border-r border-[#c1c6d6] min-w-[220px]">
                Tên Hàng
              </th>
              <th className="p-3 text-right border-r border-[#c1c6d6] w-28">
                Tồn Đầu
              </th>
              <th className="p-3 text-right border-r border-[#c1c6d6] w-32">
                Lũy Kế Nhập
              </th>
              <th className="p-3 text-right border-r border-[#c1c6d6] w-32">
                Lũy Kế Xuất
              </th>
              <th className="p-3 text-right w-28">
                Tồn Cuối
              </th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-[#191c1d]">
            {reportItems.map((item, idx) => (
              <tr
                key={item.id}
                className={`border-b border-[#e1e3e4] hover:bg-[#f3f4f5] transition-colors cursor-pointer ${
                  idx % 2 === 1 ? 'bg-[#f8f9fa]' : 'bg-white'
                }`}
                onClick={() => onNavigateToDetail(item.id)}
              >
                <td className="p-3 border-r border-[#e1e3e4] sticky left-0 z-10 bg-inherit font-bold text-[#005bbf] hover:underline">
                  {item.id}
                </td>
                <td className="p-3 border-r border-[#e1e3e4] font-medium">
                  {item.name}
                </td>
                <td className="p-3 text-right border-r border-[#e1e3e4] text-[#515f74]">
                  {item.tonDau.toLocaleString('vi-VN')}
                </td>
                <td className="p-3 text-right border-r border-[#e1e3e4] text-[#00885f] font-semibold">
                  {item.luyKeNhap.toLocaleString('vi-VN')}
                </td>
                <td className="p-3 text-right border-r border-[#e1e3e4] text-[#ba1a1a] font-semibold">
                  {item.luyKeXuat.toLocaleString('vi-VN')}
                </td>
                <td className="p-3 text-right font-bold text-[#191c1d]">
                  {item.tonCuoi.toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}

            {/* Tổng cộng Row */}
            <tr className="bg-[#f3f4f5] text-[13px] font-bold border-t-2 border-[#c1c6d6]">
              <td
                className="p-3 text-right border-r border-[#c1c6d6] sticky left-0 z-10 bg-[#f3f4f5] uppercase tracking-wider text-[#191c1d]"
                colSpan={2}
              >
                Tổng Cộng
              </td>
              <td className="p-3 text-right border-r border-[#c1c6d6] text-[#191c1d]">
                {totalTonDau.toLocaleString('vi-VN')}
              </td>
              <td className="p-3 text-right border-r border-[#c1c6d6] text-[#00885f]">
                {totalNhap.toLocaleString('vi-VN')}
              </td>
              <td className="p-3 text-right border-r border-[#c1c6d6] text-[#ba1a1a]">
                {totalXuat.toLocaleString('vi-VN')}
              </td>
              <td className="p-3 text-right text-[#005bbf] font-extrabold">
                {totalTonCuoi.toLocaleString('vi-VN')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[#515f74] text-xs">
        <span>Hiển thị {reportItems.length} / {reportItems.length} mã hàng</span>
        <span className="italic">
          Dữ liệu cập nhật lúc: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date().toLocaleDateString('vi-VN')}
        </span>
      </div>
    </div>
  );
};
