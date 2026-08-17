import React, { useEffect, useMemo, useState } from 'react';
import { InventoryItem } from '../types';
import { Save, RotateCcw, Plus, CheckCircle, Info } from 'lucide-react';

interface DataEntryScreenProps {
  items: InventoryItem[];
  onSaveSlip: (week: string, rows: { itemId: string; importQty: number; newStockQty: number; exportQty: number }[]) => void;
  onNavigateToDetail: (itemId: string) => void;
}

interface FormRow {
  itemId: string;
  name: string;
  initialStock: number;
  importQty: string;
  newStockQty: string;
  calculatedExport: number;
}

const getWeekNumber = (date: Date) => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const createRows = (items: InventoryItem[]): FormRow[] =>
  items.slice(0, 6).map((item) => ({
    itemId: item.id,
    name: item.name,
    initialStock: item.currentStock,
    importQty: '',
    newStockQty: '',
    calculatedExport: 0
  }));

export const DataEntryScreen: React.FC<DataEntryScreenProps> = ({
  items,
  onSaveSlip,
  onNavigateToDetail
}) => {
  const currentWeek = getWeekNumber(new Date());
  const [selectedWeek, setSelectedWeek] = useState(String(currentWeek));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const weekOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => String(Math.max(1, currentWeek - index))),
    [currentWeek]
  );

  // Initialize rows from current items (default top 6 from mock)
  const [rows, setRows] = useState<FormRow[]>(() => createRows(items));

  useEffect(() => {
    setRows((currentRows) => {
      const hasUnsavedInput = currentRows.some(
        (row) => row.importQty !== '' || row.newStockQty !== ''
      );
      return hasUnsavedInput ? currentRows : createRows(items);
    });
  }, [items]);

  const handleInputChange = (
    index: number,
    field: 'importQty' | 'newStockQty',
    value: string
  ) => {
    setRows((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };
      
      const imp = parseFloat(target.importQty) || 0;
      const stock = target.newStockQty === '' ? target.initialStock + imp : (parseFloat(target.newStockQty) || 0);
      
      // Calculate export: Tồn cũ + Nhập - Tồn mới
      const exp = Math.max(0, target.initialStock + imp - stock);
      target.calculatedExport = exp;
      next[index] = target;
      return next;
    });
  };

  const handleReset = () => {
    setRows(createRows(items));
  };

  const handleSave = () => {
    const dataToSave = rows.map((r) => ({
      itemId: r.itemId,
      importQty: parseFloat(r.importQty) || 0,
      newStockQty: r.newStockQty !== '' ? (parseFloat(r.newStockQty) || 0) : r.initialStock + (parseFloat(r.importQty) || 0),
      exportQty: r.calculatedExport
    }));

    const invalidRow = rows.find((row) => {
      const imported = parseFloat(row.importQty) || 0;
      const countedStock = row.newStockQty === ''
        ? row.initialStock + imported
        : parseFloat(row.newStockQty);
      return imported < 0 || !Number.isFinite(countedStock) || countedStock < 0 || countedStock > row.initialStock + imported;
    });
    if (invalidRow) {
      alert(`Dữ liệu mã ${invalidRow.itemId} không hợp lệ. Tồn mới không thể âm hoặc lớn hơn Tồn cũ + Nhập.`);
      return;
    }

    const changedRows = dataToSave.filter((row) => row.importQty > 0 || row.exportQty > 0);
    if (changedRows.length === 0) {
      alert('Chưa có số lượng nhập hoặc xuất để lưu.');
      return;
    }

    onSaveSlip(`Tuần ${selectedWeek}`, dataToSave);
    setRows((currentRows) =>
      currentRows.map((row) => {
        const saved = dataToSave.find((candidate) => candidate.itemId === row.itemId);
        return {
          ...row,
          initialStock: saved?.newStockQty ?? row.initialStock,
          importQty: '',
          newStockQty: '',
          calculatedExport: 0
        };
      })
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleAddItemToForm = (itemId: string) => {
    if (rows.some(r => r.itemId === itemId)) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setRows(prev => [
      ...prev,
      {
        itemId: item.id,
        name: item.name,
        initialStock: item.currentStock,
        importQty: '',
        newStockQty: '',
        calculatedExport: 0
      }
    ]);
  };

  const unusedItems = items.filter(it => !rows.some(r => r.itemId === it.id));

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full space-y-3 sm:space-y-4">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="bg-[#85f8c4] border border-[#006c4a] text-[#002114] px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#006c4a] shrink-0" />
          <div className="text-xs sm:text-sm font-semibold">
            Đã lưu thành công phiếu nhập liệu Tuần {selectedWeek}! Dữ liệu kho đã được cập nhật.
          </div>
        </div>
      )}

      {/* Top Header & Stats Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div>
          <h2 className="text-[17px] sm:text-[20px] font-bold text-[#191c1d]">Phiếu Nhập Liệu Tuần</h2>
        </div>

        {/* Status Cards */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Card 1: Tuần */}
          <div className="bg-white border border-[#c1c6d6] rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 flex flex-col justify-center shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-medium text-[#515f74] uppercase tracking-wider">
              Tuần
            </span>
            <select
              id="select-entry-week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent border-none p-0 text-xs sm:text-[13px] font-bold text-[#005bbf] focus:ring-0 cursor-pointer outline-none"
            >
              {weekOptions.map((week) => (
                <option key={week} value={week}>Tuần {week}</option>
              ))}
            </select>
          </div>

          {/* Card 2: Tổng số dòng */}
          <div className="bg-white border border-[#c1c6d6] rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 flex flex-col justify-center min-w-[70px] sm:min-w-[100px] shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-medium text-[#515f74] uppercase tracking-wider">
              Tổng dòng
            </span>
            <span className="text-sm sm:text-[18px] font-bold text-[#005bbf] leading-tight">
              {rows.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#c1c6d6] rounded-lg overflow-hidden flex-1 flex flex-col shadow-xs">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[340px] sm:min-w-full">
            <thead className="bg-[#f3f4f5] text-[10px] sm:text-[12px] font-bold text-[#191c1d] tracking-tight sm:tracking-wide uppercase sticky top-0 z-10 border-b border-[#c1c6d6]">
              <tr>
                <th className="py-2 px-2 sm:py-3 sm:px-4 w-[34%] sm:w-1/3">
                  Mã Hàng
                </th>
                <th className="py-2 px-1.5 sm:py-3 sm:px-4 w-[22%] sm:w-1/4 text-center sm:text-left">
                  <span className="hidden sm:inline">Số Lượng </span>Nhập
                </th>
                <th className="py-2 px-1.5 sm:py-3 sm:px-4 w-[22%] sm:w-1/4 text-center sm:text-left">
                  <span className="hidden sm:inline">Số Lượng </span>Tồn
                </th>
                <th className="py-2 px-1.5 sm:py-3 sm:px-4 w-[22%] sm:w-1/4 text-center sm:text-left">
                  <span className="hidden sm:inline">Số Lượng </span>Xuất
                </th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-[13px] divide-y divide-[#e1e3e4] bg-white">
              {rows.map((row, index) => {
                return (
                  <tr 
                    key={row.itemId}
                    className="odd:bg-white even:bg-[#f8f9fa] hover:bg-[#f3f4f5] transition-colors group"
                  >
                    {/* Mã Hàng */}
                    <td className="py-2 px-2 sm:py-3 sm:px-4">
                      <div className="flex flex-col min-w-0">
                        <button
                          onClick={() => onNavigateToDetail(row.itemId)}
                          className="font-bold text-[#005bbf] hover:underline text-left cursor-pointer inline-flex items-center gap-1 text-[11px] sm:text-[13px] truncate"
                        >
                          <span>{row.itemId}</span>
                        </button>
                        <span className="text-[#515f74] text-[10px] sm:text-xs mt-0.5 truncate max-w-[110px] sm:max-w-none font-medium">
                          {row.name}
                        </span>
                        <span className="text-[9px] sm:text-[11px] text-[#727785] mt-0.5 whitespace-nowrap">
                          (Tồn: {row.initialStock})
                        </span>
                      </div>
                    </td>

                    {/* Số Lượng Nhập */}
                    <td className="py-2 px-1 sm:py-3 sm:px-4 align-middle">
                      <div className="relative">
                        <input
                          id={`input-nhap-${row.itemId}`}
                          type="number"
                          min="0"
                          value={row.importQty}
                          onChange={(e) => handleInputChange(index, 'importQty', e.target.value)}
                          placeholder="0"
                          className="w-full bg-white border border-[#c1c6d6] rounded py-1 px-1 sm:p-2 focus:border-[#005bbf] focus:ring-1 focus:ring-[#005bbf] outline-none transition-shadow text-[#191c1d] text-xs sm:text-sm text-center sm:text-left h-7 sm:h-9"
                        />
                      </div>
                    </td>

                    {/* Số Lượng Tồn */}
                    <td className="py-2 px-1 sm:py-3 sm:px-4 align-middle">
                      <div className="relative">
                        <input
                          id={`input-ton-${row.itemId}`}
                          type="number"
                          min="0"
                          value={row.newStockQty}
                          onChange={(e) => handleInputChange(index, 'newStockQty', e.target.value)}
                          placeholder="0"
                          className="w-full bg-white border border-[#c1c6d6] rounded py-1 px-1 sm:p-2 focus:border-[#005bbf] focus:ring-1 focus:ring-[#005bbf] outline-none transition-shadow text-[#191c1d] text-xs sm:text-sm text-center sm:text-left h-7 sm:h-9"
                        />
                      </div>
                    </td>

                    {/* Số Lượng Xuất (Calculated automatically) */}
                    <td className="py-2 px-1 sm:py-3 sm:px-4 align-middle">
                      <div className="relative">
                        <input
                          type="number"
                          readOnly
                          value={row.calculatedExport}
                          title="(Tồn cũ + Nhập - Tồn mới)"
                          className="w-full bg-[#f3f4f5] border border-[#c1c6d6] rounded py-1 px-1 sm:p-2 text-[#515f74] font-bold text-xs sm:text-sm text-center sm:text-left h-7 sm:h-9 cursor-not-allowed"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Quick add more items if any available */}
        {unusedItems.length > 0 && (
          <div className="p-2 sm:p-3 bg-[#f8f9fa] border-t border-[#c1c6d6] flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap">
            <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs text-[#515f74]">
              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#005bbf]" />
              <span>Thêm mã hàng:</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {unusedItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleAddItemToForm(item.id)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs bg-white hover:bg-[#d5e3fc] hover:text-[#004493] text-[#515f74] border border-[#c1c6d6] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{item.id}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="bg-[#f3f4f5] border-t border-[#c1c6d6] p-2.5 sm:p-4 flex justify-between items-center mt-auto">
          <button
            id="btn-cancel-entry"
            type="button"
            onClick={handleReset}
            className="px-3 sm:px-6 py-1.5 sm:py-2.5 border border-[#727785] text-[#515f74] hover:bg-[#e1e3e4] text-xs sm:text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Hủy bỏ</span>
          </button>

          <button
            id="btn-save-entry"
            type="button"
            onClick={handleSave}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs sm:text-[15px] font-bold px-4 sm:px-8 py-2 sm:py-3 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all shadow-[0_4px_12px_rgba(26,115,232,0.25)] active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Lưu Phiếu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
