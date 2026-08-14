import React from 'react';
import { ScreenType } from '../types';
import { 
  Plus, 
  Layers, 
  History, 
  FileSpreadsheet, 
  FileEdit, 
  HelpCircle,
  X
} from 'lucide-react';

interface SidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onOpenNewSlip: () => void;
  onOpenGoogleSheets?: () => void;
  onOpenHelp: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  onOpenNewSlip,
  onOpenGoogleSheets,
  onOpenHelp,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const menuItems: { id: ScreenType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'catalog',
      label: 'Danh Mục Mã Hàng',
      icon: <Layers className="w-5 h-5" />
    },
    {
      id: 'history',
      label: 'Lịch Sử Nhập',
      icon: <History className="w-5 h-5" />
    },
    {
      id: 'report',
      label: 'Báo Cáo Nhập Xuất Tồn',
      icon: <FileSpreadsheet className="w-5 h-5" />
    },
    {
      id: 'entry',
      label: 'Nhập Liệu',
      icon: <FileEdit className="w-5 h-5" />
    }
  ];

  const content = (
    <div className="flex flex-col h-full p-4 bg-[#f3f4f5] border-r border-[#c1c6d6] text-[#191c1d]">
      {/* Brand Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#005bbf] leading-tight">Quản Lý Nhà Khuôn</h1>
          <p className="text-[13px] text-[#515f74] mt-0.5">Vận hành &amp; Sản xuất</p>
        </div>
        {isOpenMobile && onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#515f74] hover:bg-[#e1e3e4]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Action Button: Tạo Phiếu Mới */}
      <button 
        id="btn-sidebar-create-slip"
        onClick={() => {
          onOpenNewSlip();
          if (isOpenMobile && onCloseMobile) onCloseMobile();
        }}
        className="w-full bg-[#005bbf] hover:bg-[#004493] text-white text-[13px] font-semibold tracking-wide py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm mb-2 cursor-pointer active:scale-[0.98]"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Tạo Phiếu Mới</span>
      </button>

      {/* Google Sheets Sync Button */}
      <button 
        id="btn-sidebar-google-sheets"
        onClick={() => {
          if (onOpenGoogleSheets) onOpenGoogleSheets();
          if (isOpenMobile && onCloseMobile) onCloseMobile();
        }}
        className="w-full bg-white hover:bg-[#d5e3fc]/50 text-[#006c4a] border border-[#006c4a]/30 text-[13px] font-semibold tracking-wide py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-2xs mb-4 cursor-pointer"
      >
        <FileSpreadsheet className="w-4 h-4 text-[#006c4a]" />
        <span>Google Sheets Sync</span>
      </button>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {menuItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => {
                onNavigate(item.id);
                if (isOpenMobile && onCloseMobile) onCloseMobile();
              }}
              className={`w-full text-left p-2.5 flex items-center gap-3 rounded-lg text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#d5e3fc] text-[#004493] shadow-xs translate-x-1'
                  : 'text-[#515f74] hover:bg-[#e1e3e4] hover:text-[#191c1d]'
              }`}
            >
              <span className={isActive ? 'text-[#005bbf]' : 'text-[#515f74]'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Help */}
      <div className="mt-auto pt-3 border-t border-[#c1c6d6]">
        <button
          id="btn-sidebar-help"
          onClick={() => {
            onOpenHelp();
            if (isOpenMobile && onCloseMobile) onCloseMobile();
          }}
          className="w-full text-left p-2 flex items-center gap-3 text-[#515f74] hover:bg-[#e1e3e4] hover:text-[#191c1d] rounded-lg text-[13px] font-semibold transition-colors cursor-pointer"
        >
          <HelpCircle className="w-5 h-5 text-[#515f74]" />
          <span>Trợ Giúp</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <nav aria-label="Main Navigation" className="hidden lg:block w-64 h-screen shrink-0 fixed left-0 top-0 z-40">
        {content}
      </nav>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full bg-[#f3f4f5] z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
