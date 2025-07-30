import React, { useState, useEffect, useContext } from 'react';
import { Users, UserCheck, UserX, Crown, GraduationCap, User as UserIcon } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { useNotificationContext } from '../contexts/NotificationContext';
import { ConfirmationContext, ConfirmationContextType } from '../contexts/ConfirmationContext';
import apiService from '../services/api';
import { motion } from 'framer-motion';

// Define types for our state and data
type UserRole = 'student' | 'teacher' | 'admin';

interface User {
  uid: string;
  email: string;
  role: UserRole;
}

const UserManagementView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useNotificationContext();
  const confirmationContext = useContext<ConfirmationContextType | undefined>(ConfirmationContext);

  if (!confirmationContext) {
    throw new Error('UserManagementView must be used within a ConfirmationProvider');
  }

  const { confirm } = confirmationContext;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch {
      showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, currentRole: UserRole, newRole: UserRole) => {
    const roleLabels = { student: 'Student', teacher: 'Teacher', admin: 'Admin' };
    const confirmed = await confirm({
      title: 'Change User Role',
      message: `Are you sure you want to change this user's role from ${roleLabels[currentRole]} to ${roleLabels[newRole]}?`,
      confirmText: 'Change Role',
    });

    if (confirmed) {
      try {
        await apiService.setUserRole(userId, newRole);
        showSuccess(`User role updated to ${roleLabels[newRole]}`);
        fetchUsers();
      } catch {
        showError('Failed to update user role');
      }
    }
  };

  const getRoleIcon = (role: UserRole) => {
    const icons = { admin: Crown, teacher: GraduationCap, student: UserIcon };
    return icons[role] || UserIcon;
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-purple-500/10 text-purple-400',
      teacher: 'bg-green-500/10 text-green-400',
      student: 'bg-blue-500/10 text-blue-400',
    };
    return colors[role] || 'bg-gray-500/10 text-gray-400';
  };

  const getStats = () => ({
    totalUsers: users.length,
    adminCount: users.filter(u => u.role === 'admin').length,
    teacherCount: users.filter(u => u.role === 'teacher').length,
    studentCount: users.filter(u => u.role === 'student').length,
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner text="Loading users..." /></div>;
  }

  const stats = getStats();
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
        <StatCard title="Admins" value={stats.adminCount} icon={Crown} color="purple" />
        <StatCard title="Teachers" value={stats.teacherCount} icon={GraduationCap} color="green" />
        <StatCard title="Students" value={stats.studentCount} icon={UserIcon} color="cyan" />
      </motion.div>

      <div className="bg-gray-900/30 border border-white/10 rounded-xl backdrop-blur-lg">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white font-heading">User Management</h2>
          <p className="text-gray-400 mt-1 font-body">Manage user roles and permissions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Current Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={containerVariants}>
              {users.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <motion.tr key={user.uid} className="border-b border-white/10 hover:bg-gray-800/40 transition-colors" variants={itemVariants}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${getRoleColor(user.role)}`}><RoleIcon className="w-4 h-4" /></div>
                        <div>
                          <div className="text-sm font-medium text-gray-200 font-mono">{user.email}</div>
                          <div className="text-sm text-gray-500 font-mono">ID: {user.uid.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {user.role === 'student' && (
                          <button aria-label={`Promote ${user.email} to teacher`} onClick={() => handleRoleChange(user.uid, user.role, 'teacher')} className="flex items-center px-3 py-1 text-sm text-green-400 hover:text-white hover:bg-green-500/20 rounded-md transition-colors font-mono">
                            <UserCheck className="w-4 h-4 mr-1" /> Promote
                          </button>
                        )}
                        {user.role === 'teacher' && (
                          <button aria-label={`Demote ${user.email} to student`} onClick={() => handleRoleChange(user.uid, user.role, 'student')} className="flex items-center px-3 py-1 text-sm text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-md transition-colors font-mono">
                            <UserX className="w-4 h-4 mr-1" /> Demote
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default UserManagementView;
