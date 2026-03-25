import { useState, useEffect } from 'react';
import { Plus, Package, User, Mail, DollarSign, Clock } from 'lucide-react';
import { SkinPack } from '../../types';
import * as api from '../../utils/api';

interface OrdersTabProps {
  skinPacks: SkinPack[];
}

export function OrdersTab({ skinPacks }: OrdersTabProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    skinPackId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersResult, customersResult] = await Promise.all([
        api.getOrders(),
        api.getCustomers(),
      ]);
      setOrders(ordersResult.orders);
      setCustomers(customersResult.customers);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const customer = customers.find(c => c.id === formData.customerId);
    const skinPack = skinPacks.find(sp => sp.id === formData.skinPackId);

    if (!customer || !skinPack) {
      setError('Please select both customer and skin pack');
      return;
    }

    try {
      await api.createOrder({
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        skinPackId: skinPack.id,
        skinPackName: skinPack.name,
        amount: skinPack.price,
      });
      
      setSuccess('Order created successfully!');
      setShowCreateModal(false);
      setFormData({ customerId: '', skinPackId: '' });
      loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create order');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl mb-2">Order Management</h2>
          <p className="text-gray-400">Track and manage customer orders</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          <span>Create Order</span>
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Total Orders</span>
          </div>
          <div className="text-3xl">{orders.length}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-400">Completed</span>
          </div>
          <div className="text-3xl text-green-400">{completedOrders}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Pending</span>
          </div>
          <div className="text-3xl text-yellow-400">{pendingOrders}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-400">Total Revenue</span>
          </div>
          <div className="text-3xl">${totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3>Order History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Order ID</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Customer</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Skin Pack</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Amount</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No orders yet. Create your first order!
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr 
                    key={order.id}
                    className={`${index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-400">{order.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="mb-1">{order.customerName}</div>
                        <div className="text-xs text-gray-400">{order.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{order.skinPackName}</td>
                    <td className="px-6 py-4 text-green-400">${order.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className={`px-3 py-1 border rounded-full text-xs cursor-pointer bg-slate-800 ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-orange-500/20 max-w-md w-full">
            <div className="relative bg-gradient-to-br from-orange-500/20 to-orange-500/20 p-8 border-b border-orange-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <h2>Create New Order</h2>
              </div>
              <p className="text-gray-400 text-sm">Process a new customer order</p>
            </div>

            <form onSubmit={handleCreateOrder} className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Customer</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Skin Pack</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <select
                    value={formData.skinPackId}
                    onChange={(e) => setFormData({ ...formData, skinPackId: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  >
                    <option value="">Select a skin pack</option>
                    {skinPacks.map((skinPack) => (
                      <option key={skinPack.id} value={skinPack.id}>
                        {skinPack.name} - ${skinPack.price}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.skinPackId && (
                <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Order Total</div>
                  <div className="text-2xl text-orange-400">
                    ${skinPacks.find(sp => sp.id === formData.skinPackId)?.price.toFixed(2)}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  Create Order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ customerId: '', skinPackId: '' });
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
