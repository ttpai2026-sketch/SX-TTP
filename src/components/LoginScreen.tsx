import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';
import { googleSignIn } from '../services/auth';

export const LoginScreen: React.FC = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError('');
      await googleSignIn();
    } catch (err: any) {
      const message = String(err?.message || err || 'Không thể đăng nhập.');
      setError(
        message.includes('auth/unauthorized-domain')
          ? 'Domain của App chưa được thêm vào Firebase Authentication → Settings → Authorized domains.'
          : 'Đăng nhập không thành công. Vui lòng kiểm tra tài khoản Google và thử lại.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f4f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#c1c6d6] bg-white shadow-xl">
        <div className="bg-[#005bbf] px-7 py-8 text-white">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Quản Lý Nhà Khuôn</h1>
          <p className="mt-2 text-sm text-[#d5e3fc]">Đăng nhập để truy cập dữ liệu vận hành và sản xuất.</p>
        </div>

        <div className="space-y-5 p-7">
          <div className="space-y-3 text-sm text-[#515f74]">
            <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#006c4a]" /><span>Phân quyền theo tài khoản người dùng</span></div>
            <div className="flex items-center gap-3"><FileSpreadsheet className="h-5 w-5 text-[#006c4a]" /><span>Kết nối dữ liệu Google Sheets theo quyền được cấp</span></div>
          </div>

          {error && <div role="alert" className="rounded-lg border border-[#ba1a1a] bg-[#ffdad6]/60 p-3 text-xs font-semibold text-[#93000a]">{error}</div>}

          <button
            id="btn-system-google-sign-in"
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#005bbf] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#004493] disabled:cursor-wait disabled:opacity-60"
          >
            {isSigningIn ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            {isSigningIn ? 'Đang đăng nhập...' : 'Đăng nhập bằng Google'}
          </button>
          <p className="text-center text-[11px] text-[#727785]">Phiên đăng nhập hệ thống được lưu trên trình duyệt. Quyền Google Sheets có thể cần xác nhận lại khi token hết hạn.</p>
        </div>
      </div>
    </main>
  );
};
