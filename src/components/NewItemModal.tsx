import React, { useState, useEffect } from 'react';
import { InventoryItem, CategoryType } from '../types';
import { X, Save, Box } from 'lucide-react';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  itemToEdit?: InventoryItem | null;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit
}) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    id: '',
    name: '',
    unit: 'Bao',
    location: 'Kho A1',
    category: 'Nguyên Liệu',
    initialStock: 0,
    currentStock: 0,
    minStockThreshold: 50,
    specs: {
      dimensions: '',
      material: '',
      standardWeight: '',
      maxMoisture: '',
      temperature: '',
      notes: ''
    }
  });

  useEffect(() => {
    if (itemToEdit) {
      setFormData(itemToEdit);
    } else {
      setFormData({
        id: 'NLTC.' + Math.floor(1000 + Math.random() * 9000),
        name: '',
        unit: 'Bao',
        location: 'Kho A1',
        category: 'Nguyên Liệu',
        initialStock: 100,
        currentStock: 100,
        totalImport: 0,
        totalExport: 0,
        lastUpdated: 'Vừa tạo',
        minStockThreshold: 50,
        specs: {
          dimensions: '60 x 40 x 15 cm',
          material: '',
          standardWeight: '25 kg / bao',
          maxMoisture: '< 2%',
          temperature: 'Nhiệt độ phòng',
          notes: ''
        }
      });
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) {
      alert('Vui lòng điền mã hàng và tên hàng.');
      return;
    }

    const finalItem: InventoryItem = {
      id: formData.id.toUpperCase(),
      name: formData.name,
      unit: formData.unit || 'Bao',
      location: formData.location || 'Kho A1',
      category: (formData.category as CategoryType) || 'Nguyên Liệu',
      initialStock: Number(formData.initialStock) || 0,
      currentStock: Number(formData.currentStock) || 0,
      totalImport: itemToEdit?.totalImport || 0,
      totalExport: itemToEdit?.totalExport || 0,
      lastUpdated: 'Hôm nay, ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      minStockThreshold: Number(formData.minStockThreshold) || 50,
      specs: {
        dimensions: formData.specs?.dimensions || 'Tiêu chuẩn',
        material: formData.specs?.material || 'Chính phẩm',
        standardWeight: formData.specs?.standardWeight || 'Theo quy cách',
        maxMoisture: formData.specs?.maxMoisture || '< 2%',
        temperature: formData.specs?.temperature || 'Bình thường',
        notes: formData.specs?.notes || ''
      }
    };

    onSave(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white border border-[#c1c6d6] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#f3f4f5] border-b border-[#c1c6d6] px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-[#005bbf]" />
            <h2 className="text-[18px] font-bold text-[#191c1d]">
              {itemToEdit ? 'Chỉnh Sửa Mã Hàng' : 'Thêm Mã Hàng Mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#515f74] hover:bg-[#e1e3e4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mã Hàng */}
            <div>
              <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider block mb-1">
                Mã Hàng *
              </label>
              <input
                type="text"
                required
                value={formData.id || ''}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="VD: NLTC.0196"
                className="w-full bg-[#f3f4f5] border border-[#c1c6d6] rounded p-2.5 text-sm font-mono font-bold text-[#005bbf] focus:border-[#005bbf] outline-none"
              />
            </div>

            {/* Tên Hàng */}
            <div>
              <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider block mb-1">
                Tên Hàng *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Thạch Cao Nam Hồng"
                className="w-full bg-white border border-[#c1c6d6] rounded p-2.5 text-sm text-[#191c1d] focus:border-[#005bbf] outline-none font-medium"
              />
            </div>

            {/* Loại Vật Tư */}
            <div>
              <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider block mb-1">
                Loại Vật Tư
              </label>
              <select
                value={formData.category || 'Nguyên Liệu'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryType })}
                className="w-full bg-white border border-[#c1c6d6] rounded p-2.5 text-sm text-[#191c1d] focus:border-[#005bbf] outline-none cursor-pointer"
              >
                <option value="Nguyên Liệu">Nguyên Liệu</option>
                <option value="Hóa Chất">Hóa Chất</option>
                <option value="Vật Tư">Vật Tư</option>
                <option value="Sản Phẩm">Sản Phẩm</option>
              </select>
            </div>

            {/* Đơn Vị Tính */}
            <div>
              <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider block mb-1">
                Đơn Vị Tính
              </label>
              <input
                type="text"
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Bao, Can, Cục, Thùng, Cây..."
                className="w-full bg-white border border-[#c1c6d6] rounded p-2.5 text-sm text-[#191c1d] focus:border-[#005bbf] outline-none"
              />
            </div>

            {/* Vị Trí Lưu Kho */}
            <div>
              <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider block mb-1">
                Vị Trí Lưu Kho
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="VD: Khu A - Dãy 3 - Kệ 2"
                className="w-full bg-white border border-[#c1c6d6] rounded p-2.5 text-sm text-[#191c1d] focus:border-[#005bbf] outline-none"
              />
            </div>

            {/* Tồn Kho Hiện Tại */}
            <div>
              <label className="text-[12px] font-bold text-[#515f74] uppercase tracking-wider block mb-1">
                Tồn Kho Hiện Tại
              </label>
              <input
                type="number"
                min="0"
                value={formData.currentStock || 0}
                onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value), initialStock: Number(e.target.value) })}
                className="w-full bg-white border border-[#c1c6d6] rounded p-2.5 text-sm font-bold text-[#191c1d] focus:border-[#005bbf] outline-none"
              />
            </div>
          </div>

          {/* Technical Specs Accordion/Section */}
          <div className="border-t border-[#c1c6d6] pt-4">
            <h3 className="text-[13px] font-bold text-[#005bbf] uppercase tracking-wider mb-3">
              Thông Số Kỹ Thuật (Tùy chọn)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[#515f74] block mb-1">Kích thước</label>
                <input
                  type="text"
                  value={formData.specs?.dimensions || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    specs: { ...formData.specs, dimensions: e.target.value }
                  })}
                  placeholder="VD: 60 x 40 x 15 cm"
                  className="w-full bg-[#f3f4f5] border border-[#c1c6d6] rounded p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-[#515f74] block mb-1">Chất liệu / Thành phần</label>
                <input
                  type="text"
                  value={formData.specs?.material || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    specs: { ...formData.specs, material: e.target.value }
                  })}
                  placeholder="VD: Thạch cao tinh chế 98%"
                  className="w-full bg-[#f3f4f5] border border-[#c1c6d6] rounded p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-[#515f74] block mb-1">Trọng lượng chuẩn</label>
                <input
                  type="text"
                  value={formData.specs?.standardWeight || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    specs: { ...formData.specs, standardWeight: e.target.value }
                  })}
                  placeholder="VD: 25 kg / bao"
                  className="w-full bg-[#f3f4f5] border border-[#c1c6d6] rounded p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-[#515f74] block mb-1">Độ ẩm tối đa</label>
                <input
                  type="text"
                  value={formData.specs?.maxMoisture || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    specs: { ...formData.specs, maxMoisture: e.target.value }
                  })}
                  placeholder="VD: < 2%"
                  className="w-full bg-[#f3f4f5] border border-[#c1c6d6] rounded p-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="bg-[#f3f4f5] -mx-6 -mb-6 p-4 border-t border-[#c1c6d6] flex justify-end gap-3 rounded-b-xl">
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
              <Save className="w-4 h-4" />
              <span>Lưu Mã Hàng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
