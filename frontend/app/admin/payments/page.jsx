'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCcw, Loader2, AlertCircle, CheckCircle2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function AdminPaymentsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null); // detailed payment
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && (user?.role === 'admin' || user?.role === 'staff' || user?.role === 'super_admin')) {
      fetchPayments();
    } else if (!authLoading && (!isAuthenticated || !user)) {
      setLoading(false);
      setError('ต้องเข้าสู่ระบบ');
    }
  }, [authLoading, isAuthenticated, user, page, statusFilter]);

  const getToken = () => Cookies.get('auth_token');

  async function fetchPayments() {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) throw new Error('no token');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/payments?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
      const data = await res.json();
      setPayments(data.payments || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
      setError('ไม่สามารถโหลดข้อมูลการชำระเงิน');
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  }

  async function openDetail(p) {
    try {
      setSelected(null);
      const token = getToken();
      const res = await fetch(`/api/admin/payments/${p.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSelected(data.payment || null);
      } else {
        setSelected(p); // fallback to list data
      }
    } catch {
      setSelected(p);
    }
  }

  async function updateStatus(id, newStatus) {
    setUpdatingStatusId(id);
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/payments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await refresh();
      } else {
        console.warn('Update status failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStatusId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-6">{error}</p>
          <button onClick={fetchPayments} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">ลองใหม่</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">จัดการการชำระเงิน</h1>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => { setPage(1); setStatusFilter(e.target.value); }} className="border rounded px-3 py-2 text-sm">
              <option value="">สถานะทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="completed">เสร็จสมบูรณ์</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
            <button onClick={refresh} disabled={refreshing} className="inline-flex items-center px-3 py-2 bg-white border rounded text-sm hover:bg-gray-100 disabled:opacity-50">
              <RefreshCcw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> รีเฟรช
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Booking</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">ไม่มีข้อมูล</td></tr>
              )}
              {payments.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{p.id}</td>
                  <td className="px-3 py-2">#{p.bookingId}</td>
                  <td className="px-3 py-2">฿{p.amount.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{new Date(p.createdAt).toLocaleString('th-TH')}</td>
                  <td className="px-3 py-2 flex items-center gap-2">
                    <button onClick={() => openDetail(p)} className="p-1 hover:text-blue-600" title="รายละเอียด"><Eye className="h-4 w-4" /></button>
                    <select disabled={updatingStatusId === p.id} value={p.status} onChange={e => updateStatus(p.id, e.target.value)} className="border rounded px-1 py-1 text-xs">
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div>หน้าที่ {page} / {totalPages}</div>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-40 flex items-center gap-1"><ChevronLeft className="h-4 w-4" /> ก่อนหน้า</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-40 flex items-center gap-1">ถัดไป <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 relative">
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setSelected(null)}>✕</button>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">รายละเอียดการชำระเงิน <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100">ID {selected.id}</span></h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Info label="Booking ID" value={selected.bookingId} />
                <Info label="Amount" value={`฿${selected.amount?.toFixed?.(2) || 0}`} />
                <Info label="Status" value={selected.status} />
                <Info label="User ID" value={selected.userId} />
                <Info label="Created" value={new Date(selected.createdAt).toLocaleString('th-TH')} />
                <Info label="Updated" value={new Date(selected.updatedAt).toLocaleString('th-TH')} />
                <Info label="Receipt URL" value={selected.paymentReceiptUrl || '-'} long />
                <Info label="Slip URL" value={selected.paymentSlipUrl || '-'} long />
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelected(null)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">ปิด</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, long }) {
  return (
    <div className={long ? 'col-span-2' : ''}>
      <div className="text-xs uppercase text-gray-500 mb-1">{label}</div>
      <div className="text-gray-800 break-all">{value ?? '-'}</div>
    </div>
  );
}
