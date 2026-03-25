import { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, User, X } from 'lucide-react';
import * as api from '../../utils/api';

export function CustomersTab() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const result = await api.getCustomers();
      setCustomers(result.customers);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await api.createCustomer(formData.name, formData.email, formData.phone);
      setSuccess('Customer created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', phone: '' });
      loadCustomers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create customer');
    }
  };

  const totalRevenue = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);
  const totalOrders = customers.reduce((sum, customer) => sum + (customer.totalOrders || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl mb-2">Customer Management</h2>
          <p className="text-gray-400">View and manage your customer database</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-3"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Total Customers</span>
          </div>
          <div className="text-3xl">{customers.length}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-400">Total Orders</span>
          </div>
          <div className="text-3xl">{totalOrders}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-400">Total Revenue</span>
          </div>
          <div className="text-3xl">${totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3>Customer Database</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Customer</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Email</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Phone</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Orders</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Total Spent</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No customers yet. Add your first customer!
                  </td>
                </tr>
              ) : (
                customers.map((customer, index) => (
                  <tr 
                    key={customer.id}
                    className={`${index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-orange-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div>{customer.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{customer.email}</td>
                    <td className="px-6 py-4 text-gray-400">{customer.phone || '-'}</td>
                    <td className="px-6 py-4">{customer.totalOrders || 0}</td>
                    <td className="px-6 py-4 text-green-400">${(customer.totalSpent || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-orange-500/20 max-w-md w-full">
            <div className="relative bg-gradient-to-br from-orange-500/20 to-orange-500/20 p-8 border-b border-orange-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h2>Add New Customer</h2>
              </div>
              <p className="text-gray-400 text-sm">Add a new customer to the database</p>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-8">
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  Add Customer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', email: '', phone: '' });
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
    </div>
  );
}
