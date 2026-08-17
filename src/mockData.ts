import { InventoryItem, HistoryRecord } from './types';

export const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'NLTC.0196',
    name: 'Thạch Cao Nam Hồng',
    unit: 'Bao',
    location: 'Khu A - Dãy 3 - Kệ 2',
    category: 'Nguyên Liệu',
    initialStock: 150,
    currentStock: 410,
    totalImport: 1250,
    totalExport: 840,
    lastUpdated: 'Hôm nay, 08:45 AM',
    minStockThreshold: 100,
    specs: {
      dimensions: '60 x 40 x 15 cm',
      material: 'Thạch cao tinh chế 98%',
      standardWeight: '25 kg / bao',
      maxMoisture: '< 2%',
      temperature: 'Nhiệt độ phòng (20-30°C)',
      notes: 'Bảo quản nơi khô ráo, tránh ẩm ướt trực tiếp'
    }
  },
  {
    id: 'NLTC.0198',
    name: 'Thạch Cao khuôn cái',
    unit: 'Bao',
    location: 'Kho A1',
    category: 'Nguyên Liệu',
    initialStock: 80,
    currentStock: 30,
    totalImport: 100,
    totalExport: 150,
    lastUpdated: 'Hôm qua, 16:20 PM',
    minStockThreshold: 50,
    specs: {
      dimensions: '55 x 35 x 12 cm',
      material: 'Thạch cao đúc khuôn cứng',
      standardWeight: '20 kg / bao',
      maxMoisture: '< 1.5%',
      temperature: 'Khô ráo thoáng mát',
      notes: 'Dùng riêng cho xưởng đúc khuôn cái chính xác cao'
    }
  },
  {
    id: 'NLTC.0195',
    name: 'Thạch cao Thái Lan',
    unit: 'Bao',
    location: 'Kho A2',
    category: 'Nguyên Liệu',
    initialStock: 300,
    currentStock: 250,
    totalImport: 0,
    totalExport: 50,
    lastUpdated: '24/10/2023, 10:15 AM',
    minStockThreshold: 80,
    specs: {
      dimensions: '60 x 40 x 15 cm',
      material: 'Gypsum Alpha cao cấp',
      standardWeight: '25 kg / bao',
      maxMoisture: '< 1%',
      temperature: 'Nhiệt độ phòng',
      notes: 'Nhập khẩu nguyên bao'
    }
  },
  {
    id: 'NHDM.0005',
    name: 'Dầu lửa',
    unit: 'Can',
    location: 'Kho B1 (Hóa Chất)',
    category: 'Hóa Chất',
    initialStock: 45,
    currentStock: 60,
    totalImport: 20,
    totalExport: 5,
    lastUpdated: '26/10/2023, 09:20 AM',
    minStockThreshold: 15,
    specs: {
      dimensions: 'Can 20 Lít',
      material: 'Dầu khoáng tinh chế Kerosene',
      standardWeight: '16.5 kg / can',
      maxMoisture: '0%',
      temperature: '< 40°C, tránh lửa',
      notes: 'Hóa chất dễ cháy, có biển cảnh báo an toàn'
    }
  },
  {
    id: 'VTVT.0189',
    name: 'Xà bông cục',
    unit: 'Cục',
    location: 'Kho C3',
    category: 'Vật Tư',
    initialStock: 1000,
    currentStock: 1300,
    totalImport: 500,
    totalExport: 200,
    lastUpdated: '25/10/2023, 14:10 PM',
    minStockThreshold: 200,
    specs: {
      dimensions: '8 x 5 x 3 cm',
      material: 'Xà bông công nghiệp bôi trơn tách khuôn',
      standardWeight: '150g / cục',
      maxMoisture: '< 10%',
      temperature: 'Bình thường',
      notes: 'Dùng làm chất quét chống dính bề mặt khuôn thạch cao'
    }
  },
  {
    id: 'HCHC.0091',
    name: 'Silicon 9230+ xúc tác (Vĩnh Hưng)',
    unit: 'Thùng',
    location: 'Kho B2 (Hóa Chất)',
    category: 'Hóa Chất',
    initialStock: 20,
    currentStock: 15,
    totalImport: 10,
    totalExport: 15,
    lastUpdated: '25/10/2023, 15:45 PM',
    minStockThreshold: 10,
    specs: {
      dimensions: 'Thùng 25kg + Chai xúc tác 500ml',
      material: 'RTV-2 Silicone cao cấp',
      standardWeight: '25.5 kg / bộ',
      maxMoisture: '0%',
      temperature: '15 - 28°C',
      notes: 'Tỷ lệ pha xúc tác 2-3%, khuấy đều trước khi rót khuôn'
    }
  },
  {
    id: 'NLCD.0042',
    name: 'Thép SKD11 phi 20',
    unit: 'Cây',
    location: 'Kho Kim Khí K1',
    category: 'Nguyên Liệu',
    initialStock: 65,
    currentStock: 95,
    totalImport: 40,
    totalExport: 10,
    lastUpdated: '26/10/2023, 11:00 AM',
    minStockThreshold: 20,
    specs: {
      dimensions: 'Phi 20mm x 6000mm',
      material: 'Thép làm khuôn dập nguội JIS SKD11',
      standardWeight: '14.8 kg / cây',
      maxMoisture: 'Khô ráo chống rỉ',
      temperature: 'Nhiệt độ phòng',
      notes: 'Độ cứng sau nhiệt luyện 58-60 HRC'
    }
  },
  {
    id: 'NLCD.0088',
    name: 'Nhôm A6061 tấm 10mm',
    unit: 'Tấm',
    location: 'Kho Kim Khí K2',
    category: 'Nguyên Liệu',
    initialStock: 40,
    currentStock: 28,
    totalImport: 15,
    totalExport: 27,
    lastUpdated: '27/10/2023, 14:00 PM',
    minStockThreshold: 15,
    specs: {
      dimensions: '1200 x 2400 x 10 mm',
      material: 'Hợp kim nhôm Magie-Silic A6061-T6',
      standardWeight: '77.8 kg / tấm',
      maxMoisture: 'Khô ráo',
      temperature: 'Nhiệt độ phòng',
      notes: 'Gia công phay CNC phôi đế khuôn'
    }
  }
];

export const INITIAL_HISTORY: HistoryRecord[] = [
  {
    id: 'HIST-001',
    dateTime: '2023-10-27 14:30',
    week: 'W43',
    itemId: 'NLTC.0196',
    itemName: 'Thạch Cao Nam Hồng',
    importQty: 50,
    stockQty: 150,
    exportQty: 0,
    documentCode: 'PN-2310-045',
    type: 'Nhập',
    notes: 'Nhập từ nhà cung cấp Nam Hồng lô hàng tháng 10'
  },
  {
    id: 'HIST-002',
    dateTime: '2023-10-27 11:15',
    week: 'W43',
    itemId: 'NLTC.0198',
    itemName: 'Thạch Cao khuôn cái',
    importQty: 120,
    stockQty: 320,
    exportQty: 20,
    documentCode: 'PX-2310-012',
    type: 'Xuất',
    notes: 'Xuất xưởng đúc khuôn A2'
  },
  {
    id: 'HIST-003',
    dateTime: '2023-10-26 16:45',
    week: 'W43',
    itemId: 'NLTC.0195',
    itemName: 'Thạch cao Thái Lan',
    importQty: 200,
    stockQty: 550,
    exportQty: 50,
    documentCode: 'PX-2310-008',
    type: 'Xuất',
    notes: 'Xuất cho xưởng B'
  },
  {
    id: 'HIST-004',
    dateTime: '2023-10-26 09:20',
    week: 'W43',
    itemId: 'NHDM.0005',
    itemName: 'Dầu lửa',
    importQty: 50,
    stockQty: 80,
    exportQty: 10,
    documentCode: 'PN-2310-001',
    type: 'Nhập',
    notes: 'Nhập đầu tháng'
  },
  {
    id: 'HIST-005',
    dateTime: '2023-10-25 15:45',
    week: 'W43',
    itemId: 'HCHC.0091',
    itemName: 'Silicon 9230+ xúc tác (Vĩnh Hưng)',
    importQty: 10,
    stockQty: 15,
    exportQty: 15,
    documentCode: 'PN-2310-041',
    type: 'Nhập',
    notes: 'Bổ sung vật tư đổ khuôn mềm'
  },
  {
    id: 'HIST-006',
    dateTime: '2023-10-24 10:15',
    week: 'W43',
    itemId: 'VTVT.0189',
    itemName: 'Xà bông cục',
    importQty: 500,
    stockQty: 1300,
    exportQty: 200,
    documentCode: 'PX-2310-005',
    type: 'Xuất',
    notes: 'Xuất kho sản xuất ca ngày'
  }
];

export const ITEM_CHANGES_HISTORY: Record<string, Array<{
  date: string;
  type: 'Nhập' | 'Xuất';
  qty: number;
  doc: string;
  notes: string;
}>> = {
  'NLTC.0196': [
    { date: '15/10/2023', type: 'Nhập', qty: 200, doc: 'PN-2310-045', notes: 'Nhập từ nhà cung cấp Nam Hồng lô hàng tháng 10' },
    { date: '12/10/2023', type: 'Xuất', qty: -50, doc: 'PX-2310-012', notes: 'Xuất xưởng đúc khuôn A2' },
    { date: '05/10/2023', type: 'Xuất', qty: -120, doc: 'PX-2310-008', notes: 'Xuất cho xưởng B' },
    { date: '01/10/2023', type: 'Nhập', qty: 300, doc: 'PN-2310-001', notes: 'Nhập đầu tháng' }
  ],
  'NLTC.0198': [
    { date: '20/10/2023', type: 'Xuất', qty: -70, doc: 'PX-2310-018', notes: 'Gia công khuôn cái sản phẩm M04' },
    { date: '14/10/2023', type: 'Nhập', qty: 100, doc: 'PN-2310-038', notes: 'Lô thạch cao đúc khuôn' },
    { date: '02/10/2023', type: 'Xuất', qty: -80, doc: 'PX-2310-003', notes: 'Xuất xưởng chuẩn bị đúc mẫu' }
  ],
  'NLTC.0195': [
    { date: '22/10/2023', type: 'Xuất', qty: -50, doc: 'PX-2310-020', notes: 'Xuất thử nghiệm dòng khuôn mới' },
    { date: '01/10/2023', type: 'Nhập', qty: 300, doc: 'PN-2310-002', notes: 'Nhập tồn kho định kỳ' }
  ],
  'NHDM.0005': [
    { date: '26/10/2023', type: 'Nhập', qty: 20, doc: 'PN-2310-048', notes: 'Bổ sung dầu chống rỉ và làm sạch' },
    { date: '18/10/2023', type: 'Xuất', qty: -5, doc: 'PX-2310-014', notes: 'Xuất bảo dưỡng máy' }
  ],
  'VTVT.0189': [
    { date: '24/10/2023', type: 'Nhập', qty: 500, doc: 'PN-2310-043', notes: 'Nhập lô xà bông bôi trơn khuôn' },
    { date: '15/10/2023', type: 'Xuất', qty: -200, doc: 'PX-2310-011', notes: 'Phân phát các tổ sản xuất' }
  ],
  'HCHC.0091': [
    { date: '25/10/2023', type: 'Nhập', qty: 10, doc: 'PN-2310-046', notes: 'Silicon dẻo Vĩnh Hưng kèm chai xúc tác' },
    { date: '10/10/2023', type: 'Xuất', qty: -15, doc: 'PX-2310-007', notes: 'Rót khuôn silicone chi tiết tinh' }
  ]
};
