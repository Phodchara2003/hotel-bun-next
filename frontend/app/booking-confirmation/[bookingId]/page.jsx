'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Upload, Eye, Calendar, Users, Bed, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BookingConfirmation({ params }) {
  const router = useRouter();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);

  const bookingId = params?.bookingId || 'HTL' + Date.now();

  useEffect(() => {
    // จำลองการดึงข้อมูลการจอง
    setTimeout(() => {
      setBookingData({
        id: bookingId,
        reference: bookingId,
        checkIn: '2025-09-15',
        checkOut: '2025-09-17',
        nights: 2,
        guests: 2,
        roomType: 'ห้องพัก',
        totalAmount: 3000, // 1500 * 2 nights
        status: 'confirmed',
        paymentStatus: 'pending',
        customerName: 'ทดสอบ ลูกค้า',
        customerEmail: 'test@customer.com',
        customerPhone: '081-234-5678'
      });
      setLoading(false);
    }, 1000);
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลการจอง...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบข้อมูลการจอง</h2>
          <p className="text-gray-600 mb-6">ขออภัย ไม่สามารถดึงข้อมูลการจองได้</p>
          <button
            onClick={() => router.push('/booking')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            จองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Success */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">การจองสำเร็จ!</h1>
          <p className="text-gray-600">ขอบคุณที่ใช้บริการของเรา</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ข้อมูลการจอง */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ข้อมูลการจอง</h2>
            
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-700">วันที่เข้าพัก</span>
                </div>
                <p className="text-gray-900 ml-7">
                  {new Date(bookingData.checkIn).toLocaleDateString('th-TH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="border-b pb-4">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-700">วันที่ออก</span>
                </div>
                <p className="text-gray-900 ml-7">
                  {new Date(bookingData.checkOut).toLocaleDateString('th-TH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="border-b pb-4">
                <div className="flex items-center mb-2">
                  <Bed className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-700">ประเภทห้อง</span>
                </div>
                <p className="text-gray-900 ml-7">{bookingData.roomType}</p>
              </div>

              <div className="border-b pb-4">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-700">จำนวนผู้เข้าพัก</span>
                </div>
                <p className="text-gray-900 ml-7">{bookingData.guests} คน ({bookingData.nights} คืน)</p>
              </div>

              <div className="pt-2">
                <div className="flex items-center mb-2">
                  <CreditCard className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-700">ยอดรวมที่ต้องชำระ</span>
                </div>
                <p className="text-2xl font-bold text-green-600 ml-7">
                  ฿{bookingData.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-1">หมายเลขการจอง</h3>
              <p className="text-blue-900 font-mono text-lg">{bookingData.reference}</p>
              <p className="text-blue-700 text-sm mt-1">
                กรุณาเก็บหมายเลขนี้ไว้สำหรับการติดต่อ
              </p>
            </div>
          </div>

          {/* ขั้นตอนการชำระเงิน */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ขั้นตอนการชำระเงิน</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">การจองเสร็จสิ้น</h3>
                  <p className="text-gray-600 text-sm">ระบบได้บันทึกการจองของคุณเรียบร้อยแล้ว</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">ชำระเงินและอัปโหลดสลิป</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    โอนเงินตามจำนวนที่ระบุ แล้วอัปโหลดสลิปการโอนเงิน
                  </p>
                  <Link
                    href={`/payment?bookingId=${bookingData.id}&amount=${bookingData.totalAmount}&hotelName=Hotel Bun Next`}
                    className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    ไปชำระเงินและอัปโหลดสลิป
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">รอการตรวจสอบ</h3>
                  <p className="text-gray-600 text-sm">
                    เจ้าหน้าที่จะตรวจสอบการชำระเงินและส่งอีเมลยืนยันให้คุณ
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  4
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">เสร็จสิ้น</h3>
                  <p className="text-gray-600 text-sm">
                    เตรียมตัวเข้าพักตามวันที่ที่จองไว้
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* สถานะการชำระเงิน */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
            <h3 className="text-lg font-semibold text-yellow-800">สถานะการชำระเงิน: รอการชำระเงิน</h3>
          </div>
          <p className="text-yellow-700 mb-4">
            กรุณาชำระเงินภายใน 24 ชั่วโมง มิฉะนั้นการจองจะถูกยกเลิกโดยอัตโนมัติ
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/payment?bookingId=${bookingData.id}&amount=${bookingData.totalAmount}&hotelName=Hotel Bun Next`}
              className="inline-flex items-center justify-center bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              ชำระเงินทันที
            </Link>
            <button
              onClick={() => router.push('/booking')}
              className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              จองใหม่อีกครั้ง
            </button>
          </div>
        </div>

        {/* ข้อมูลติดต่อ */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">ต้องการความช่วยเหลือ?</h3>
          <p className="text-blue-700 mb-4">
            หากมีข้อสงสัยเกี่ยวกับการจองหรือการชำระเงิน กรุณาติดต่อเรา
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-blue-600">
            <div>
              <p className="font-medium">📞 โทรศัพท์</p>
              <p>02-123-4567</p>
            </div>
            <div>
              <p className="font-medium">📧 อีเมล</p>
              <p>support@hotel.com</p>
            </div>
            <div>
              <p className="font-medium">💬 Line</p>
              <p>@hotelreservation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
