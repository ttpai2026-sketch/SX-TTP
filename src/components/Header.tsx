import React from 'react';
import { ScreenType } from '../types';
import { Search, Bell, User, Menu, FileSpreadsheet } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNotifications: () => void;
  onOpenMobileMenu: () => void;
  onOpenGoogleSheets?: () => void;
  currentUser?: FirebaseUser | null;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  searchQuery,
  onSearchChange,
  onOpenNotifications,
  onOpenMobileMenu,
  onOpenGoogleSheets,
  currentUser,
  unreadCount = 2
}) => {
  return (
    <header className="bg-white border-b border-[#c1c6d6] flex justify-between items-center w-full px-6 h-14 shrink-0 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-6 h-full">
        {/* Mobile Hamburger */}
        <button
          id="btn-mobile-menu-toggle"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-md text-[#515f74] hover:bg-[#f3f4f5] transition-colors"
          title="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Title */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="text-[20px] font-bold text-[#005bbf] cursor-pointer flex items-center gap-2 select-none"
        >
          <span>Nhà Khuôn</span>
        </div>

        {/* Desktop Top Sub-nav Links */}
        <nav className="hidden md:flex h-full items-end gap-6">
          <button
            onClick={() => onNavigate('catalog')}
            className={`pb-3 text-[12px] font-medium transition-colors cursor-pointer ${
              currentScreen === 'catalog'
                ? 'text-[#005bbf] border-b-2 border-[#005bbf] font-bold'
                : 'text-[#515f74] hover:text-[#005bbf]'
            }`}
          >
            Danh Mục
          </button>
          <button
            onClick={() => onNavigate('entry')}
            className={`pb-3 text-[12px] font-medium transition-colors cursor-pointer ${
              currentScreen === 'entry'
                ? 'text-[#005bbf] border-b-2 border-[#005bbf] font-bold'
                : 'text-[#515f74] hover:text-[#005bbf]'
            }`}
          >
            Nhập Liệu
          </button>
          <button
            onClick={() => onNavigate('history')}
            className={`pb-3 text-[12px] font-medium transition-colors cursor-pointer ${
              currentScreen === 'history'
                ? 'text-[#005bbf] border-b-2 border-[#005bbf] font-bold'
                : 'text-[#515f74] hover:text-[#005bbf]'
            }`}
          >
            Lịch Sử
          </button>
          <button
            onClick={() => onNavigate('report')}
            className={`pb-3 text-[12px] font-medium transition-colors cursor-pointer ${
              currentScreen === 'report'
                ? 'text-[#005bbf] border-b-2 border-[#005bbf] font-bold'
                : 'text-[#515f74] hover:text-[#005bbf]'
            }`}
          >
            Báo Cáo
          </button>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Quick Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#727785]" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm mã hàng, tên..."
            className="pl-9 pr-4 py-1.5 bg-[#f3f4f5] border border-[#c1c6d6] rounded-full text-[13px] text-[#191c1d] focus:outline-none focus:border-[#005bbf] focus:ring-1 focus:ring-[#005bbf] w-56 lg:w-64 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#727785] hover:text-black"
            >
              ✕
            </button>
          )}
        </div>

        {/* Google Sheets Trigger */}
        {onOpenGoogleSheets && (
          <button
            id="btn-header-google-sheets"
            onClick={onOpenGoogleSheets}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#85f8c4]/30 hover:bg-[#85f8c4]/60 text-[#004e35] border border-[#006c4a]/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Mở bảng điều khiển đồng bộ Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#006c4a]" />
            <span className="hidden sm:inline">Google Sheets</span>
          </button>
        )}

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 border-l border-[#c1c6d6] pl-4">
          <span className="text-[12px] font-semibold text-[#191c1d] hidden sm:block truncate max-w-[100px]">
            {currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'Hệ Thống'}
          </span>
          <button
            id="btn-header-notifications"
            onClick={onOpenNotifications}
            className="relative text-[#515f74] hover:bg-[#e7e8e9] p-2 rounded-full transition-colors cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white"></span>
            )}
          </button>
          <div 
            onClick={onOpenGoogleSheets}
            className="w-8 h-8 rounded-full bg-[#d5e3fc] text-[#004493] flex items-center justify-center font-bold text-xs border border-[#adc7ff] cursor-pointer overflow-hidden"
            title={currentUser ? `Đã đăng nhập: ${currentUser.email}` : 'Tài khoản Google / Hệ thống'}
          >
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-[#005bbf]" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
