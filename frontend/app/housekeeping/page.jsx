'use client';

import { useState, useEffect } from 'react';
import { housekeepingAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const TaskPriorityBadge = ({ priority }) => {
  const priorityConfig = {
    urgent: { color: 'bg-red-100 text-red-800', text: '🚨 เร่งด่วน', icon: '🔴' },
    high: { color: 'bg-orange-100 text-orange-800', text: '⚠️ สำคัญ', icon: '🟠' },
    normal: { color: 'bg-blue-100 text-blue-800', text: '📋 ปกติ', icon: '🔵' },
    low: { color: 'bg-gray-100 text-gray-800', text: '📝 ต่ำ', icon: '⚪' }
  };

  const config = priorityConfig[priority] || priorityConfig.normal;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </span>
  );
};

const TaskStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', text: '⏳ รอดำเนินการ', icon: '🟡' },
    in_progress: { color: 'bg-blue-100 text-blue-800', text: '🔄 กำลังทำ', icon: '🔵' },
    completed: { color: 'bg-green-100 text-green-800', text: '✅ เสร็จสิ้น', icon: '🟢' },
    cancelled: { color: 'bg-red-100 text-red-800', text: '❌ ยกเลิก', icon: '🔴' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </span>
  );
};

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assigned_to: 'all'
  });

  const [taskForm, setTaskForm] = useState({
    roomId: '',
    taskType: 'cleaning',
    priority: 'normal',
    description: '',
    assignedTo: '',
    estimatedDuration: '',
    specialInstructions: ''
  });

  const [updateForm, setUpdateForm] = useState({
    status: '',
    completionNotes: '',
    actualDuration: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await housekeepingAPI.getTasks(filters);
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await housekeepingAPI.getStats();
      setStats(response.stats || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await housekeepingAPI.createTask(taskForm);
      
      if (response.success) {
        toast.success('สร้างงาน housekeeping สำเร็จ');
        setShowCreateModal(false);
        fetchTasks();
        fetchStats();
        // Reset form
        setTaskForm({
          roomId: '',
          taskType: 'cleaning',
          priority: 'normal',
          description: '',
          assignedTo: '',
          estimatedDuration: '',
          specialInstructions: ''
        });
      } else {
        toast.error(response.error || 'เกิดข้อผิดพลาดในการสร้างงาน');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างงาน');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    
    if (!selectedTask) return;

    try {
      setLoading(true);
      
      const response = await housekeepingAPI.updateTask(selectedTask.id, updateForm);
      
      if (response.success) {
        toast.success('อัปเดตงานสำเร็จ');
        setShowTaskModal(false);
        fetchTasks();
        fetchStats();
        setSelectedTask(null);
      } else {
        toast.error(response.error || 'เกิดข้อผิดพลาดในการอัปเดตงาน');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตงาน');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setUpdateForm({
      status: task.status,
      completionNotes: task.completion_notes || '',
      actualDuration: task.actual_duration || ''
    });
    setShowTaskModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่มีข้อมูล';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTaskTypeIcon = (type) => {
    const icons = {
      cleaning: '🧹',
      maintenance: '🔧',
      inspection: '🔍',
      laundry: '👔',
      restocking: '📦'
    };
    return icons[type] || '📋';
  };

  const getTaskTypeName = (type) => {
    const names = {
      cleaning: 'ทำความสะอาด',
      maintenance: 'ซ่อมแซม',
      inspection: 'ตรวจสอบ',
      laundry: 'ซักรีด',
      restocking: 'เติมของใช้'
    };
    return names[type] || 'งานทั่วไป';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🧹 Housekeeping Management</h1>
        <p className="text-gray-600">จัดการงานทำความสะอาดและดูแลห้องพัก</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total_tasks || 0}</div>
          <div className="text-sm text-gray-600">📋 งานทั้งหมด</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending_tasks || 0}</div>
          <div className="text-sm text-yellow-700">⏳ รอดำเนินการ</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.in_progress_tasks || 0}</div>
          <div className="text-sm text-blue-700">🔄 กำลังทำ</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed_tasks || 0}</div>
          <div className="text-sm text-green-700">✅ เสร็จสิ้น</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.urgent_tasks || 0}</div>
          <div className="text-sm text-red-700">🚨 เร่งด่วน</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.available_rooms || 0}</div>
          <div className="text-sm text-purple-700">🏠 ห้องพร้อม</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">🔍 สถานะทั้งหมด</option>
              <option value="pending">⏳ รอดำเนินการ</option>
              <option value="in_progress">🔄 กำลังทำ</option>
              <option value="completed">✅ เสร็จสิ้น</option>
              <option value="cancelled">❌ ยกเลิก</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">📊 ความสำคัญทั้งหมด</option>
              <option value="urgent">🚨 เร่งด่วน</option>
              <option value="high">⚠️ สำคัญ</option>
              <option value="normal">📋 ปกติ</option>
              <option value="low">📝 ต่ำ</option>
            </select>

            <select
              value={filters.assigned_to}
              onChange={(e) => setFilters({...filters, assigned_to: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">👥 ผู้รับผิดชอบทั้งหมด</option>
              <option value="unassigned">❓ ยังไม่มอบหมาย</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={fetchTasks}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? '🔄 กำลังโหลด...' : '🔄 รีเฟรช'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              ➕ สร้างงานใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
          <h2 className="text-xl font-semibold">📋 รายการงาน Housekeeping ({tasks.length})</h2>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">🧹</div>
            <h3 className="text-xl font-semibold mb-2">ไม่มีงานในระบบ</h3>
            <p>เริ่มต้นด้วยการสร้างงาน housekeeping ใหม่</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getTaskTypeIcon(task.task_type)}</span>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {getTaskTypeName(task.task_type)} - {task.room_name}
                      </h3>
                      <TaskPriorityBadge priority={task.priority} />
                      <TaskStatusBadge status={task.status} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">🏠 ห้อง:</span> {task.room_name}
                        <br />
                        <span className="text-gray-500">({task.room_type})</span>
                      </div>
                      <div>
                        <span className="font-medium">👤 ผู้สร้าง:</span> {task.created_by_name || 'ไม่ระบุ'}
                        <br />
                        <span className="font-medium">👷 ผู้รับผิดชอบ:</span> {task.assigned_to_name || 'ยังไม่มอบหมาย'}
                      </div>
                      <div>
                        <span className="font-medium">📅 สร้างเมื่อ:</span> {formatDate(task.created_at)}
                        {task.estimated_duration && (
                          <>
                            <br />
                            <span className="font-medium">⏱️ เวลาโดยประมาณ:</span> {task.estimated_duration} นาที
                          </>
                        )}
                      </div>
                      <div>
                        {task.started_at && (
                          <>
                            <span className="font-medium">🚀 เริ่มเมื่อ:</span> {formatDate(task.started_at)}
                            <br />
                          </>
                        )}
                        {task.completed_at && (
                          <>
                            <span className="font-medium">✅ เสร็จเมื่อ:</span> {formatDate(task.completed_at)}
                          </>
                        )}
                      </div>
                    </div>

                    {task.description && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">📝 รายละเอียด:</span>
                        <div className="text-gray-600 mt-1">{task.description}</div>
                      </div>
                    )}

                    {task.special_instructions && (
                      <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium text-yellow-800">⚠️ คำแนะนำพิเศษ:</span>
                        <div className="text-yellow-700 mt-1">{task.special_instructions}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Update Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
              <h2 className="text-2xl font-bold">
                {getTaskTypeIcon(selectedTask.task_type)} {getTaskTypeName(selectedTask.task_type)}
              </h2>
              <p className="mt-1 text-purple-100">
                {selectedTask.room_name} | สร้างโดย {selectedTask.created_by_name}
              </p>
            </div>

            <form onSubmit={handleUpdateTask} className="p-6 space-y-6">
              {/* Task Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">📋 ข้อมูลงาน</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">🏠 ห้อง:</span> {selectedTask.room_name} ({selectedTask.room_type})
                  </div>
                  <div>
                    <span className="font-medium">📅 สร้างเมื่อ:</span> {formatDate(selectedTask.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">👷 ผู้รับผิดชอบ:</span> {selectedTask.assigned_to_name || 'ยังไม่มอบหมาย'}
                  </div>
                  <div>
                    <span className="font-medium">⏱️ เวลาโดยประมาณ:</span> {selectedTask.estimated_duration || 'ไม่ระบุ'} นาที
                  </div>
                </div>
                {selectedTask.description && (
                  <div className="mt-3">
                    <span className="font-medium">📝 รายละเอียด:</span>
                    <div className="text-gray-600 mt-1">{selectedTask.description}</div>
                  </div>
                )}
              </div>

              {/* Update Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะงาน *
                </label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="pending">⏳ รอดำเนินการ</option>
                  <option value="in_progress">🔄 กำลังทำ</option>
                  <option value="completed">✅ เสร็จสิ้น</option>
                  <option value="cancelled">❌ ยกเลิก</option>
                </select>
              </div>

              {/* Completion Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุการทำงาน
                </label>
                <textarea
                  value={updateForm.completionNotes}
                  onChange={(e) => setUpdateForm({...updateForm, completionNotes: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="บันทึกรายละเอียดการทำงาน..."
                />
              </div>

              {/* Actual Duration */}
              {updateForm.status === 'completed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เวลาที่ใช้จริง (นาที)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={updateForm.actualDuration}
                    onChange={(e) => setUpdateForm({...updateForm, actualDuration: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="เช่น 30"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  ❌ ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? '⏳ กำลังอัปเดต...' : '✅ บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
              <h2 className="text-2xl font-bold">➕ สร้างงาน Housekeeping ใหม่</h2>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏠 หมายเลขห้อง *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={taskForm.roomId}
                    onChange={(e) => setTaskForm({...taskForm, roomId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="เช่น 101"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📋 ประเภทงาน *
                  </label>
                  <select
                    value={taskForm.taskType}
                    onChange={(e) => setTaskForm({...taskForm, taskType: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="cleaning">🧹 ทำความสะอาด</option>
                    <option value="maintenance">🔧 ซ่อมแซม</option>
                    <option value="inspection">🔍 ตรวจสอบ</option>
                    <option value="laundry">👔 ซักรีด</option>
                    <option value="restocking">📦 เติมของใช้</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📊 ระดับความสำคัญ
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="low">📝 ต่ำ</option>
                    <option value="normal">📋 ปกติ</option>
                    <option value="high">⚠️ สำคัญ</option>
                    <option value="urgent">🚨 เร่งด่วน</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏱️ เวลาโดยประมาณ (นาที)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={taskForm.estimatedDuration}
                    onChange={(e) => setTaskForm({...taskForm, estimatedDuration: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="เช่น 30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 รายละเอียดงาน *
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="อธิบายรายละเอียดงาน..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⚠️ คำแนะนำพิเศษ
                </label>
                <textarea
                  value={taskForm.specialInstructions}
                  onChange={(e) => setTaskForm({...taskForm, specialInstructions: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="คำแนะนำพิเศษหรือข้อควรระวัง..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  ❌ ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? '⏳ กำลังสร้าง...' : '✅ สร้างงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
