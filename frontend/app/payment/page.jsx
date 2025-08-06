"use client";
import { useState, useEffect } from "react";

export default function PaymentPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("http://localhost:3001/api/payment-settings");
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลการชำระเงินได้");
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  if (loading) return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!settings) return <div className="p-8 text-center">ไม่พบข้อมูลการชำระเงิน</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">ชำระเงินผ่าน QR Code</h1>
      {settings.qrCodeUrl ? (
        <div className="flex flex-col items-center mb-6">
          <img
            src={`http://localhost:3001${settings.qrCodeUrl}`}
            alt="QR Code สำหรับชำระเงิน"
            className="w-64 h-64 object-contain border rounded-lg mb-2"
          />
          <span className="text-gray-500 text-sm">สแกน QR Code เพื่อโอนเงิน</span>
        </div>
      ) : (
        <div className="text-center text-gray-400 mb-6">ยังไม่มี QR Code สำหรับชำระเงิน</div>
      )}
      <div className="bg-gray-50 rounded p-4 mb-4">
        <div className="mb-2">
          <span className="font-semibold">ธนาคาร:</span> {settings.bankName || "-"}
        </div>
        <div className="mb-2">
          <span className="font-semibold">เลขที่บัญชี:</span> {settings.accountNumber || "-"}
        </div>
        <div>
          <span className="font-semibold">ชื่อบัญชี:</span> {settings.accountName || "-"}
        </div>
      </div>
      <div className="text-center text-gray-600 text-sm">
        กรุณาโอนเงินตามจำนวนที่ระบุและแนบหลักฐานการโอนเงินในระบบ
      </div>
    </div>
  );
}
