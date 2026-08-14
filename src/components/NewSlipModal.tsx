import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { X, Plus, FilePlus2, ArrowDown, ArrowUp } from 'lucide-react';

interface NewSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onCreated: (slipData: {
    type: 'Nhập' | 'Xuất';
    docCode: string;
    itemId: string;
    quantity: number;
    notes: string;
  }) => void;
}

export const NewSlipModal: React.FC<NewSlipModalProps> = ({
  isOpen,
  onClose,
  items,
  onCreated
}) => {
  const [type, setType] = useState<'Nhập' | 'Xuất'>('Nhập');
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || 'NLTC.0196');
  const [quantity, setQuantity] = useState<string>('50');
  const [notes, setNotes] = useState<string>('Nhập bổ sung kho sản xuất');
  const [docCode, setDocCode] = useState<string>(() => {
    return (type === 'Nhập' ? 'PN-' : 'PX-') + new Date().toISOString().slice(2, 7).replace('-', '') + '-' + Math.floor(100 + Math.random() * 900);
  });

  if (!isOpen) return null;

  const handleTypeChange = (newType: 'Nhập' | 'Xuất') => {
    setType(newType);
    setDocCode((newType === 'Nhập' ? 'PN-' : 'PX-') + new Date().toISOString().slice(2, 7).replace('-', '') + '-' + Math.floor(100 + Math.random() * 900));
    setNotes(newType === 'Nhập' ? 'Nhập từ nhà cung cấp' : 'Xuất cho xưởng sản xuất');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      alert('Vui lòng nhập số lượng lớn hơn 0');
      return;
    }

    onCreated({
      type,
      docCode,
      itemId: selectedItemId,
      quantity: qty,
      notes
    });

    onClose();
  };

  const selectedItem = items.find(i => i.id === selectedItemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white border border-[#c1c6d6] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#f3f4f5] border-b border-[#c1c6d6] px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-[#005bbf]" />
            <h2 className="text-[18px] font-bold text-[#191c1d]">
              Tạo Phiếu Kho Mới
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#515f74] hover:bg-[#e1e3e4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Slip Type Selection */}
          <div>
            <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider block mb-2">
              Loại Phiếu Giao Dịch
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('Nhập')}
                className={`py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  type === 'Nhập'
                    ? 'bg-[#00885f] text-white border-[#006c4a] shadow-xs'
                    : 'bg-[#f8f9fa] text-[#515f74] border-[#c1c6d6] hover:bg-[#e1e3e4]'
                }`}
              >
                <ArrowDown className="w-4 h-4" />
                <span>Phiếu Nhập (PN)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('Xuất')}
                className={`py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  type === 'Xuất'
                    ? 'bg-[#ba1a1a] text-white border-[#93000a] shadow-xs'
                    : 'bg-[#f8f9fa] text-[#515f74] border-[#c1c6d6] hover:bg-[#e1e3e4]'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
                <span>Phiếu Xuất (PX)</span>
              </button>
            </div>
          </div>

          {/* Document Code */}
          <div>
            <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider block mb-1">
              Số Chứng Từ
            </label>
            <input
              type="text"
              required
              value={docCode}
              onChange={(e) => setDocCode(e.target.value)}
              className="w-full bg-[#f3f4f5] border border-[#c1c6d6] rounded p-2.5 text-sm font-mono font-bold text-[#005bbf] outline-none"
            />
          </div>

          {/* Material Selection */}
          <div>
            <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider block mb-1">
              Mã Hàng / Vật Tư
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-white border border-[#c1c6d6] rounded p-2.5 text-sm text-[#191c1d] focus:border-[#005bbf] outline-none cursor-pointer"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.id} - {it.name} (Tồn: {it.currentStock} {it.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider">
                Số Lượng
              </label>
              {selectedItem && (
                <span className="text-xs text-[#515f74]">
                  Đơn vị: <strong className="text-[#191c1d]">{selectedItem.unit}</strong>
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-white border border-[#c1c6d6] rounded p-2.5 text-base font-bold text-[#191c1d] focus:border-[#005bbf] outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider block mb-1">
              Ghi Chú / Lý Do Giao Dịch
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Nhập lô hàng tháng 11, Xuất xưởng đúc khuôn A2..."
              className="w-full bg-white border border-[#c1c6d6] rounded p-2.5 text-sm text-[#191c1d] focus:border-[#005bbf] outline-none"
            />
          </div>

          {/* Actions */}
          <div className="bg-[#f3f4f5] -mx-6 -mb-6 p-4 border-t border-[#c1c6d6] flex justify-end gap-3 rounded-b-xl mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#727785] text-[#515f74] rounded-lg text-sm font-semibold hover:bg-[#e1e3e4] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-[#005bbf] hover:bg-[#004493] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Xác Nhận Tạo Phiếu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
