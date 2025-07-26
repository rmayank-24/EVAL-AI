import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Crown, GraduationCap, User } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import apiService from '../services/api';

const UserManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useNotification();
  const { confirm } = useConfirmation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, currentRole, newRole) => {
    const roleLabels = {
      student: 'Student',
      teacher: 'Teacher',
      admin: 'Admin'
    };

    const confirmed = await confirm({
      title: 'Change User Role',
      message: `Are you sure you want to change this user's role from ${roleLabels[currentRole]} to ${roleLabels[newRole]}?`,
      confirmText: 'Change Role',
      isDestructive: false,
    });

    if (confirmed) {
      try {
        await apiService.setUserRole(userId, newRole);
        showSuccess(`User role updated to ${roleLabels[newRole]}`);
        fetchUsers();
      } catch (error) {
        showError('Failed to update user role');
      }
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Crown;
      case 'teacher': return GraduationCap;
      case 'student': return User;
      default: return User;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'teacher': return 'bg-green-100 text-green-800 border-green-200';
      case 'student': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStats = () => {
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const teacherCount = users.filter(u => u.role === 'teacher').length;
    const studentCount = users.filter(u => u.role === 'student').length;

    return { totalUsers, adminCount, teacherCount, studentCount };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading users..." />
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Admins"
          value={stats.adminCount}
          icon={Crown}
          color="purple"
        />
        <StatCard
          title="Teachers"
          value={stats.teacherCount}
          icon={GraduationCap}
          color="green"
        />
        <StatCard
          title="Students"
          value={stats.studentCount}
          icon={User}
          color="teal"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${getRoleColor(user.role)}`}>
                          <RoleIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.uid.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {user.role === 'student' && (
                          <button
                            onClick={() => handleRoleChange(user.uid, user.role, 'teacher')}
                            className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Promote to Teacher
                          </button>
                        )}
                        {user.role === 'teacher' && (
                          <button
                            onClick={() => handleRoleChange(user.uid, user.role, 'student')}
                            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Demote to Student
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementView;