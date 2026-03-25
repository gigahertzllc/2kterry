import { useState, useEffect } from 'react';
import { UserPlus, KeyRound, Mail, User, Lock, Trash2, Database, Download, Wrench, CheckCircle } from 'lucide-react';
import * as api from '../../utils/api';

export function SettingsTab() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  // Create admin form
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Reset password form
  const [resetForm, setResetForm] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isMigrating, setIsMigrating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState(false);
  const [isFixingStorage, setIsFixingStorage] = useState(false);
  const [storageStatus, setStorageStatus] = useState<any>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const result = await api.getAdmins();
      setAdmins(result.admins);
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (createForm.password !== createForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (createForm.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await api.adminSignup(createForm.email, createForm.password, createForm.name);
      setSuccess('Admin account created successfully!');
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
      loadAdmins();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create admin');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (resetForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await api.resetAdminPassword(resetForm.email, resetForm.newPassword);
      setSuccess('Password reset successfully!');
      setShowResetModal(false);
      setResetForm({ email: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset password');
    }
  };

  const handleOpenResetModal = (admin: any) => {
    setSelectedAdmin(admin);
    setResetForm({ ...resetForm, email: admin.email });
    setShowResetModal(true);
  };

  const handleMigrateProducts = async () => {
    setIsMigrating(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.migrateToPublicUrls();
      setSuccess(result.message);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to migrate products');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExportProducts = async () => {
    setIsExporting(true);
    setError('');

    try {
      const backup = await api.exportProducts();
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `2kterrysmods-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Products exported successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export products');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCheckStorage = async () => {
    setIsCheckingStorage(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.checkStorage();
      setStorageStatus(result);
      
      if (result.imagesBucket?.public) {
        setSuccess('Storage is configured correctly! Images bucket is PUBLIC.');
      } else {
        setError('Images bucket is NOT public. Click "Fix Storage" to repair it.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check storage');
    } finally {
      setIsCheckingStorage(false);
    }
  };

  const handleFixStorage = async () => {
    setIsFixingStorage(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.fixStorage();
      setSuccess(result.message + ' Refreshing page...');
      
      // Reload the page after 2 seconds to see the fixed images
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fix storage');
    } finally {
      setIsFixingStorage(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl mb-2">Admin Settings</h2>
          <p className="text-gray-400">Manage administrator accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-3"
        >
          <UserPlus className="w-5 h-5" />
          <span>Create Admin Account</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Admin Accounts Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3>Administrator Accounts</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Name</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Email</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Role</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Created</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No admin accounts found
                  </td>
                </tr>
              ) : (
                admins.map((admin, index) => (
                  <tr 
                    key={admin.id}
                    className={`${index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div>{admin.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{admin.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-400">
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenResetModal(admin)}
                        className="p-2 hover:bg-yellow-500/20 rounded-lg transition-colors group"
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4 text-gray-400 group-hover:text-yellow-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Tools */}
      <div className="mt-12 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3>Database Tools</h3>
          <p className="text-gray-400 text-sm mt-2">Manage product database and backups</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div>
              <h4 className="mb-1">Fix Product Images</h4>
              <p className="text-gray-400 text-sm">
                Migrate existing products to use permanent public URLs
              </p>
            </div>
            <button
              onClick={handleMigrateProducts}
              disabled={isMigrating}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-900 disabled:to-pink-900 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>{isMigrating ? 'Migrating...' : 'Fix Images'}</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div>
              <h4 className="mb-1">Export Products Backup</h4>
              <p className="text-gray-400 text-sm">
                Download all products and games as JSON backup file
              </p>
            </div>
            <button
              onClick={handleExportProducts}
              disabled={isExporting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Backup'}</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div>
              <h4 className="mb-1">Check Storage</h4>
              <p className="text-gray-400 text-sm">
                Verify the integrity of the storage system
              </p>
            </div>
            <button
              onClick={handleCheckStorage}
              disabled={isCheckingStorage}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-900 disabled:to-pink-900 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              <span>{isCheckingStorage ? 'Checking...' : 'Check Storage'}</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div>
              <h4 className="mb-1">Fix Storage</h4>
              <p className="text-gray-400 text-sm">
                Attempt to fix any issues in the storage system
              </p>
            </div>
            <button
              onClick={handleFixStorage}
              disabled={isFixingStorage}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-900 disabled:to-pink-900 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isFixingStorage ? 'Fixing...' : 'Fix Storage'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-purple-500/20 max-w-md w-full">
            <div className="relative bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-8 border-b border-purple-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h2>Create Admin Account</h2>
              </div>
              <p className="text-gray-400 text-sm">Add a new administrator to the system</p>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="admin@2kterrysmods.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Min. 8 characters"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
                    setError('');
                  }}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-purple-500/20 max-w-md w-full">
            <div className="relative bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-8 border-b border-yellow-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2>Reset Password</h2>
              </div>
              <p className="text-gray-400 text-sm">Set a new password for {selectedAdmin?.name}</p>
            </div>

            <form onSubmit={handleResetPassword} className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={resetForm.email}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-gray-400"
                    disabled
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Min. 8 characters"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={resetForm.confirmPassword}
                    onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetForm({ email: '', newPassword: '', confirmPassword: '' });
                    setError('');
                    setSelectedAdmin(null);
                  }}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}