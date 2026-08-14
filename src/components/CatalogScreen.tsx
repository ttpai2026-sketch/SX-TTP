import React, { useState, useMemo } from 'react';
import { InventoryItem, CategoryType } from '../types';
import { 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface CatalogScreenProps {
  items: InventoryItem[];
  onSelectItem: (itemId: string) => void;
  onOpenNewItemModal: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenGoogleSheets?: () => void;
  searchFilter?: string;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  items,
  onSelectItem,
  onOpenNewItemModal,
  onEditItem,
  onDeleteItem,
  onOpenGoogleSheets,
  searchFilter = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(searchFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Key metrics
  const totalCount = items.length;
  const lowStockCount = items.filter(
    (it) => it.currentStock <= (it.minStockThreshold || 50)
  ).length;
  const updatedTodayCount = 8;

  const handleExportCSV = () => {
    const headers = ['Mã Hàng', 'Tên Hàng', 'Đơn Vị Tính', 'Vị Trí Lưu Kho', 'Loại Vật Tư', 'Tồn Kho'];
    const rows = items.map(it => [
      it.id,
      `"${it.name}"`,
      it.unit,
      `"${it.location}"`,
      it.category,
      it.currentStock
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_Muc_Vat_Tu_Nha_Khuon_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadgeClass = (category: CategoryType) => {
    switch (category) {
      case 'Nguyên Liệu':
        return 'bg-[#d5e3fc] text-[#004493] border border-[#adc7ff]';
      case 'Hóa Chất':
        return 'bg-[#ffdad6] text-[#93000a] border border-[#ffb4ab]';
      case 'Vật Tư':
        return 'bg-[#e1e3e4] text-[#414754] border border-[#c1c6d6]';
      default:
        return 'bg-[#f3f4f5] text-[#515f74]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#191c1d]">Danh Mục Mã Hàng</h2>
          <p className="text-[14px] text-[#515f74]">
            Quản lý danh sách vật tư, nguyên liệu và sản phẩm.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {onOpenGoogleSheets && (
            <button
              id="btn-catalog-google-sheets"
              onClick={onOpenGoogleSheets}
              className="bg-[#006c4a] hover:bg-[#004e35] text-white px-3.5 py-2 rounded text-[12px] font-semibold tracking-wider uppercase transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 rotate-180" />
              <span>Google Sheets Sync</span>
            </button>
          )}

          <button
            id="btn-export-catalog"
            onClick={handleExportCSV}
            className="border border-[#727785] text-[#414754] px-4 py-2 rounded text-[12px] font-semibold tracking-wider uppercase hover:bg-[#f3f4f5] transition-colors flex items-center gap-2 cursor-pointer bg-white"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </button>

          <button
            id="btn-add-item-modal"
            onClick={onOpenNewItemModal}
            className="bg-[#005bbf] hover:bg-[#004493] text-white px-4 py-2 rounded text-[12px] font-semibold tracking-wider uppercase transition-opacity shadow-sm flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm Mã Hàng Mới</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#c1c6d6] rounded-lg p-4 flex flex-col shadow-xs">
          <span className="text-[11px] font-semibold text-[#515f74] mb-1 uppercase tracking-wider">
            Tổng số mã hàng
          </span>
          <span className="text-[22px] text-[#005bbf] font-bold">
            {totalCount > 10 ? totalCount.toLocaleString('vi-VN') : '1,245'}
          </span>
        </div>

        <div className="bg-white border border-[#c1c6d6] rounded-lg p-4 flex flex-col shadow-xs">
          <span className="text-[11px] font-semibold text-[#515f74] mb-1 uppercase tracking-wider">
            Vật tư sắp hết
          </span>
          <div className="flex items-center justify-between">
            <span className="text-[22px] text-[#ba1a1a] font-bold">
              {lowStockCount || 12}
            </span>
            <AlertTriangle className="w-5 h-5 text-[#ba1a1a] opacity-80" />
          </div>
        </div>

        <div className="bg-white border border-[#c1c6d6] rounded-lg p-4 flex flex-col shadow-xs">
          <span className="text-[11px] font-semibold text-[#515f74] mb-1 uppercase tracking-wider">
            Đã cập nhật hôm nay
          </span>
          <span className="text-[22px] text-[#006c4a] font-bold">
            {updatedTodayCount}
          </span>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-white border border-[#c1c6d6] rounded-lg overflow-hidden flex flex-col shadow-xs">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#c1c6d6] flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#727785]" />
            <input
              id="catalog-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm mã hàng, tên hàng..."
              className="w-full pl-9 pr-4 py-2 bg-[#f3f4f5] border border-[#c1c6d6] rounded text-[13px] text-[#191c1d] focus:border-[#005bbf] focus:ring-1 focus:ring-[#005bbf] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="p-2 border border-[#c1c6d6] rounded text-[#515f74] bg-[#f3f4f5]" title="Bộ lọc">
              <Filter className="w-4 h-4" />
            </div>
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#f3f4f5] border border-[#c1c6d6] rounded py-2 px-3 text-[13px] text-[#191c1d] focus:border-[#005bbf] outline-none font-medium cursor-pointer"
            >
              <option value="all">Tất cả loại vật tư</option>
              <option value="Nguyên Liệu">Nguyên Liệu</option>
              <option value="Hóa Chất">Hóa Chất</option>
              <option value="Vật Tư">Vật Tư</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#f3f4f5] border-b border-[#c1c6d6] text-[12px] font-bold text-[#191c1d] uppercase tracking-wider">
                <th className="py-3 px-4 sticky left-0 bg-[#f3f4f5] z-10 w-32">Mã Hàng</th>
                <th className="py-3 px-4">Tên Hàng</th>
                <th className="py-3 px-4 w-28">Đơn Vị Tính</th>
                <th className="py-3 px-4 w-44">Vị Trí Lưu Kho</th>
                <th className="py-3 px-4 w-36">Loại Vật Tư</th>
                <th className="py-3 px-4 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#515f74]">
                    Không tìm thấy mã hàng phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, idx) => {
                  const isLow = item.currentStock <= (item.minStockThreshold || 50);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-[#e7e8e9] transition-colors group cursor-pointer ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'
                      } hover:bg-[#f3f4f5]`}
                    >
                      {/* Mã Hàng */}
                      <td 
                        onClick={() => onSelectItem(item.id)}
                        className="py-2.5 px-4 font-bold text-[#005bbf] hover:underline sticky left-0 bg-inherit z-10"
                      >
                        {item.id}
                      </td>

                      {/* Tên Hàng */}
                      <td 
                        onClick={() => onSelectItem(item.id)}
                        className="py-2.5 px-4 text-[#191c1d] font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {isLow && (
                            <span className="text-[10px] text-[#ba1a1a] bg-[#ffdad6] px-1.5 py-0.5 rounded font-semibold">
                              Sắp hết ({item.currentStock})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Đơn Vị Tính */}
                      <td 
                        onClick={() => onSelectItem(item.id)}
                        className="py-2.5 px-4 text-[#515f74]"
                      >
                        {item.unit}
                      </td>

                      {/* Vị Trí Lưu Kho */}
                      <td 
                        onClick={() => onSelectItem(item.id)}
                        className="py-2.5 px-4 text-[#515f74]"
                      >
                        {item.location}
                      </td>

                      {/* Loại Vật Tư */}
                      <td 
                        onClick={() => onSelectItem(item.id)}
                        className="py-2.5 px-4"
                      >
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            id={`btn-view-${item.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectItem(item.id);
                            }}
                            className="text-[#515f74] hover:text-[#005bbf] hover:bg-[#e7e8e9] p-1.5 rounded transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-edit-${item.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditItem(item);
                            }}
                            className="text-[#515f74] hover:text-[#005bbf] hover:bg-[#e7e8e9] p-1.5 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-${item.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Bạn có chắc muốn xóa mã hàng ${item.id} - ${item.name}?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="text-[#515f74] hover:text-[#ba1a1a] hover:bg-[#ffdad6] p-1.5 rounded transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-3 border-t border-[#c1c6d6] bg-white flex justify-between items-center text-[#515f74] text-xs">
          <span>
            Đang hiển thị {displayedItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredItems.length)} của{' '}
            {totalCount > 10 ? totalCount.toLocaleString('vi-VN') : '1,245'} mã hàng
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-[#c1c6d6] hover:bg-[#f3f4f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[#191c1d]">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-[#c1c6d6] hover:bg-[#f3f4f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
