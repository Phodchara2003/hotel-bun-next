'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CreditCard,
  Globe,
  Bed,
  Utensils,
  Accessibility,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

function GuestInformationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Get booking data from URL params
  const bookingReference = searchParams.get('bookingRef');
  const paymentSlipPath = searchParams.get('paymentSlip');
  const hotelId = searchParams.get('hotelId');
  const roomType = searchParams.get('roomType');
  const totalAmount = searchParams.get('amount');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data state
  const [guestData, setGuestData] = useState({
    // Primary guest information
    primaryGuest: {
      title: 'Mr.',
      firstName: '',
      lastName: '',
      email: user?.email || '',
      phone: '',
      idType: 'passport',
      idNumber: '',
      nationality: 'Thai',
      dateOfBirth: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Thailand'
      }
    },
    
    // Additional guests
    additionalGuests: [],
    
    // Special requests
    specialRequests: {
      dietaryRequirements: [],
      accessibilityNeeds: [],
      bedPreference: '',
      smokingPreference: 'non-smoking',
      floorPreference: '',
      additionalRequests: ''
    },
    
    // Emergency contact
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  // Validation state
  const [errors, setErrors] = useState({});

  // Check if all required data is available
  useEffect(() => {
    if (!bookingReference || !paymentSlipPath) {
      toast.error('ข้อมูลการจองไม่ครบถ้วน กรุณาดำเนินการจองใหม่');
      router.push('/');
    }
  }, [bookingReference, paymentSlipPath, router]);

  // Handle input changes
  const handleInputChange = (section, field, value, index = null) => {
    setGuestData(prev => {
      const newData = { ...prev };
      
      if (section === 'primaryGuest' && field.includes('address.')) {
        const addressField = field.split('.')[1];
        newData.primaryGuest.address[addressField] = value;
      } else if (section === 'additionalGuests' && index !== null) {
        if (!newData.additionalGuests[index]) {
          newData.additionalGuests[index] = {};
        }
        newData.additionalGuests[index][field] = value;
      } else if (section === 'specialRequests' && Array.isArray(newData[section][field])) {
        // Handle array fields (dietary requirements, accessibility needs)
        if (newData[section][field].includes(value)) {
          newData[section][field] = newData[section][field].filter(item => item !== value);
        } else {
          newData[section][field] = [...newData[section][field], value];
        }
      } else {
        if (section) {
          newData[section][field] = value;
        } else {
          newData[field] = value;
        }
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[`${section}.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${field}`];
        return newErrors;
      });
    }
  };

  // Add additional guest
  const addAdditionalGuest = () => {
    setGuestData(prev => ({
      ...prev,
      additionalGuests: [
        ...prev.additionalGuests,
        {
          title: 'Mr.',
          firstName: '',
          lastName: '',
          relationship: '',
          idType: 'passport',
          idNumber: ''
        }
      ]
    }));
  };

  // Remove additional guest
  const removeAdditionalGuest = (index) => {
    setGuestData(prev => ({
      ...prev,
      additionalGuests: prev.additionalGuests.filter((_, i) => i !== index)
    }));
  };

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      // Validate primary guest information
      if (!guestData.primaryGuest.firstName) {
        newErrors['primaryGuest.firstName'] = 'กรุณากรอกชื่อ';
      }
      if (!guestData.primaryGuest.lastName) {
        newErrors['primaryGuest.lastName'] = 'กรุณากรอกนามสกุล';
      }
      if (!guestData.primaryGuest.email) {
        newErrors['primaryGuest.email'] = 'กรุณากรอกอีเมล';
      }
      if (!guestData.primaryGuest.phone) {
        newErrors['primaryGuest.phone'] = 'กรุณากรอกเบอร์โทรศัพท์';
      }
      if (!guestData.primaryGuest.idNumber) {
        newErrors['primaryGuest.idNumber'] = 'กรุณากรอกเลขบัตรประชาชน/หนังสือเดินทาง';
      }
      if (!guestData.primaryGuest.dateOfBirth) {
        newErrors['primaryGuest.dateOfBirth'] = 'กรุณาเลือกวันเกิด';
      }
    }
    
    if (step === 2) {
      // Validate additional guests (if any)
      guestData.additionalGuests.forEach((guest, index) => {
        if (!guest.firstName) {
          newErrors[`additionalGuests.${index}.firstName`] = 'กรุณากรอกชื่อ';
        }
        if (!guest.lastName) {
          newErrors[`additionalGuests.${index}.lastName`] = 'กรุณากรอกนามสกุล';
        }
        if (!guest.relationship) {
          newErrors[`additionalGuests.${index}.relationship`] = 'กรุณาระบุความสัมพันธ์';
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Go to next step
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  // Go to previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Submit guest information
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare data for submission
      const submissionData = {
        bookingReference,
        primaryGuest: guestData.primaryGuest,
        additionalGuests: guestData.additionalGuests,
        specialRequests: guestData.specialRequests,
        emergencyContact: guestData.emergencyContact,
        bookingDetails: {
          hotelId: parseInt(hotelId),
          hotelName: searchParams.get('hotelName') || 'Premium Hotel',
          roomType: roomType,
          checkInDate: searchParams.get('checkIn'),
          checkOutDate: searchParams.get('checkOut'),
          numberOfNights: parseInt(searchParams.get('nights') || '1'),
          numberOfGuests: 1 + guestData.additionalGuests.length,
          totalAmount: parseFloat(totalAmount)
        },
        paymentInfo: {
          paymentSlipPath: paymentSlipPath,
          paymentMethod: 'bank_transfer',
          paymentAmount: parseFloat(totalAmount),
          paymentDate: new Date().toISOString().split('T')[0],
          paymentReference: searchParams.get('paymentRef')
        },
        createdBy: user?.email || 'customer'
      };
      
      console.log('Submitting guest information:', submissionData);
      
      // Submit to API
      const response = await fetch('/api/guest-information', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit guest information');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('บันทึกข้อมูลผู้เข้าพักเรียบร้อยแล้ว!');
        
        // Redirect to confirmation page
        router.push(`/booking/confirmation?guestRef=${result.guest.guestReference}&bookingRef=${bookingReference}`);
      } else {
        throw new Error(result.error || 'Failed to save guest information');
      }
      
    } catch (error) {
      console.error('Error submitting guest information:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-900">ข้อมูลผู้เข้าพักหลัก</h3>
              <p className="text-gray-600">กรุณากรอกข้อมูลของผู้เข้าพักหลัก</p>
            </div>
            
            {/* Title and Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำนำหน้า
                </label>
                <select
                  value={guestData.primaryGuest.title}
                  onChange={(e) => handleInputChange('primaryGuest', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Mr.">นาย</option>
                  <option value="Mrs.">นาง</option>
                  <option value="Ms.">นางสาว</option>
                  <option value="Dr.">ดร.</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ *
                </label>
                <input
                  type="text"
                  value={guestData.primaryGuest.firstName}
                  onChange={(e) => handleInputChange('primaryGuest', 'firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    errors['primaryGuest.firstName'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ชื่อ"
                />
                {errors['primaryGuest.firstName'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['primaryGuest.firstName']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  นามสกุล *
                </label>
                <input
                  type="text"
                  value={guestData.primaryGuest.lastName}
                  onChange={(e) => handleInputChange('primaryGuest', 'lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    errors['primaryGuest.lastName'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="นามสกุล"
                />
                {errors['primaryGuest.lastName'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['primaryGuest.lastName']}</p>
                )}
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  อีเมล *
                </label>
                <input
                  type="email"
                  value={guestData.primaryGuest.email}
                  onChange={(e) => handleInputChange('primaryGuest', 'email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    errors['primaryGuest.email'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="your@email.com"
                />
                {errors['primaryGuest.email'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['primaryGuest.email']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  เบอร์โทรศัพท์ *
                </label>
                <input
                  type="tel"
                  value={guestData.primaryGuest.phone}
                  onChange={(e) => handleInputChange('primaryGuest', 'phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    errors['primaryGuest.phone'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+66812345678"
                />
                {errors['primaryGuest.phone'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['primaryGuest.phone']}</p>
                )}
              </div>
            </div>
            
            {/* ID Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  ประเภทบัตร
                </label>
                <select
                  value={guestData.primaryGuest.idType}
                  onChange={(e) => handleInputChange('primaryGuest', 'idType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="passport">หนังสือเดินทาง</option>
                  <option value="nationalId">บัตรประชาชน</option>
                  <option value="drivingLicense">ใบขับขี่</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลขบัตร *
                </label>
                <input
                  type="text"
                  value={guestData.primaryGuest.idNumber}
                  onChange={(e) => handleInputChange('primaryGuest', 'idNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    errors['primaryGuest.idNumber'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="เลขบัตรประชาชน/หนังสือเดินทาง"
                />
                {errors['primaryGuest.idNumber'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['primaryGuest.idNumber']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  วันเกิด *
                </label>
                <input
                  type="date"
                  value={guestData.primaryGuest.dateOfBirth}
                  onChange={(e) => handleInputChange('primaryGuest', 'dateOfBirth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    errors['primaryGuest.dateOfBirth'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors['primaryGuest.dateOfBirth'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['primaryGuest.dateOfBirth']}</p>
                )}
              </div>
            </div>
            
            {/* Nationality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="h-4 w-4 inline mr-1" />
                สัญชาติ
              </label>
              <select
                value={guestData.primaryGuest.nationality}
                onChange={(e) => handleInputChange('primaryGuest', 'nationality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Thai">ไทย</option>
                <option value="American">อเมริกัน</option>
                <option value="British">อังกฤษ</option>
                <option value="Chinese">จีน</option>
                <option value="Japanese">ญี่ปุ่น</option>
                <option value="Korean">เกาหลี</option>
                <option value="Other">อื่นๆ</option>
              </select>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-900">ผู้เข้าพักเพิ่มเติม</h3>
              <p className="text-gray-600">เพิ่มข้อมูลผู้เข้าพักร่วม (หากมี)</p>
            </div>
            
            {guestData.additionalGuests.map((guest, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">ผู้เข้าพักคนที่ {index + 2}</h4>
                  <button
                    type="button"
                    onClick={() => removeAdditionalGuest(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    ลบ
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คำนำหน้า
                    </label>
                    <select
                      value={guest.title || 'Mr.'}
                      onChange={(e) => handleInputChange('additionalGuests', 'title', e.target.value, index)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Mr.">นาย</option>
                      <option value="Mrs.">นาง</option>
                      <option value="Ms.">นางสาว</option>
                      <option value="Dr.">ดร.</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ *
                    </label>
                    <input
                      type="text"
                      value={guest.firstName || ''}
                      onChange={(e) => handleInputChange('additionalGuests', 'firstName', e.target.value, index)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                        errors[`additionalGuests.${index}.firstName`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="ชื่อ"
                    />
                    {errors[`additionalGuests.${index}.firstName`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`additionalGuests.${index}.firstName`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      นามสกุล *
                    </label>
                    <input
                      type="text"
                      value={guest.lastName || ''}
                      onChange={(e) => handleInputChange('additionalGuests', 'lastName', e.target.value, index)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                        errors[`additionalGuests.${index}.lastName`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="นามสกุล"
                    />
                    {errors[`additionalGuests.${index}.lastName`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`additionalGuests.${index}.lastName`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ความสัมพันธ์ *
                    </label>
                    <select
                      value={guest.relationship || ''}
                      onChange={(e) => handleInputChange('additionalGuests', 'relationship', e.target.value, index)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                        errors[`additionalGuests.${index}.relationship`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">เลือกความสัมพันธ์</option>
                      <option value="spouse">คู่สมรส</option>
                      <option value="child">บุตร</option>
                      <option value="parent">บิดา/มารดา</option>
                      <option value="sibling">พี่น้อง</option>
                      <option value="friend">เพื่อน</option>
                      <option value="colleague">เพื่อนร่วมงาน</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                    {errors[`additionalGuests.${index}.relationship`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`additionalGuests.${index}.relationship`]}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ประเภทบัตร
                    </label>
                    <select
                      value={guest.idType || 'passport'}
                      onChange={(e) => handleInputChange('additionalGuests', 'idType', e.target.value, index)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="passport">หนังสือเดินทาง</option>
                      <option value="nationalId">บัตรประชาชน</option>
                      <option value="drivingLicense">ใบขับขี่</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลขบัตร
                    </label>
                    <input
                      type="text"
                      value={guest.idNumber || ''}
                      onChange={(e) => handleInputChange('additionalGuests', 'idNumber', e.target.value, index)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="เลขบัตรประชาชน/หนังสือเดินทาง"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addAdditionalGuest}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + เพิ่มผู้เข้าพัก
            </button>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-900">ความต้องการพิเศษ</h3>
              <p className="text-gray-600">ระบุความต้องการพิเศษของท่าน (ไม่บังคับ)</p>
            </div>
            
            {/* Dietary Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Utensils className="h-4 w-4 inline mr-1" />
                ความต้องการด้านอาหาร
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['vegetarian', 'vegan', 'halal', 'gluten-free', 'dairy-free', 'kosher'].map(diet => (
                  <label key={diet} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guestData.specialRequests.dietaryRequirements.includes(diet)}
                      onChange={() => handleInputChange('specialRequests', 'dietaryRequirements', diet)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {diet === 'vegetarian' && 'มังสวิรัติ'}
                      {diet === 'vegan' && 'วีแกน'}
                      {diet === 'halal' && 'ฮาลาล'}
                      {diet === 'gluten-free' && 'ไม่มีกลูเตน'}
                      {diet === 'dairy-free' && 'ไม่มีนม'}
                      {diet === 'kosher' && 'โคเชอร์'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Accessibility Needs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Accessibility className="h-4 w-4 inline mr-1" />
                ความต้องการด้านการเข้าถึง
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['wheelchair', 'hearing-impaired', 'vision-impaired', 'mobility-aid'].map(need => (
                  <label key={need} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guestData.specialRequests.accessibilityNeeds.includes(need)}
                      onChange={() => handleInputChange('specialRequests', 'accessibilityNeeds', need)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {need === 'wheelchair' && 'ใช้รถเข็น'}
                      {need === 'hearing-impaired' && 'บกพร่องทางการได้ยิน'}
                      {need === 'vision-impaired' && 'บกพร่องทางสายตา'}
                      {need === 'mobility-aid' && 'ใช้อุปกรณ์ช่วยเดิน'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Room Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Bed className="h-4 w-4 inline mr-1" />
                  ประเภทเตียง
                </label>
                <select
                  value={guestData.specialRequests.bedPreference}
                  onChange={(e) => handleInputChange('specialRequests', 'bedPreference', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">ไม่มีความต้องการเฉพาะ</option>
                  <option value="single">เตียงเดี่ยว</option>
                  <option value="double">เตียงคู่</option>
                  <option value="twin">เตียงแฝด</option>
                  <option value="extra-bed">เตียงเสริม</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การสูบบุหรี่
                </label>
                <select
                  value={guestData.specialRequests.smokingPreference}
                  onChange={(e) => handleInputChange('specialRequests', 'smokingPreference', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="non-smoking">ห้องปลอดบุหรี่</option>
                  <option value="smoking">ห้องสูบบุหรี่ได้</option>
                </select>
              </div>
            </div>
            
            {/* Floor Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ความต้องการด้านชั้น
              </label>
              <select
                value={guestData.specialRequests.floorPreference}
                onChange={(e) => handleInputChange('specialRequests', 'floorPreference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ไม่มีความต้องการเฉพาะ</option>
                <option value="low">ชั้นต่ำ (1-5)</option>
                <option value="middle">ชั้นกลาง (6-15)</option>
                <option value="high">ชั้นสูง (16+)</option>
              </select>
            </div>
            
            {/* Additional Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำขอเพิ่มเติม
              </label>
              <textarea
                value={guestData.specialRequests.additionalRequests}
                onChange={(e) => handleInputChange('specialRequests', 'additionalRequests', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="ระบุความต้องการพิเศษอื่นๆ เช่น ห้องมุมอาคาร, วิวทะเล, ฉลองวันเกิด..."
              />
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <AlertCircle className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-900">ข้อมูลติดต่อฉุกเฉิน</h3>
              <p className="text-gray-600">กรุณาระบุผู้ติดต่อในกรณีฉุกเฉิน</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ติดต่อฉุกเฉิน
                </label>
                <input
                  type="text"
                  value={guestData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ความสัมพันธ์
                </label>
                <select
                  value={guestData.emergencyContact.relationship}
                  onChange={(e) => handleInputChange('emergencyContact', 'relationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">เลือกความสัมพันธ์</option>
                  <option value="spouse">คู่สมรส</option>
                  <option value="parent">บิดา/มารดา</option>
                  <option value="sibling">พี่น้อง</option>
                  <option value="child">บุตร</option>
                  <option value="friend">เพื่อน</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                เบอร์โทรศัพท์ฉุกเฉิน
              </label>
              <input
                type="tel"
                value={guestData.emergencyContact.phone}
                onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="+66812345678"
              />
            </div>
            
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mt-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">สรุปข้อมูลการจอง</h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">เลขที่การจอง:</span>
                  <span className="font-medium">{bookingReference}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">ผู้เข้าพักหลัก:</span>
                  <span className="font-medium">
                    {guestData.primaryGuest.title} {guestData.primaryGuest.firstName} {guestData.primaryGuest.lastName}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">จำนวนผู้เข้าพัก:</span>
                  <span className="font-medium">{1 + guestData.additionalGuests.length} ท่าน</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">ประเภทห้อง:</span>
                  <span className="font-medium">{roomType}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">วันที่เข้าพัก:</span>
                  <span className="font-medium">{searchParams.get('checkIn')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">วันที่ออก:</span>
                  <span className="font-medium">{searchParams.get('checkOut')}</span>
                </div>
                
                <div className="flex justify-between font-semibold text-lg border-t pt-3">
                  <span>ราคารวม:</span>
                  <span className="text-blue-600">฿{parseFloat(totalAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Progress steps
  const steps = [
    { number: 1, title: 'ข้อมูลหลัก', icon: User },
    { number: 2, title: 'ผู้เข้าพักเพิ่มเติม', icon: Users },
    { number: 3, title: 'ความต้องการพิเศษ', icon: MessageSquare },
    { number: 4, title: 'ข้อมูลฉุกเฉิน', icon: AlertCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ข้อมูลผู้เข้าพัก
          </h1>
          <p className="text-gray-600">
            ขั้นตอนที่ 5: กรุณากรอกข้อมูลผู้เข้าพักให้ครบถ้วน
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium
                    ${isActive ? 'bg-blue-600 text-white' : 
                      isCompleted ? 'bg-green-600 text-white' : 
                      'bg-gray-200 text-gray-600'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <IconComponent className="h-6 w-6" />
                    )}
                  </div>
                  <div className="mt-2 text-xs text-center max-w-20">
                    <div className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      absolute top-6 w-full h-0.5 -z-10
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                    `} 
                    style={{ 
                      left: `${(100 / (steps.length - 1)) * index + (50 / (steps.length - 1))}%`,
                      width: `${100 / (steps.length - 1)}%` 
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {renderStepContent()}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`
              flex items-center px-6 py-3 rounded-lg font-medium transition-colors
              ${currentStep === 1 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-600 text-white hover:bg-gray-700'}
            `}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            ย้อนกลับ
          </button>
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ถัดไป
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`
                flex items-center px-6 py-3 rounded-lg font-medium transition-colors
                ${submitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'} 
                text-white
              `}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  บันทึกข้อมูล
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingGuest() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Loading guest information...</p>
      </div>
    </div>
  );
}

export default function GuestInformationPage() {
  return (
    <Suspense fallback={<LoadingGuest />}>
      <GuestInformationContent />
    </Suspense>
  );
}