import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User, LogOut, KeyRound, X } from 'lucide-react';
import api from '../../api/client';

const TopNav = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Generate readable title from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let pageTitle = 'Dashboard';
  if (pathSegments.length > 1) {
    const lastSegment = pathSegments[pathSegments.length - 1];
    pageTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
  } else if (pathSegments.length === 1) {
    if (pathSegments[0] === 'admin') pageTitle = 'Admin Dashboard';
    if (pathSegments[0] === 'user') pageTitle = 'User Dashboard';
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    try {
      setChangingPassword(true);
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      showToast('Password changed successfully!', 'success');
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <div className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* User Profile Badge & Dropdown */}
          <div className="relative">
            <button 
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-surface-100 transition-colors border border-transparent hover:border-surface-200"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 border border-primary-200 flex items-center justify-center font-bold text-sm">
                {user?.username?.[0]?.toUpperCase() || <User size={16} />}
              </div>
              <span className="text-sm font-semibold text-surface-800 hidden sm:inline">{user?.username}</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-surface-200 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
                <div className="px-4 py-2.5 border-b border-surface-100 bg-surface-50 rounded-t-xl">
                  <p className="text-sm font-bold text-surface-900 truncate">{user?.username}</p>
                  <p className="text-xs text-surface-500 font-medium capitalize mt-0.5">{user?.role} Account</p>
                </div>
                
                <button
                  onClick={() => { setPasswordModalOpen(true); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 hover:text-primary-600 flex items-center gap-2.5 transition-colors"
                >
                  <KeyRound size={16} className="text-surface-400" /> Change Password
                </button>

                <div className="border-t border-surface-100 my-1"></div>

                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-surface-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-surface-200 w-full max-w-md p-6 animate-fade-in relative">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary-50 text-primary-600 rounded-xl border border-primary-100">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-surface-900">Change Password</h3>
                  <p className="text-xs text-surface-500">Update security credentials for {user?.username}</p>
                </div>
              </div>
              <button 
                onClick={() => setPasswordModalOpen(false)}
                className="text-surface-400 hover:text-surface-700 p-1 rounded-lg hover:bg-surface-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="input-field text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="btn-primary text-sm px-5"
                >
                  {changingPassword ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;
