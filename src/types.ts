export type ScreenType = 'entry' | 'catalog' | 'detail' | 'report' | 'history';

export type CategoryType = 'Nguyên Liệu' | 'Hóa Chất' | 'Vật Tư' | 'Sản Phẩm';

export interface TechSpecs {
  dimensions?: string;
  material?: string;
  standardWeight?: string;
  maxMoisture?: string;
  temperature?: string;
  notes?: string;
}

export interface InventoryItem {
  id: string; // e.g. NLTC.0196
  name: string;
  unit: string; // Bao, Can, Cục, Thùng, Cây, KG
  location: string; // Kho A1, Kho B1 (Hóa Chất), etc.
  category: CategoryType;
  initialStock: number;
  currentStock: number;
  totalImport: number;
  totalExport: number;
  lastUpdated: string;
  specs: TechSpecs;
  minStockThreshold?: number;
  status?: 'Đang sử dụng' | 'Ngừng sử dụng';
}

export interface WeekCatalogItem {
  code: string;
  year: number;
  startDate: string;
  endDate: string;
  label: string;
  status: 'Đã đóng' | 'Đang mở' | 'Sắp tới';
}

export interface HistoryRecord {
  id: string;
  dateTime: string;
  week: string; // W43, W44
  itemId: string;
  itemName: string;
  importQty: number;
  stockQty: number;
  exportQty: number;
  documentCode?: string; // PN-2310-045, PX-2310-012
  type?: 'Nhập' | 'Xuất';
  notes?: string;
}

export interface EntryRowState {
  itemId: string;
  name: string;
  initialStock: number;
  importQty: number | '';
  newStockQty: number | '';
  exportQty: number;
}

export interface WeekEntrySlip {
  id: string;
  week: number;
  year: number;
  date: string;
  status: 'Đang nhập' | 'Đã lưu' | 'Đã duyệt';
  rows: EntryRowState[];
}
