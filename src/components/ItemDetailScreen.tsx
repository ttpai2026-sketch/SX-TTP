import React from 'react';
import { InventoryItem } from '../types';
import { ITEM_CHANGES_HISTORY } from '../mockData';
import { 
  ArrowLeft, 
  Edit3, 
  Info, 
  MapPin, 
  FileText, 
  ArrowDown, 
  ArrowUp,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ItemDetailScreenProps {
  item: InventoryItem;
  onBack: () => void;
  onEdit: (item: InventoryItem) => void;
  onViewAllHistory?: () => void;
}

export const ItemDetailScreen: React.FC<ItemDetailScreenProps> = ({
  item,
  onBack,
  onEdit,
  onViewAllHistory
}) => {
  const transactions = ITEM_CHANGES_HISTORY[item.id] || [
    { date: '25/10/2023', type: 'Nhập' as const, qty: 50, doc: 'PN-2310-045', notes: 'Giao dịch nhập gần nhất' },
    { date: '18/10/2023', type: 'Xuất' as const, qty: -20, doc: 'PX-2310-012', notes: 'Xuất xưởng đúc mẫu' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Bar with Back & Edit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              id="btn-detail-back"
              onClick={onBack}
              className="text-[#515f74] hover:bg-[#e7e8e9] p-1.5 rounded-lg inline-flex transition-colors cursor-pointer"
              title="Quay lại danh mục"
            >
              <ArrowLeft className="w-5 h-5 text-[#191c1d]" />
            </button>
            <h1 className="text-[24px] font-bold text-[#191c1d]">Chi Tiết Mã Hàng</h1>
          </div>
          <p className="text-[13px] text-[#515f74] ml-9 flex items-center gap-2">
            <span className="font-bold text-[#005bbf]">{item.id}</span>
            <span className="w-1 h-1 rounded-full bg-[#727785]"></span>
            <span>Cập nhật lần cuối: {item.lastUpdated}</span>
          </p>
        </div>

        <div className="flex gap-3 ml-9 sm:ml-0">
          <button
            id="btn-edit-current-item"
            onClick={() => onEdit(item)}
            className="px-4 py-2 border border-[#c1c6d6] text-[#191c1d] text-[12px] font-semibold tracking-wider uppercase rounded hover:bg-[#f3f4f5] transition-colors flex items-center gap-2 cursor-pointer bg-white"
          >
            <Edit3 className="w-4 h-4" />
            <span>Chỉnh sửa</span>
          </button>
        </div>
      </div>

      {/* Stats Row (3 Key Metric Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Tổng Nhập */}
        <div className="border border-[#c1c6d6] bg-white p-4 rounded-lg flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">
            Tổng Nhập
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[28px] text-[#191c1d] font-bold leading-none">
              {item.totalImport.toLocaleString('vi-VN')}
            </span>
            <span className="text-[12px] font-semibold text-[#00885f]">
              {item.unit}
            </span>
          </div>
        </div>

        {/* Card 2: Tổng Xuất */}
        <div className="border border-[#c1c6d6] bg-white p-4 rounded-lg flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">
            Tổng Xuất
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[28px] text-[#191c1d] font-bold leading-none">
              {item.totalExport.toLocaleString('vi-VN')}
            </span>
            <span className="text-[12px] font-semibold text-[#00885f]">
              {item.unit}
            </span>
          </div>
        </div>

        {/* Card 3: Tồn Kho Hiện Tại (Prominent Blue) */}
        <div className="border border-[#005bbf] bg-[#d8e2ff] p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-bold text-[#004493] uppercase tracking-wider">
            Tồn Kho Hiện Tại
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[28px] text-[#005bbf] font-bold leading-none">
              {item.currentStock.toLocaleString('vi-VN')}
            </span>
            <span className="text-[12px] font-bold text-[#004493]">
              {item.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Main Info Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin chung (2 cols) */}
        <div className="lg:col-span-2 border border-[#c1c6d6] bg-white rounded-lg overflow-hidden shadow-xs">
          <div className="bg-[#f3f4f5] border-b border-[#c1c6d6] px-5 py-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#515f74]" />
            <h2 className="text-[12px] font-bold text-[#191c1d] uppercase tracking-wider">
              Thông Tin Chung
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div>
              <label className="text-[11px] text-[#515f74] block mb-1 font-medium">
                Tên Hàng
              </label>
              <div className="text-[15px] font-bold text-[#191c1d]">
                {item.name}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#515f74] block mb-1 font-medium">
                Mã Hàng
              </label>
              <div className="inline-flex items-center px-2.5 py-1 bg-[#edeeef] rounded border border-[#c1c6d6] text-[13px] font-mono font-bold text-[#005bbf]">
                {item.id}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#515f74] block mb-1 font-medium">
                Loại Vật Tư
              </label>
              <span className="inline-block px-2.5 py-1 bg-[#d5e3fc] text-[#57657a] text-[11px] font-bold rounded uppercase tracking-wide">
                {item.category}
              </span>
            </div>

            <div>
              <label className="text-[11px] text-[#515f74] block mb-1 font-medium">
                Đơn Vị Tính
              </label>
              <div className="text-[14px] text-[#191c1d] font-medium">
                {item.unit}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] text-[#515f74] block mb-1 font-medium">
                Vị Trí Lưu Kho
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-[#f3f4f5] border border-[#c1c6d6] rounded-md">
                <MapPin className="w-4 h-4 text-[#515f74] shrink-0" />
                <span className="text-[13px] font-semibold text-[#191c1d]">
                  {item.location}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông số kỹ thuật (1 col) */}
        <div className="border border-[#c1c6d6] bg-white rounded-lg overflow-hidden shadow-xs">
          <div className="bg-[#f3f4f5] border-b border-[#c1c6d6] px-5 py-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#515f74]" />
            <h2 className="text-[12px] font-bold text-[#191c1d] uppercase tracking-wider">
              Thông Số Kỹ Thuật
            </h2>
          </div>

          <div className="p-5 flex flex-col gap-3.5 text-[13px]">
            <div className="flex justify-between items-center border-b border-[#e1e3e4] pb-2.5">
              <span className="text-[#515f74]">Kích thước</span>
              <span className="font-semibold text-[#191c1d]">
                {item.specs.dimensions || '60 x 40 x 15 cm'}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-[#e1e3e4] pb-2.5">
              <span className="text-[#515f74]">Chất liệu</span>
              <span className="font-semibold text-[#191c1d]">
                {item.specs.material || 'Thạch cao tinh chế 98%'}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-[#e1e3e4] pb-2.5">
              <span className="text-[#515f74]">Trọng lượng chuẩn</span>
              <span className="font-semibold text-[#191c1d]">
                {item.specs.standardWeight || '25 kg / bao'}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-[#e1e3e4] pb-2.5">
              <span className="text-[#515f74]">Độ ẩm tối đa</span>
              <span className="font-semibold text-[#191c1d]">
                {item.specs.maxMoisture || '< 2%'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#515f74]">Nhiệt độ bảo quản</span>
              <span className="font-semibold text-[#191c1d] text-right">
                {item.specs.temperature || 'Nhiệt độ phòng'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="border border-[#c1c6d6] bg-white rounded-lg overflow-hidden flex flex-col shadow-xs">
        <div className="bg-[#f3f4f5] border-b border-[#c1c6d6] px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#515f74]" />
            <h2 className="text-[12px] font-bold text-[#191c1d] uppercase tracking-wider">
              Lịch Sử Biến Động
            </h2>
          </div>
          {onViewAllHistory && (
            <button
              onClick={onViewAllHistory}
              className="text-[#005bbf] text-[11px] font-bold tracking-wider uppercase hover:underline cursor-pointer"
            >
              Xem toàn bộ
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-white border-b border-[#c1c6d6] text-[12px] font-bold text-[#515f74]">
                <th className="py-2.5 px-4 sticky left-0 bg-white z-10 w-36">Ngày Giao Dịch</th>
                <th className="py-2.5 px-4 w-28">Loại</th>
                <th className="py-2.5 px-4 text-right w-28">Số Lượng</th>
                <th className="py-2.5 px-4 w-36">Chứng Từ</th>
                <th className="py-2.5 px-4">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[#191c1d]">
              {transactions.map((tx, idx) => {
                const isNhap = tx.type === 'Nhập';
                return (
                  <tr
                    key={idx}
                    className={`border-b border-[#e1e3e4] hover:bg-[#f3f4f5] transition-colors ${
                      idx % 2 === 1 ? 'bg-[#f8f9fa]' : 'bg-white'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-medium text-[#515f74] sticky left-0 bg-inherit">
                      {tx.date}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isNhap ? 'text-[#00885f]' : 'text-[#ba1a1a]'
                        }`}
                      >
                        {isNhap ? (
                          <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5" />
                        )}
                        <span>{tx.type}</span>
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-bold ${
                        isNhap ? 'text-[#00885f]' : 'text-[#ba1a1a]'
                      }`}
                    >
                      {tx.qty > 0 ? `+${tx.qty}` : tx.qty}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[#005bbf] font-medium hover:underline cursor-pointer">
                        {tx.doc}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#515f74] truncate max-w-[280px]">
                      {tx.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
