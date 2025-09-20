'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Calendar, CreditCard, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [countdown, setCountdown] = useState(10);
  const [contactInfo, setContactInfo] = useState({
    phone: '02-123-4567',
    email: 'support@hotel.com',
    address: '',
    website: '',
    facebook: '',
    line: ''
  });

  const bookingId = searchParams.get('bookingId');
  const amount = searchParams.get('amount');

  // Fetch contact settings
  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const response = await fetch('/api/contact-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setContactInfo(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching contact settings:', error);
        // Keep default values if API fails
      }
    };

    fetchContactSettings();
  }, []);

  // เอา auto redirect ออก - ให้ผู้ใช้เลือกเอง
  // useEffect(() => {
  //   // Countdown timer
  //   const timer = setInterval(() => {
  //     setCountdown(prev => {
  //       if (prev <= 1) {
  //         clearInterval(timer);
  //         router.push('/');
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Success Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            
            {/* Success Icon */}
            <div className="mb-6">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              การจองสำเร็จ!
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              ขอบคุณที่ใช้บริการของเรา การจองของคุณได้รับการบันทึกแล้ว
            </p>

            {/* Booking Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                รายละเอียดการจอง
              </h2>
              
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">หมายเลขการจอง:</span>
                  <span className="font-mono text-blue-600 font-bold">
                    HTL{String(bookingId).padStart(6, '0')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">จำนวนเงิน:</span>
                  <span className="text-green-600 font-bold">
                    ฿{parseFloat(amount || 0).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">สถานะการชำระเงิน:</span>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    รอการตรวจสอบ
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">วันที่ทำรายการ:</span>
                  <span>{new Date().toLocaleDateString('th-TH')}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                ขั้นตอนต่อไป
              </h3>
              
              <ol className="text-left space-y-2 text-blue-700">
                <li className="flex items-start">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                  เจ้าหน้าที่จะตรวจสอบการชำระเงินของคุณ
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                  คุณจะได้รับอีเมลยืนยันการจองภายใน 24 ชั่วโมง
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                  นำอีเมลยืนยันมาแสดงเมื่อเข้าพัก
                </li>
              </ol>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ติดต่อเรา
              </h3>
              
              <div className="space-y-3">
                {contactInfo.phone && (
                  <div className="flex items-center justify-center text-gray-600">
                    <Phone className="w-5 h-5 mr-2" />
                    <span>โทร: {contactInfo.phone}</span>
                  </div>
                )}
                {contactInfo.email && (
                  <div className="flex items-center justify-center text-gray-600">
                    <Mail className="w-5 h-5 mr-2" />
                    <span>อีเมล: {contactInfo.email}</span>
                  </div>
                )}
                {contactInfo.address && (
                  <div className="flex items-center justify-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>ที่อยู่: {contactInfo.address}</span>
                  </div>
                )}

                {contactInfo.line && (
                  <div className="flex items-center justify-center text-gray-600">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    <span>LINE: {contactInfo.line}</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อเรา
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                กลับสู่หน้าแรก
              </button>
            </div>

            {/* Manual Navigation Notice */}
            <div className="mt-6 text-sm text-gray-500">
              <p>เลือกดำเนินการต่อด้วยปุ่มด้านบน หรือบันทึกหมายเลขการจองไว้</p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-yellow-600 text-xl mr-3">⚠️</div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">ข้อควรทราบ</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• กรุณาเก็บหมายเลขการจองไว้เป็นหลักฐาน</li>
                  <li>• การยกเลิกการจองต้องแจ้งล่วงหน้าอย่างน้อย 24 ชั่วโมง</li>
                  <li>• หากไม่ได้รับอีเมลยืนยันภายใน 24 ชั่วโมง กรุณาติดต่อเรา</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}