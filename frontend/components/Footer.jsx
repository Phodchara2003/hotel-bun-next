'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3">
          {/* System Name */}
          <p className="text-lg font-semibold">
            ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม
          </p>
          
          {/* Developer */}
          <p className="text-gray-300">
            พัฒนาโดย นาย พชร มีหา
          </p>
          
          {/* Copyright */}
          <p className="text-gray-400 text-sm">
            © {currentYear} สงวนลิขสิทธิ์ทุกประการ
          </p>
        </div>
      </div>
    </footer>
  );
}