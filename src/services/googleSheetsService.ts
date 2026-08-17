import { InventoryItem, HistoryRecord } from '../types';

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
  history: HistoryRecord[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create Spreadsheet with two sheets: "TonKho_TongHop" and "LichSu_NhapXuat"
  const payload = {
    properties: {
      title: title || `QuanLy_NhaKhuon_${new Date().toISOString().slice(0, 10)}`
    },
    sheets: [
      {
        properties: {
          title: 'TonKho_TongHop',
          gridProperties: {
            frozenRowCount: 1
          }
        }
      },
      {
        properties: {
          title: 'LichSu_NhapXuat',
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
          range: 'TonKho_TongHop!A1:N',
          values: [inventoryHeaders, ...inventoryRows]
        },
        {
          range: 'LichSu_NhapXuat!A1:K',
          values: [historyHeaders, ...historyRows]
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
  history: HistoryRecord[]
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
  if (!sheetTitles.includes('TonKho_TongHop')) {
    // If not existing, pick first sheet
    targetInventorySheet = sheetTitles[0] || 'Sheet1';
  }


  if (!sheetTitles.includes('LichSu_NhapXuat')) {
    const addSheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            addSheet: {
              properties: {
                title: 'LichSu_NhapXuat',
                gridProperties: { frozenRowCount: 1 }
              }
            }
          }]
        })
      }
    );
    if (!addSheetRes.ok) {
      throw new Error(await readGoogleError(addSheetRes, 'Không thể tạo sheet lịch sử'));
    }
    sheetTitles = [...sheetTitles, 'LichSu_NhapXuat'];
  }

  const updates: Array<{ range: string; values: (string | number)[][] }> = [
    {
      range: `${quoteSheetTitle(targetInventorySheet)}!A1:N${inventoryRows.length + 1}`,
      values: [inventoryHeaders, ...inventoryRows]
    }
  ];

  updates.push({
    range: `${quoteSheetTitle('LichSu_NhapXuat')}!A1:K${historyRows.length + 1}`,
    values: [historyHeaders, ...historyRows]
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
          `${quoteSheetTitle('LichSu_NhapXuat')}!A${historyRows.length + 2}:K`
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
