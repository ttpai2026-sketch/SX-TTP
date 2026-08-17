import { InventoryItem, HistoryRecord, WeekCatalogItem } from '../types';

export const DEFAULT_SPREADSHEET_ID = '1SF6tZwcM9KQyNNL2K5W2ZL5U-vcFXTZliWaSpjb048k';
export const DEFAULT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`;
const INVENTORY_SHEET = 'TonKho_TongHop';
const HISTORY_SHEET = 'LichSu_NhapXuat';
const PRODUCT_CATALOG_SHEET = 'Danh Mục Sản Phẩm';
const WEEK_CATALOG_SHEET = 'Danh Mục Tuần';

const productCatalogHeaders = [
  'Mã Hàng',
  'Tên Hàng',
  'Phân Loại',
  'Đơn Vị Tính',
  'Vị Trí Kho',
  'Ngưỡng Tối Thiểu',
  'Kích Thước / Quy Cách',
  'Chất Liệu',
  'Trọng Lượng Chuẩn',
  'Trạng Thái'
];

const weekCatalogHeaders = [
  'Mã Tuần',
  'Năm',
  'Từ Ngày',
  'Đến Ngày',
  'Tên Hiển Thị',
  'Trạng Thái'
];

export const createWeekCatalog = (year = new Date().getFullYear()): WeekCatalogItem[] => {
  const today = new Date();
  const todayIso = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
    .toISOString()
    .slice(0, 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

  return Array.from({ length: 53 }, (_, index) => {
    const start = new Date(firstMonday);
    start.setUTCDate(firstMonday.getUTCDate() + index * 7);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    const code = `W${String(index + 1).padStart(2, '0')}`;
    const status: WeekCatalogItem['status'] = todayIso < startDate
      ? 'Sắp tới'
      : todayIso > endDate
        ? 'Đã đóng'
        : 'Đang mở';
    return {
      code,
      year,
      startDate,
      endDate,
      label: `${code} — ${startDate} đến ${endDate}`,
      status
    };
  }).filter((week) => {
    const thursday = new Date(`${week.startDate}T00:00:00Z`);
    thursday.setUTCDate(thursday.getUTCDate() + 3);
    return thursday.getUTCFullYear() === year;
  });
};

const toProductCatalogRows = (items: InventoryItem[]) => items.map((it) => [
  it.id,
  it.name,
  it.category,
  it.unit,
  it.location,
  it.minStockThreshold ?? 50,
  it.specs?.dimensions || '',
  it.specs?.material || '',
  it.specs?.standardWeight || '',
  it.status || 'Đang sử dụng'
]);

const toWeekCatalogRows = (weeks: WeekCatalogItem[]) => weeks.map((week) => [
  week.code,
  week.year,
  week.startDate,
  week.endDate,
  week.label,
  week.status
]);

export interface GoogleDriveSpreadsheet {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

const parseSheetNumber = (value: string | undefined, fallback = 0) => {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readGoogleError = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({}));
  return data.error?.message || `${fallback} (${response.status})`;
};

const quoteSheetTitle = (title: string) => `'${title.replace(/'/g, "''")}'`;

/**
 * List existing Google Sheets in user's Google Drive
 */
export async function listUserSpreadsheets(accessToken: string): Promise<GoogleDriveSpreadsheet[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Lỗi tải danh sách Google Sheets (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Create a new Google Spreadsheet specifically structured for Nhà Khuôn Inventory
 */
export async function createNhaKhuonSpreadsheet(
  accessToken: string,
  title: string,
  items: InventoryItem[],
  history: HistoryRecord[],
  weeks: WeekCatalogItem[] = createWeekCatalog()
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create Spreadsheet with inventory, history and app catalog sheets.
  const payload = {
    properties: {
      title: title || `QuanLy_NhaKhuon_${new Date().toISOString().slice(0, 10)}`
    },
    sheets: [
      {
        properties: {
          title: INVENTORY_SHEET,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      },
      {
        properties: {
          title: HISTORY_SHEET,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      },
      {
        properties: {
          title: PRODUCT_CATALOG_SHEET,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      },
      {
        properties: {
          title: WEEK_CATALOG_SHEET,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    ]
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể tạo Google Sheet (${createRes.status})`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl;

  // 2. Populate Header & Data into TonKho_TongHop
  const inventoryHeaders = [
    'Mã Hàng',
    'Tên Vật Tư / Nguyên Liệu',
    'Phân Loại',
    'Đơn Vị Tính',
    'Vị Trí Kho',
    'Tồn Ban Đầu',
    'Tổng Nhập',
    'Tổng Xuất',
    'Tồn Hiện Tại',
    'Ngưỡng Tối Thiểu',
    'Kích Thước / Quy Cách',
    'Chất Liệu',
    'Trọng Lượng Chuẩn',
    'Cập Nhật Cuối'
  ];

  const inventoryRows = items.map((it) => [
    it.id,
    it.name,
    it.category,
    it.unit,
    it.location,
    it.initialStock,
    it.totalImport,
    it.totalExport,
    it.currentStock,
    it.minStockThreshold ?? 50,
    it.specs?.dimensions || '',
    it.specs?.material || '',
    it.specs?.standardWeight || '',
    it.lastUpdated
  ]);

  // 3. Populate Header & Data into LichSu_NhapXuat
  const historyHeaders = [
    'Mã Phiếu / ID',
    'Thời Gian',
    'Tuần',
    'Mã Hàng',
    'Tên Hàng',
    'Loại Giao Dịch',
    'Số Lượng Nhập',
    'Số Lượng Tồn Mới',
    'Số Lượng Xuất',
    'Mã Chứng Từ',
    'Ghi Chú'
  ];

  const historyRows = history.map((h) => [
    h.id,
    h.dateTime,
    h.week,
    h.itemId,
    h.itemName,
    h.type || (h.importQty > 0 ? 'Nhập' : 'Xuất'),
    h.importQty,
    h.stockQty,
    h.exportQty,
    h.documentCode || '',
    h.notes || ''
  ]);

  // Batch update values
  const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${quoteSheetTitle(INVENTORY_SHEET)}!A1:N`,
          values: [inventoryHeaders, ...inventoryRows]
        },
        {
          range: `${quoteSheetTitle(HISTORY_SHEET)}!A1:K`,
          values: [historyHeaders, ...historyRows]
        },
        {
          range: `${quoteSheetTitle(PRODUCT_CATALOG_SHEET)}!A1:J`,
          values: [productCatalogHeaders, ...toProductCatalogRows(items)]
        },
        {
          range: `${quoteSheetTitle(WEEK_CATALOG_SHEET)}!A1:F`,
          values: [weekCatalogHeaders, ...toWeekCatalogRows(weeks)]
        }
      ]
    })
  });

  if (!valuesRes.ok) {
    throw new Error(await readGoogleError(valuesRes, 'Đã tạo file nhưng không thể ghi dữ liệu'));
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Export current inventory & history to an existing Google Spreadsheet
 */
export async function syncToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  items: InventoryItem[],
  history: HistoryRecord[],
  weeks: WeekCatalogItem[] = createWeekCatalog()
): Promise<void> {
  const inventoryHeaders = [
    'Mã Hàng',
    'Tên Vật Tư / Nguyên Liệu',
    'Phân Loại',
    'Đơn Vị Tính',
    'Vị Trí Kho',
    'Tồn Ban Đầu',
    'Tổng Nhập',
    'Tổng Xuất',
    'Tồn Hiện Tại',
    'Ngưỡng Tối Thiểu',
    'Kích Thước / Quy Cách',
    'Chất Liệu',
    'Trọng Lượng Chuẩn',
    'Cập Nhật Cuối'
  ];

  const inventoryRows = items.map((it) => [
    it.id,
    it.name,
    it.category,
    it.unit,
    it.location,
    it.initialStock,
    it.totalImport,
    it.totalExport,
    it.currentStock,
    it.minStockThreshold ?? 50,
    it.specs?.dimensions || '',
    it.specs?.material || '',
    it.specs?.standardWeight || '',
    it.lastUpdated
  ]);

  const historyHeaders = [
    'Mã Phiếu / ID',
    'Thời Gian',
    'Tuần',
    'Mã Hàng',
    'Tên Hàng',
    'Loại Giao Dịch',
    'Số Lượng Nhập',
    'Số Lượng Tồn Mới',
    'Số Lượng Xuất',
    'Mã Chứng Từ',
    'Ghi Chú'
  ];

  const historyRows = history.map((h) => [
    h.id,
    h.dateTime,
    h.week,
    h.itemId,
    h.itemName,
    h.type || (h.importQty > 0 ? 'Nhập' : 'Xuất'),
    h.importQty,
    h.stockQty,
    h.exportQty,
    h.documentCode || '',
    h.notes || ''
  ]);

  // First check if the sheets exist, otherwise create them or write to Sheet1
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể truy cập Google Sheet (${metaRes.status})`);
  }

  const metaData = await metaRes.json();
  let sheetTitles = (metaData.sheets || []).map((s: { properties: { title: string } }) => s.properties.title);

  let targetInventorySheet = 'TonKho_TongHop';
  if (!sheetTitles.includes(INVENTORY_SHEET)) {
    // If not existing, pick first sheet
    targetInventorySheet = sheetTitles[0] || 'Sheet1';
  }


  const missingCatalogSheets = [HISTORY_SHEET, PRODUCT_CATALOG_SHEET, WEEK_CATALOG_SHEET]
    .filter((title) => !sheetTitles.includes(title));
  if (missingCatalogSheets.length > 0) {
    const addSheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: missingCatalogSheets.map((title) => ({
            addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } }
          }))
        })
      }
    );
    if (!addSheetRes.ok) {
      throw new Error(await readGoogleError(addSheetRes, 'Không thể tạo các sheet danh mục'));
    }
    sheetTitles = [...sheetTitles, ...missingCatalogSheets];
  }

  const updates: Array<{ range: string; values: (string | number)[][] }> = [
    {
      range: `${quoteSheetTitle(targetInventorySheet)}!A1:N${inventoryRows.length + 1}`,
      values: [inventoryHeaders, ...inventoryRows]
    }
  ];

  updates.push({
    range: `${quoteSheetTitle(HISTORY_SHEET)}!A1:K${historyRows.length + 1}`,
    values: [historyHeaders, ...historyRows]
  });
  updates.push({
    range: `${quoteSheetTitle(PRODUCT_CATALOG_SHEET)}!A1:J${items.length + 1}`,
    values: [productCatalogHeaders, ...toProductCatalogRows(items)]
  });
  updates.push({
    range: `${quoteSheetTitle(WEEK_CATALOG_SHEET)}!A1:F${weeks.length + 1}`,
    values: [weekCatalogHeaders, ...toWeekCatalogRows(weeks)]
  });

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updates
      })
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể cập nhật Google Sheet (${updateRes.status})`);
  }

  // Only clear rows below the newly written data after a successful update.
  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ranges: [
          `${quoteSheetTitle(targetInventorySheet)}!A${inventoryRows.length + 2}:N`,
          `${quoteSheetTitle(HISTORY_SHEET)}!A${historyRows.length + 2}:K`,
          `${quoteSheetTitle(PRODUCT_CATALOG_SHEET)}!A${items.length + 2}:J`,
          `${quoteSheetTitle(WEEK_CATALOG_SHEET)}!A${weeks.length + 2}:F`
        ]
      })
    }
  );
  if (!clearRes.ok) {
    throw new Error(await readGoogleError(clearRes, 'Đã ghi dữ liệu mới nhưng không thể xóa các dòng cũ phía dưới'));
  }
}

/**
 * Import Inventory Data from Google Sheet
 */
export async function importFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<InventoryItem[]> {
  // Read spreadsheet metadata to get sheet name
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể truy cập Sheet (${metaRes.status})`);
  }

  const metaData = await metaRes.json();
  const sheets = metaData.sheets || [];
  const tonKhoSheet = sheets.find((s: { properties: { title: string } }) => s.properties.title === 'TonKho_TongHop') || sheets[0];
  const sheetTitle = tonKhoSheet?.properties?.title || 'Sheet1';

  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${quoteSheetTitle(sheetTitle)}!A1:Z500`)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!valuesRes.ok) {
    const err = await valuesRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể đọc dữ liệu Sheet (${valuesRes.status})`);
  }

  const valuesData = await valuesRes.json();
  const rows: string[][] = valuesData.values || [];

  if (rows.length < 2) {
    throw new Error('Google Sheet không có dữ liệu hàng hóa.');
  }

  // Row 0 is header, rest is data
  const dataRows = rows.slice(1);
  const importedItems: InventoryItem[] = [];

  for (const r of dataRows) {
    if (!r[0] && !r[1]) continue; // Skip empty rows
    const id = r[0]?.trim() || `ITEM-${Date.now()}`;
    const name = r[1]?.trim() || id;
    const category = (r[2]?.trim() as any) || 'Nguyên Liệu';
    const unit = r[3]?.trim() || 'Cái';
    const location = r[4]?.trim() || 'Kho Nhà Khuôn';
    const initialStock = parseSheetNumber(r[5]);
    const totalImport = parseSheetNumber(r[6]);
    const totalExport = parseSheetNumber(r[7]);
    const currentStock = parseSheetNumber(r[8], initialStock + totalImport - totalExport);
    const minStockThreshold = parseSheetNumber(r[9], 50);
    const dimensions = r[10] || '';
    const material = r[11] || '';
    const standardWeight = r[12] || '';
    const lastUpdated = r[13] || 'Vừa đồng bộ Google Sheets';

    importedItems.push({
      id,
      name,
      category,
      unit,
      location,
      initialStock,
      currentStock,
      totalImport,
      totalExport,
      minStockThreshold,
      lastUpdated,
      specs: {
        dimensions,
        material,
        standardWeight
      }
    });
  }

  return importedItems;
}

/**
 * Import transaction history from the standard history tab.
 */
export async function importHistoryFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<HistoryRecord[]> {
  const range = encodeURIComponent(`${quoteSheetTitle(HISTORY_SHEET)}!A1:K`);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(await readGoogleError(response, 'Không thể đọc lịch sử nhập/xuất'));
  }

  const payload = await response.json();
  const rows: Array<Array<string | number>> = payload.values || [];
  return rows.slice(1).flatMap((row, index) => {
    const itemId = String(row[3] || '').trim();
    if (!itemId) return [];
    const importQty = parseSheetNumber(String(row[6] ?? ''));
    const exportQty = parseSheetNumber(String(row[8] ?? ''));
    const rawType = String(row[5] || '');
    const type: 'Nhập' | 'Xuất' = rawType === 'Xuất' ? 'Xuất' : 'Nhập';

    return [{
      id: String(row[0] || `HIST-${Date.now()}-${index}`),
      dateTime: String(row[1] || ''),
      week: String(row[2] || ''),
      itemId,
      itemName: String(row[4] || itemId),
      type,
      importQty,
      stockQty: parseSheetNumber(String(row[7] ?? '')),
      exportQty,
      documentCode: String(row[9] || ''),
      notes: String(row[10] || '')
    }];
  });
}

export async function importProductCatalog(
  accessToken: string,
  spreadsheetId: string
): Promise<InventoryItem[]> {
  const range = encodeURIComponent(`${quoteSheetTitle(PRODUCT_CATALOG_SHEET)}!A1:J`);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (response.status === 400) return [];
  if (!response.ok) {
    throw new Error(await readGoogleError(response, 'Không thể đọc danh mục sản phẩm'));
  }
  const payload = await response.json();
  const rows: Array<Array<string | number>> = payload.values || [];
  return rows.slice(1).flatMap((row) => {
    const id = String(row[0] || '').trim();
    if (!id) return [];
    return [{
      id,
      name: String(row[1] || id),
      category: (String(row[2] || 'Nguyên Liệu') as InventoryItem['category']),
      unit: String(row[3] || 'Cái'),
      location: String(row[4] || 'Kho Nhà Khuôn'),
      initialStock: 0,
      currentStock: 0,
      totalImport: 0,
      totalExport: 0,
      minStockThreshold: parseSheetNumber(String(row[5] ?? ''), 50),
      lastUpdated: 'Vừa đồng bộ Google Sheets',
      specs: {
        dimensions: String(row[6] || ''),
        material: String(row[7] || ''),
        standardWeight: String(row[8] || '')
      },
      status: row[9] === 'Ngừng sử dụng' ? 'Ngừng sử dụng' : 'Đang sử dụng'
    }];
  });
}

export async function importWeekCatalog(
  accessToken: string,
  spreadsheetId: string
): Promise<WeekCatalogItem[]> {
  const range = encodeURIComponent(`${quoteSheetTitle(WEEK_CATALOG_SHEET)}!A1:F`);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (response.status === 400) return createWeekCatalog();
  if (!response.ok) {
    throw new Error(await readGoogleError(response, 'Không thể đọc danh mục tuần'));
  }
  const payload = await response.json();
  const rows: Array<Array<string | number>> = payload.values || [];
  const weeks = rows.slice(1).flatMap((row) => {
    const code = String(row[0] || '').trim();
    if (!code) return [];
    const rawStatus = String(row[5] || 'Sắp tới');
    const status: WeekCatalogItem['status'] = rawStatus === 'Đã đóng' || rawStatus === 'Đang mở'
      ? rawStatus
      : 'Sắp tới';
    return [{
      code,
      year: parseSheetNumber(String(row[1] ?? ''), new Date().getFullYear()),
      startDate: String(row[2] || ''),
      endDate: String(row[3] || ''),
      label: String(row[4] || code),
      status
    }];
  });
  return weeks.length > 0 ? weeks : createWeekCatalog();
}

export async function loadGoogleSheetData(
  accessToken: string,
  spreadsheetId = DEFAULT_SPREADSHEET_ID
): Promise<{ items: InventoryItem[]; history: HistoryRecord[]; weeks: WeekCatalogItem[] }> {
  const [inventoryItems, history, catalogItems, weeks] = await Promise.all([
    importFromGoogleSheet(accessToken, spreadsheetId),
    importHistoryFromGoogleSheet(accessToken, spreadsheetId),
    importProductCatalog(accessToken, spreadsheetId),
    importWeekCatalog(accessToken, spreadsheetId)
  ]);
  const inventoryById = new Map(inventoryItems.map((item) => [item.id, item]));
  const items = catalogItems.length === 0
    ? inventoryItems
    : [
        ...catalogItems.map((catalogItem) => ({
          ...catalogItem,
          ...(inventoryById.get(catalogItem.id) || {}),
          name: catalogItem.name,
          category: catalogItem.category,
          unit: catalogItem.unit,
          location: catalogItem.location,
          minStockThreshold: catalogItem.minStockThreshold,
          specs: catalogItem.specs,
          status: catalogItem.status
        })),
        ...inventoryItems.filter(
          (item) => !catalogItems.some((catalogItem) => catalogItem.id === item.id)
        )
      ];
  return { items, history, weeks };
}
