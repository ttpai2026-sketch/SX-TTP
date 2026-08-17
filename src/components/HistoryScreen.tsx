import React, { useEffect, useState, useMemo } from 'react';
import { HistoryRecord, WeekCatalogItem } from '../types';
import { Eye, Search, Filter, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface HistoryScreenProps {
  records: HistoryRecord[];
  weeks: WeekCatalogItem[];
  onViewItemDetail: (itemId: string) => void;
  onViewRecordReceipt?: (record: HistoryRecord) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  records,
  weeks,
  onViewItemDetail,
  onViewRecordReceipt
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        rec.itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.documentCode && rec.documentCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchWeek = selectedWeek === 'all' || rec.week === selectedWeek;

      return matchSearch && matchWeek;
    });
  }, [records, searchTerm, selectedWeek]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const displayedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalImportSum = records.reduce((acc, curr) => acc + curr.importQty, 0);
  const totalSlips = new Set(records.map((record) => record.documentCode || record.id)).size;
  const weekOptions = useMemo(() => Array.from(new Set([
    ...weeks.map((week) => week.code),
    ...records.map((record) => record.week)
  ])).filter(Boolean).sort((a, b) => {
    const aDate = weeks.find((week) => week.code === a)?.startDate || '';
    const bDate = weeks.find((week) => week.code === b)?.startDate || '';
    return bDate.localeCompare(aDate) || b.localeCompare(a);
  }), [records, weeks]);
  const weekLabel = (code: string) => weeks.find((week) => week.code === code)?.label || code;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-[24px] font-bold text-[#191c1d]">Lịch Sử Nhập Liệu</h2>
        <p className="text-[14px] text-[#515f74] mt-0.5">
          Xem lại các giao dịch nhập kho đã thực hiện
        </p>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Tổng số phiếu */}
        <div className="border border-[#c1c6d6] bg-white rounded-lg p-4 flex flex-col justify-center shadow-xs">
          <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider mb-1">
            Tổng số phiếu
          </span>
          <span className="text-[24px] font-bold text-[#005bbf]">
            {totalSlips}
          </span>
        </div>

        {/* Card 2: Tổng lượng nhập */}
        <div className="border border-[#c1c6d6] bg-white rounded-lg p-4 flex flex-col justify-center shadow-xs">
          <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider mb-1">
            Tổng lượng nhập
          </span>
          <span className="text-[24px] font-bold text-[#191c1d]">
            {totalImportSum.toLocaleString('vi-VN')}
          </span>
        </div>

        {/* Card 3: Phiếu lỗi */}
        <div className="border border-[#c1c6d6] bg-white rounded-lg p-4 flex flex-col justify-center shadow-xs">
          <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider mb-1">
            Phiếu lỗi / Sai lệch
          </span>
          <span className="text-[24px] font-bold text-[#ba1a1a]">0</span>
        </div>

        {/* Card 4: Tỉ lệ hoàn thành */}
        <div className="border border-[#c1c6d6] bg-white rounded-lg p-4 flex flex-col justify-center shadow-xs">
          <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider mb-1">
            Tỉ lệ hoàn thành
          </span>
          <span className="text-[24px] font-bold text-[#006c4a] flex items-center gap-1">
            <CheckCircle className="w-5 h-5 text-[#006c4a]" />
            —
          </span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border border-[#c1c6d6] rounded-lg p-3 flex flex-col md:flex-row justify-between items-center gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#727785]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã hàng, tên, chứng từ..."
            className="w-full pl-9 pr-4 py-2 bg-[#f3f4f5] border border-[#c1c6d6] rounded text-[13px] text-[#191c1d] focus:border-[#005bbf] focus:ring-1 focus:ring-[#005bbf] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-[#515f74] font-medium hidden sm:inline">
            Lọc tuần:
          </span>
          <select
            value={selectedWeek}
            onChange={(e) => {
              setSelectedWeek(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#f3f4f5] border border-[#c1c6d6] rounded py-2 px-3 text-[13px] text-[#191c1d] focus:border-[#005bbf] outline-none cursor-pointer"
          >
            <option value="all">Tất cả các tuần</option>
            {weekOptions.map((week) => (
              <option key={week} value={week}>{weekLabel(week)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#c1c6d6] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-[#f3f4f5] border-b border-[#c1c6d6] text-[12px] font-bold text-[#191c1d] uppercase tracking-wider">
                <th className="py-3 px-4 sticky left-0 bg-[#f3f4f5] z-10 w-36">
                  Ngày/Giờ
                </th>
                <th className="py-3 px-4 w-20">Tuần</th>
                <th className="py-3 px-4 w-32">Mã Hàng</th>
                <th className="py-3 px-4">Tên Hàng</th>
                <th className="py-3 px-4 text-right w-28">Số Lượng Nhập</th>
                <th className="py-3 px-4 text-right w-28">Số Lượng Tồn</th>
                <th className="py-3 px-4 text-right w-28">Số Lượng Xuất</th>
                <th className="py-3 px-4 text-center w-16"></th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[#191c1d]">
              {displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#515f74]">
                    Không có bản ghi lịch sử phù hợp
                  </td>
                </tr>
              ) : (
                displayedRecords.map((rec, idx) => (
                  <tr
                    key={rec.id}
                    className={`border-b border-[#e1e3e4] hover:bg-[#f3f4f5] transition-colors group cursor-pointer ${
                      idx % 2 === 1 ? 'bg-[#f8f9fa]' : 'bg-white'
                    }`}
                    onClick={() => onViewItemDetail(rec.itemId)}
                  >
                    <td className="py-2.5 px-4 font-mono text-xs text-[#515f74] sticky left-0 bg-inherit z-10">
                      {rec.dateTime}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#515f74]">
                      {rec.week}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#005bbf] hover:underline">
                      {rec.itemId}
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      {rec.itemName}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-[#00885f]">
                      {rec.importQty > 0 ? `+${rec.importQty}` : rec.importQty}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[#515f74]">
                      {rec.stockQty}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[#ba1a1a]">
                      {rec.exportQty}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewRecordReceipt) onViewRecordReceipt(rec);
                          else onViewItemDetail(rec.itemId);
                        }}
                        className="text-[#727785] hover:text-[#005bbf] hover:bg-[#e7e8e9] p-1.5 rounded transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-[#c1c6d6] bg-white text-xs text-[#515f74]">
          <span>
            Hiển thị {displayedRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredRecords.length)} trên {filteredRecords.length} kết quả
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-[#c1c6d6] hover:bg-[#f3f4f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[#191c1d]">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-[#c1c6d6] hover:bg-[#f3f4f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
