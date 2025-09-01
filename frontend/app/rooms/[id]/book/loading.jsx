export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-700 text-lg font-medium">กำลังโหลดข้อมูลการจอง...</p>
        <p className="text-slate-500 text-sm mt-2">กรุณารอสักครู่</p>
      </div>
    </div>
  );
}