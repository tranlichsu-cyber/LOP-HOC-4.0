import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for debugging white screen
window.onerror = function(message, source, lineno, colno, error) {
  console.error("GLOBAL ERROR:", message, error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 40px; color: #1e293b; font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0;">
        <div style="width: 64px; height: 64px; background: #fee2e2; border-radius: 16px; display: flex; items-center; justify-content: center; margin-bottom: 24px;">
          <svg style="width: 32px; height: 32px; color: #ef4444;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Lỗi khởi động ứng dụng</h1>
        <p style="font-size: 16px; color: #64748b; margin-bottom: 24px; line-height: 1.6;">Ứng dụng gặp sự cố khi khởi tạo. Điều này thường do lỗi kết nối hoặc cấu hình trình duyệt.</p>
        
        <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #f1f5f9;">
          <p style="font-family: monospace; font-size: 13px; color: #ef4444; margin: 0; word-break: break-all;"><strong>Chi tiết:</strong> ${message}</p>
          ${error?.stack ? `<pre style="font-family: monospace; font-size: 11px; color: #94a3b8; margin-top: 12px; overflow: auto; max-height: 150px;">${error.stack}</pre>` : ''}
        </div>

        <div style="display: flex; gap: 12px;">
          <button onclick="window.location.reload()" style="flex: 1; padding: 12px 24px; background: #4f46e5; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;">
            Tải lại trang
          </button>
          <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" style="flex: 1; padding: 12px 24px; background: #f1f5f9; color: #475569; border: none; border-radius: 12px; font-weight: 700; cursor: pointer;">
            Xóa Cache & Thử lại
          </button>
        </div>
        
        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
          Nếu lỗi vẫn tiếp diễn, vui lòng kiểm tra kết nối mạng hoặc liên hệ hỗ trợ.
        </p>
      </div>
    `;
  }
};

// Unregister any existing service workers that might cause white screens
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log("Service Worker unregistered successfully");
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

console.log("App mounted successfully");
