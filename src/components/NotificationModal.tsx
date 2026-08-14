import React from 'react';
import { X, Bell, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { InventoryItem } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSelectItem: (itemId: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem
}) => {
  if (!isOpen) return null;

  const lowStockItems = items.filter(
    (it) => it.currentStock <= (it.minStockThreshold || 50)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white border border-[#c1c6d6] rounded-xl w-full max-w-md overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#f3f4f5] border-b border-[#c1c6d6] px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#005bbf]" />
            <h2 className="text-[16px] font-bold text-[#191c1d]">
              Thông Báo Nhà Khuôn ({lowStockItems.length + 1})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#515f74] hover:bg-[#e1e3e4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Low Stock Alerts */}
          {lowStockItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectItem(item.id);
                onClose();
              }}
              className="p-3 bg-[#ffdad6]/40 border border-[#ffb4ab] rounded-lg flex items-start gap-3 cursor-pointer hover:bg-[#ffdad6]/70 transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#93000a]">{item.id} - Cảnh Báo Hết Hàng</span>
                  <span className="text-[10px] text-[#515f74]">Vừa xong</span>
                </div>
                <p className="text-[#414754] mt-0.5">
                  <strong>{item.name}</strong> hiện chỉ còn <strong>{item.currentStock} {item.unit}</strong> (ngưỡng an toàn: {item.minStockThreshold} {item.unit}).
                </p>
              </div>
            </div>
          ))}

          {/* System Notification */}
          <div className="p-3 bg-[#d5e3fc]/30 border border-[#adc7ff] rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#006c4a] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#004493]">Đồng bộ dữ liệu Ca 1 thành công</span>
                <span className="text-[10px] text-[#515f74]">10 phút trước</span>
              </div>
              <p className="text-[#3a485b] mt-0.5">
                Các phiếu nhập xuất Tuần 44 đã được sao lưu vào hệ thống máy chủ xưởng.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f3f4f5] p-3 border-t border-[#c1c6d6] flex justify-end">
          <button
            onClick={onClose}
            className="text-xs text-[#005bbf] font-bold hover:underline px-2 py-1"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
