import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Download,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout, getAccessToken } from '../services/auth';
import {
  listUserSpreadsheets,
  createNhaKhuonSpreadsheet,
  syncToGoogleSheet,
  loadGoogleSheetData,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SPREADSHEET_URL,
  GoogleDriveSpreadsheet
} from '../services/googleSheetsService';
import { InventoryItem, HistoryRecord, WeekCatalogItem } from '../types';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  history: HistoryRecord[];
  weeks: WeekCatalogItem[];
  onImportData: (newItems: InventoryItem[], newHistory: HistoryRecord[], newWeeks: WeekCatalogItem[]) => void;
  currentUser: User | null;
  onConnect: (user: User, accessToken: string, spreadsheetId?: string) => Promise<void>;
  onSelectSpreadsheet: (user: User, accessToken: string, spreadsheetId: string) => Promise<void>;
  onDisconnect: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  items,
  history,
  weeks,
  onImportData,
  currentUser,
  onConnect,
  onSelectSpreadsheet,
  onDisconnect
}) => {
  const [spreadsheets, setSpreadsheets] = useState<GoogleDriveSpreadsheet[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>(() =>
    localStorage.getItem('nha_khuon_last_spreadsheet_id') || DEFAULT_SPREADSHEET_ID
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    link?: string;
  } | null>(null);
  const [newSheetTitle, setNewSheetTitle] = useState(
    `QuanLy_NhaKhuon_Tuan${new Date().toISOString().slice(0, 10)}`
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    action: 'export' | 'import' | 'create';
    title: string;
    message: string;
  } | null>(null);

  const handleSelectSpreadsheet = async (spreadsheetId: string) => {
    setSelectedSpreadsheetId(spreadsheetId);
    if (!currentUser) return;
    const token = await getAccessToken();
    if (!token) {
      setNeedsReauth(true);
      return;
    }
    try {
      setIsLoading(true);
      await onSelectSpreadsheet(currentUser, token, spreadsheetId);
      setStatusMessage({
        type: 'success',
        text: 'Đã chọn bảng tính này làm nguồn dữ liệu chính của App.'
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Không thể kết nối bảng tính đã chọn.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load user spreadsheets when modal opens if logged in
  useEffect(() => {
    if (isOpen && currentUser) {
      loadSpreadsheets();
    }
  }, [isOpen, currentUser]);

  const loadSpreadsheets = async () => {
    try {
      setIsLoading(true);
      setStatusMessage(null);
      const token = await getAccessToken();
      if (!token) {
        setNeedsReauth(true);
        setStatusMessage({
          type: 'info',
          text: 'Phiên Google Drive cần được kết nối lại sau khi tải lại trang.'
        });
        return;
      }
      setNeedsReauth(false);
      const list = await listUserSpreadsheets(token);
      setSpreadsheets(list);
      const selectedSheetStillExists = list.some((sheet) => sheet.id === selectedSpreadsheetId);
      if (!selectedSheetStillExists) {
        const defaultSheet = list.find((sheet) => sheet.id === DEFAULT_SPREADSHEET_ID);
        if (defaultSheet) setSelectedSpreadsheetId(defaultSheet.id);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Lỗi khi tải danh sách Google Sheets'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setStatusMessage(null);
      const res = await googleSignIn();
      if (res) {
        setNeedsReauth(false);
        const list = await listUserSpreadsheets(res.accessToken);
        setSpreadsheets(list);
        const targetSpreadsheetId = list.some((sheet) => sheet.id === DEFAULT_SPREADSHEET_ID)
          ? DEFAULT_SPREADSHEET_ID
          : selectedSpreadsheetId;
        setSelectedSpreadsheetId(targetSpreadsheetId);
        await onConnect(res.user, res.accessToken, targetSpreadsheetId);
        setStatusMessage({
          type: 'success',
          text: `Đã liên kết tài khoản Google: ${res.user.email}. Google Sheets hiện là nguồn dữ liệu chính.`,
          link: targetSpreadsheetId === DEFAULT_SPREADSHEET_ID ? DEFAULT_SPREADSHEET_URL : undefined
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Đăng nhập Google thất bại'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onDisconnect();
    setSpreadsheets([]);
    setSelectedSpreadsheetId(DEFAULT_SPREADSHEET_ID);
    setNeedsReauth(false);
    setStatusMessage({
      type: 'info',
      text: 'Đã ngắt kết nối tài khoản Google'
    });
  };

  // 1. Create New Google Sheet
  const executeCreateNew = async () => {
    try {
      setIsProcessing(true);
      setStatusMessage(null);
      setShowConfirmModal(null);

      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }
      if (!token) throw new Error('Cần đăng nhập Google để tiếp tục');

      const result = await createNhaKhuonSpreadsheet(
        token,
        newSheetTitle,
        items,
        history,
        weeks
      );

      setStatusMessage({
        type: 'success',
        text: `Đã tạo thành công Google Sheet mới với ${items.length} mã hàng và ${history.length} bản ghi lịch sử!`,
        link: result.spreadsheetUrl
      });

      // Refresh list
      await loadSpreadsheets();
      setSelectedSpreadsheetId(result.spreadsheetId);
      if (currentUser) await onConnect(currentUser, token, result.spreadsheetId);
      setIsCreatingNew(false);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Không thể tạo Google Sheet mới'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Export / Sync To Selected Sheet
  const executeExportSync = async () => {
    try {
      if (!selectedSpreadsheetId) {
        setStatusMessage({
          type: 'error',
          text: 'Vui lòng chọn 1 bảng tính Google Sheet từ danh sách'
        });
        return;
      }

      setIsProcessing(true);
      setStatusMessage(null);
      setShowConfirmModal(null);

      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }
      if (!token) throw new Error('Cần đăng nhập Google để tiếp tục');

      await syncToGoogleSheet(token, selectedSpreadsheetId, items, history, weeks);

      const target = spreadsheets.find((s) => s.id === selectedSpreadsheetId);

      setStatusMessage({
        type: 'success',
        text: `Đã đồng bộ ${items.length} mặt hàng tồn kho và ${history.length} bản ghi vào bảng tính "${target?.name || 'Google Sheet'}"!`,
        link: target?.webViewLink || `https://docs.google.com/spreadsheets/d/${selectedSpreadsheetId}/edit`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Lỗi khi đồng bộ dữ liệu sang Google Sheet'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Import from Selected Sheet
  const executeImport = async () => {
    try {
      if (!selectedSpreadsheetId) {
        setStatusMessage({
          type: 'error',
          text: 'Vui lòng chọn bảng tính Google Sheet cần nhập'
        });
        return;
      }

      setIsProcessing(true);
      setStatusMessage(null);
      setShowConfirmModal(null);

      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }
      if (!token) throw new Error('Cần đăng nhập Google để tiếp tục');

      const imported = await loadGoogleSheetData(token, selectedSpreadsheetId);

      onImportData(imported.items, imported.history, imported.weeks);

      setStatusMessage({
        type: 'success',
        text: `Đã nhập ${imported.items.length} mặt hàng, ${imported.weeks.length} tuần và ${imported.history.length} giao dịch từ Google Sheet!`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Lỗi khi nạp dữ liệu từ Google Sheet'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white border border-[#c1c6d6] rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#f3f4f5] border-b border-[#c1c6d6] px-5 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#006c4a]/15 text-[#006c4a] flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5 text-[#006c4a]" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#191c1d] flex items-center gap-2">
                Đồng Bộ Google Sheets
              </h2>
              <p className="text-xs text-[#515f74]">
                Liên kết bảng tính thực tế trên Google Drive của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#515f74] hover:bg-[#e1e3e4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm text-[#191c1d]">
          {/* Auth State Card */}
          {!currentUser ? (
            <div className="p-4 bg-[#f8f9fa] border border-[#c1c6d6] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-sm text-[#191c1d] flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-[#005bbf]" />
                  Chưa kết nối Google Workspace
                </div>
                <p className="text-xs text-[#515f74]">
                  Đăng nhập để chọn hoặc tạo mới bảng tính Google Sheets trực tiếp từ Google Drive của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoading}
                className="gsi-material-button inline-flex items-center justify-center shrink-0 bg-white border border-[#747775] hover:bg-[#f2f2f2] px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer text-[#1f1f1f]"
              >
                <div className="mr-2 w-4 h-4">
                  <svg viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <span>Đăng nhập Google</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-[#d5e3fc]/40 border border-[#adc7ff] rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-8 h-8 rounded-full border border-[#adc7ff]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#005bbf] text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#004493] truncate">
                    {currentUser.displayName || 'Tài khoản Google'}
                  </div>
                  <div className="text-[11px] text-[#515f74] truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {needsReauth && (
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="text-xs text-[#005bbf] hover:bg-[#d5e3fc] px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Kết nối lại</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs text-[#ba1a1a] hover:bg-[#ffdad6] px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                  title="Đăng xuất tài khoản Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            </div>
          )}

          {/* Status / Alert Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-[#85f8c4]/30 border-[#006c4a] text-[#002114]'
                  : statusMessage.type === 'error'
                  ? 'bg-[#ffdad6]/60 border-[#ffb4ab] text-[#93000a]'
                  : 'bg-[#d5e3fc]/40 border-[#adc7ff] text-[#004493]'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#006c4a] shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
              ) : (
                <FolderOpen className="w-4 h-4 text-[#005bbf] shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">{statusMessage.text}</p>
                {statusMessage.link && (
                  <a
                    href={statusMessage.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#005bbf] hover:underline mt-1"
                  >
                    <span>Mở bảng tính Google Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Action Tabs: Choose existing vs Create New */}
          {currentUser && (
            <div className="space-y-4">
              <div className="flex border-b border-[#c1c6d6]">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    !isCreatingNew
                      ? 'border-[#005bbf] text-[#005bbf]'
                      : 'border-transparent text-[#515f74] hover:text-[#191c1d]'
                  }`}
                >
                  Bảng Tính Trên Drive ({spreadsheets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    isCreatingNew
                      ? 'border-[#005bbf] text-[#005bbf]'
                      : 'border-transparent text-[#515f74] hover:text-[#191c1d]'
                  }`}
                >
                  + Tạo Mới Bảng Tính
                </button>
              </div>

              {/* Tab 1: Existing Sheets */}
              {!isCreatingNew ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#191c1d]">
                      Chọn File Google Sheet để thao tác:
                    </label>
                    <button
                      type="button"
                      onClick={loadSpreadsheets}
                      disabled={isLoading}
                      className="text-[11px] text-[#005bbf] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      Làm mới
                    </button>
                  </div>

                  {spreadsheets.length === 0 ? (
                    <div className="p-4 bg-[#f8f9fa] border border-dashed border-[#c1c6d6] rounded-lg text-center text-xs text-[#515f74]">
                      {isLoading ? (
                        'Đang tải danh sách Google Sheets...'
                      ) : (
                        <div>
                          <p>Chưa tìm thấy file Google Sheet nào trong Drive của bạn.</p>
                          <button
                            type="button"
                            onClick={() => setIsCreatingNew(true)}
                            className="mt-2 text-[#005bbf] font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tạo bảng tính Nhà Khuôn mới ngay
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-[#c1c6d6] rounded-lg divide-y divide-[#e1e3e4]">
                      {spreadsheets.map((sheet) => (
                        <div
                          key={sheet.id}
                          onClick={() => handleSelectSpreadsheet(sheet.id)}
                          className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            selectedSpreadsheetId === sheet.id
                              ? 'bg-[#d5e3fc]/60 text-[#004493] font-bold'
                              : 'hover:bg-[#f8f9fa] text-[#191c1d]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileSpreadsheet className="w-4 h-4 text-[#006c4a] shrink-0" />
                            <span className="truncate">{sheet.name}</span>
                          </div>
                          {sheet.webViewLink && (
                            <a
                              href={sheet.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#515f74] hover:text-[#005bbf] p-1 shrink-0"
                              title="Mở tab mới"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions on Existing Sheet */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isProcessing || !selectedSpreadsheetId}
                      onClick={() =>
                        setShowConfirmModal({
                          action: 'export',
                          title: 'Xác nhận Ghi Đè / Đồng Bộ lên Google Sheet',
                          message: `Bạn có chắc muốn xuất toàn bộ ${items.length} mặt hàng và ${history.length} bản ghi lịch sử vào Google Sheet này? Dữ liệu trên sheet sẽ được làm mới.`
                        })
                      }
                      className="p-2.5 bg-[#005bbf] hover:bg-[#004493] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-4 h-4" />
                      <span>App → Google Sheets</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing || !selectedSpreadsheetId}
                      onClick={() =>
                        setShowConfirmModal({
                          action: 'import',
                          title: 'Xác nhận Nạp Dữ Liệu từ Google Sheet',
                          message:
                            'Dữ liệu danh mục hàng từ file Google Sheet đã chọn sẽ được nạp và thay thế danh mục hiện tại trong ứng dụng. Bạn có muốn tiếp tục?'
                        })
                      }
                      className="p-2.5 bg-white border border-[#006c4a] text-[#006c4a] hover:bg-[#85f8c4]/20 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Google Sheets → App</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Tab 2: Create New Sheet */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#191c1d] mb-1">
                      Tên file Google Sheet mới:
                    </label>
                    <input
                      type="text"
                      value={newSheetTitle}
                      onChange={(e) => setNewSheetTitle(e.target.value)}
                      className="w-full bg-white border border-[#c1c6d6] rounded-lg p-2 text-xs text-[#191c1d] focus:border-[#005bbf] outline-none"
                    />
                  </div>

                  <div className="p-3 bg-[#f8f9fa] border border-[#c1c6d6] rounded-lg text-xs text-[#515f74] space-y-1">
                    <p className="font-bold text-[#191c1d]">Cấu trúc bảng tính được tạo tự động:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li><strong>Tab 1 (TonKho_TongHop):</strong> Bảng tồn kho tổng hợp đầy đủ mã, quy cách, số lượng tồn.</li>
                      <li><strong>Tab 2 (LichSu_NhapXuat):</strong> Toàn bộ lịch sử các giao dịch nhập xuất theo tuần.</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing || !newSheetTitle.trim()}
                    onClick={() =>
                      setShowConfirmModal({
                        action: 'create',
                        title: 'Xác nhận Tạo File Google Sheet Mới',
                        message: `Ứng dụng sẽ tạo file "${newSheetTitle}" trên Google Drive của bạn và tự động nạp ${items.length} mã hàng.`
                      })
                    }
                    className="w-full p-2.5 bg-[#006c4a] hover:bg-[#004e35] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo File &amp; Đồng Bộ Ngay</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f3f4f5] p-3.5 border-t border-[#c1c6d6] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#727785] text-[#515f74] hover:bg-[#e1e3e4] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog (MANDATORY for Workspace destructive mutations) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#c1c6d6] rounded-xl w-full max-w-md p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#ffdad6]/50 rounded-lg text-[#ba1a1a] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-[#191c1d]">
                  {showConfirmModal.title}
                </h3>
                <p className="text-xs text-[#515f74] leading-relaxed">
                  {showConfirmModal.message}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowConfirmModal(null)}
                className="px-3.5 py-1.5 border border-[#727785] text-[#515f74] hover:bg-[#f3f4f5] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  if (showConfirmModal.action === 'export') executeExportSync();
                  else if (showConfirmModal.action === 'import') executeImport();
                  else if (showConfirmModal.action === 'create') executeCreateNew();
                }}
                className="px-4 py-1.5 bg-[#005bbf] hover:bg-[#004493] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Xác Nhận Thực Hiện</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
