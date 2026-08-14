import React from 'react';
import { X, HelpCircle, BookOpen, Calculator, Layers, FileSpreadsheet } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white border border-[#c1c6d6] rounded-xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#f3f4f5] border-b border-[#c1c6d6] px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#005bbf]" />
            <h2 className="text-[18px] font-bold text-[#191c1d]">
              Hướng Dẫn Sử Dụng - Quản Lý Nhà Khuôn
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#515f74] hover:bg-[#e1e3e4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm text-[#191c1d]">
          <div className="p-4 bg-[#d5e3fc]/50 border border-[#adc7ff] rounded-lg">
            <h3 className="font-bold text-[#004493] flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4" />
              Tổng Quan Vận Hành
            </h3>
            <p className="text-xs text-[#3a485b] leading-relaxed">
              Hệ thống được thiết kế chuyên biệt cho xưởng đúc và nhà khuôn sản xuất để theo dõi sát sao tồn kho nguyên vật liệu (Thạch cao, Dầu lửa, Silicon, Nhôm, Thép...) theo từng tuần sản xuất.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f3f4f5] text-[#005bbf] flex items-center justify-center shrink-0 font-bold border border-[#c1c6d6]">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#191c1d]">1. Cơ Chế Nhập Liệu &amp; Tự Động Tính Xuất</h4>
                <p className="text-xs text-[#515f74] mt-0.5">
                  Tại màn hình <strong>Nhập Liệu</strong>, bạn nhập số lượng thực tế nhập thêm và số lượng tồn kho kiểm kê mới. Hệ thống sẽ tự động tính lượng xuất kho theo công thức chuẩn:
                  <code className="block my-1.5 p-2 bg-[#f3f4f5] rounded text-[12px] font-mono text-[#004493] border border-[#c1c6d6]">
                    Số Lượng Xuất = Tồn Ban Đầu + Số Lượng Nhập - Số Lượng Tồn Mới
                  </code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f3f4f5] text-[#005bbf] flex items-center justify-center shrink-0 font-bold border border-[#c1c6d6]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#191c1d]">2. Quản Lý Danh Mục &amp; Chi Tiết Mã Hàng</h4>
                <p className="text-xs text-[#515f74] mt-0.5">
                  Bấm vào bất kỳ mã hàng nào (VD: <strong>NLTC.0196</strong>) để xem toàn bộ thông số kỹ thuật, vị trí lưu kho kệ, và biểu đồ giao dịch nhập xuất chi tiết theo thời gian.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f3f4f5] text-[#005bbf] flex items-center justify-center shrink-0 font-bold border border-[#c1c6d6]">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#191c1d]">3. Báo Cáo Nhập Xuất Tồn &amp; Xuất File Excel</h4>
                <p className="text-xs text-[#515f74] mt-0.5">
                  Xem bảng cân đối tồn đầu kỳ, lũy kế nhập xuất và tồn cuối kỳ của tất cả vật tư, có thể tải về file Excel/CSV chuẩn chỉ bằng 1 cú click.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f3f4f5] p-4 border-t border-[#c1c6d6] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#005bbf] hover:bg-[#004493] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
