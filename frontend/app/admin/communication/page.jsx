'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslation } from '../../../translations';
import { isStaffOrAdmin } from '../../../lib/roles';
import { MessageCircle, Send, Phone, Mail, Clock, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GuestCommunication() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isAuthenticated && isStaffOrAdmin(user)) {
      loadConversations();
    }
  }, [isAuthenticated, user]);

  const loadConversations = async () => {
    try {
      // Mock data for now - จะเชื่อมต่อ API ภายหลัง
      const mockData = [
        {
          id: 1,
          guestName: 'คุณสมชาย ใจดี',
          roomNumber: '201',
          bookingReference: 'BK2025001',
          status: 'active',
          lastMessage: 'ขอผ้าเช็ดตัวเพิ่มได้ไหมครับ',
          lastMessageTime: '2025-08-25 14:30',
          unreadCount: 2,
          phone: '081-234-5678',
          email: 'somchai@email.com',
          checkIn: '2025-08-24',
          checkOut: '2025-08-26',
          messages: [
            {
              id: 1,
              sender: 'guest',
              message: 'สวัสดีครับ อยากขอผ้าเช็ดตัวเพิ่ม 2 ผืนครับ',
              timestamp: '2025-08-25 14:00',
              read: true
            },
            {
              id: 2,
              sender: 'staff',
              message: 'สวัสดีค่ะ คุณสมชาย เราจะจัดส่งผ้าเช็ดตัวให้ภายใน 15 นาทีนะคะ',
              timestamp: '2025-08-25 14:05',
              read: true
            },
            {
              id: 3,
              sender: 'guest',
              message: 'ขอบคุณครับ แล้วขอน้ำดื่มเพิ่มด้วยครับ',
              timestamp: '2025-08-25 14:30',
              read: false
            }
          ]
        },
        {
          id: 2,
          guestName: 'คุณมาลี สวยงาม',
          roomNumber: '305',
          bookingReference: 'BK2025002',
          status: 'active',
          lastMessage: 'ขอบคุณมากค่ะ',
          lastMessageTime: '2025-08-25 13:45',
          unreadCount: 0,
          phone: '082-345-6789',
          email: 'malee@email.com',
          checkIn: '2025-08-25',
          checkOut: '2025-08-27',
          messages: [
            {
              id: 1,
              sender: 'guest',
              message: 'ห้องครัวมีเครื่องใช้ครบไหมคะ',
              timestamp: '2025-08-25 13:00',
              read: true
            },
            {
              id: 2,
              sender: 'staff',
              message: 'มีครบทุกอย่างค่ะ มีเตาไมโครเวฟ กาต้มน้ำ และตู้เย็นเล็กด้วยค่ะ',
              timestamp: '2025-08-25 13:15',
              read: true
            },
            {
              id: 3,
              sender: 'guest',
              message: 'ขอบคุณมากค่ะ',
              timestamp: '2025-08-25 13:45',
              read: true
            }
          ]
        }
      ];
      
      setConversations(mockData);
      setSelectedConversation(mockData[0]);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลการสนทนาได้');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const newMsg = {
      id: Date.now(),
      sender: 'staff',
      message: newMessage.trim(),
      timestamp: new Date().toLocaleString('th-TH'),
      read: true
    };

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMsg],
      lastMessage: newMessage.trim(),
      lastMessageTime: newMsg.timestamp
    };

    setSelectedConversation(updatedConversation);
    setConversations(convs => 
      convs.map(conv => 
        conv.id === selectedConversation.id ? updatedConversation : conv
      )
    );
    setNewMessage('');
    toast.success('ส่งข้อความแล้ว');
  };

  const getFilteredConversations = () => {
    switch (activeTab) {
      case 'unread':
        return conversations.filter(conv => conv.unreadCount > 0);
      case 'active':
        return conversations.filter(conv => conv.status === 'active');
      default:
        return conversations;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">กำลังโหลดการสนทนา...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600 dark:text-gray-400">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <MessageCircle className="h-8 w-8 mr-3 text-primary-600" />
            สื่อสารกับแขก
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            แชทและตอบคำถามของแขกที่เข้าพัก
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex">
                  {[
                    { key: 'all', label: 'ทั้งหมด', count: conversations.length },
                    { key: 'unread', label: 'ยังไม่อ่าน', count: conversations.filter(c => c.unreadCount > 0).length },
                    { key: 'active', label: 'กำลังพัก', count: conversations.filter(c => c.status === 'active').length }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 ${
                        activeTab === tab.key
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {getFilteredConversations().map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedConversation?.id === conversation.id ? 'bg-primary-50 dark:bg-primary-900' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {conversation.guestName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ห้อง {conversation.roomNumber}
                          </p>
                        </div>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {conversation.lastMessageTime}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-10 w-10 text-gray-400 mr-3" />
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                          {selectedConversation.guestName}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ห้อง {selectedConversation.roomNumber} • {selectedConversation.bookingReference}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Phone className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Mail className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Guest Info */}
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">เช็คอิน:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{selectedConversation.checkIn}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">เช็คเอาท์:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{selectedConversation.checkOut}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">โทร:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{selectedConversation.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">อีเมล:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{selectedConversation.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'staff' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'staff'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p>{message.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${
                            message.sender === 'staff' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {message.timestamp}
                          </p>
                          {message.sender === 'staff' && message.read && (
                            <CheckCircle className="h-3 w-3 text-primary-100" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="พิมพ์ข้อความ..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    เลือกการสนทนา
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    เลือกแขกจากรายการเพื่อเริ่มการสนทนา
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
