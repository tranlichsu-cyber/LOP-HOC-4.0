import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let displayMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
      
      try {
        const errorData = JSON.parse(this.state.error?.message || '{}');
        if (errorData.error && errorData.error.includes('permissions')) {
          displayMessage = "Bạn không có quyền thực hiện thao tác này. Vui lòng kiểm tra lại quyền hạn hoặc liên hệ quản trị viên.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="p-8 text-center bg-red-50 rounded-2xl border-2 border-red-200 m-4">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Rất tiếc!</h2>
          <p className="text-red-600 mb-6 font-medium">{displayMessage}</p>
          <button
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-md"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
