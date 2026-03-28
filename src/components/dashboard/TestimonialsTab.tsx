import { useState, useEffect } from 'react';
import { Plus, Star, Trash2, CheckCircle2, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { Testimonial } from '../../types';
import * as api from '../../utils/api';
import { toast } from 'sonner';

export function TestimonialsTab() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    gamertag: '',
    content: '',
    rating: 5,
    featured: false,
    approved: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    setIsLoading(true);
    try {
      const result = await api.getTestimonials();
      setTestimonials(result.testimonials);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      toast.error('Failed to load testimonials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName.trim() || !formData.content.trim()) {
      setError('Customer name and content are required');
      return;
    }

    try {
      const newTestimonial: Omit<Testimonial, 'id'> = {
        customerName: formData.customerName,
        gamertag: formData.gamertag || undefined,
        content: formData.content,
        rating: formData.rating,
        featured: formData.featured,
        approved: formData.approved,
        createdAt: new Date().toISOString(),
      };

      await api.createTestimonial(newTestimonial);
      toast.success('Testimonial created successfully!');
      setShowCreateModal(false);
      setFormData({
        customerName: '',
        gamertag: '',
        content: '',
        rating: 5,
        featured: false,
        approved: false,
      });
      loadTestimonials();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create testimonial';
      setError(message);
      toast.error(message);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await api.updateTestimonial(id, { approved: !approved });
      setTestimonials(
        testimonials.map((t) =>
          t.id === id ? { ...t, approved: !approved } : t
        )
      );
      toast.success(approved ? 'Testimonial rejected' : 'Testimonial approved');
    } catch (error) {
      toast.error('Failed to update testimonial');
    }
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      await api.updateTestimonial(id, { featured: !featured });
      setTestimonials(
        testimonials.map((t) =>
          t.id === id ? { ...t, featured: !featured } : t
        )
      );
      toast.success(featured ? 'Removed from featured' : 'Added to featured');
    } catch (error) {
      toast.error('Failed to update testimonial');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }

    try {
      await api.deleteTestimonial(id);
      setTestimonials(testimonials.filter((t) => t.id !== id));
      toast.success('Testimonial deleted');
    } catch (error) {
      toast.error('Failed to delete testimonial');
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <button
        key={i}
        type={interactive ? 'button' : 'button'}
        disabled={!interactive}
        onClick={() => interactive && onRate?.(i + 1)}
        className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <Star
          className={`w-4 h-4 ${
            i < rating
              ? 'fill-orange-400 text-orange-400'
              : 'text-slate-600'
          } ${interactive ? 'hover:text-orange-400 transition-colors' : ''}`}
        />
      </button>
    ));
  };

  const approvedCount = testimonials.filter((t) => t.approved).length;
  const pendingCount = testimonials.filter((t) => !t.approved).length;
  const averageRating =
    testimonials.length > 0
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl mb-2">Testimonials Management</h2>
          <p className="text-gray-400">Manage and moderate customer testimonials</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          <span>Add Testimonial</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Total Testimonials</span>
          </div>
          <div className="text-3xl">{testimonials.length}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Approved</span>
          </div>
          <div className="text-3xl text-green-400">{approvedCount}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-400">Pending</span>
          </div>
          <div className="text-3xl text-yellow-400">{pendingCount}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
            <span className="text-sm text-gray-400">Average Rating</span>
          </div>
          <div className="text-3xl text-orange-400">{averageRating}</div>
        </div>
      </div>

      {/* Testimonials Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3>Testimonials</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Customer</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Content</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Rating</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Status</th>
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
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No testimonials yet. Add your first testimonial!
                  </td>
                </tr>
              ) : (
                testimonials.map((testimonial, index) => (
                  <tr
                    key={testimonial.id}
                    className={`${
                      index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'
                    } hover:bg-slate-800/50 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">
                          {testimonial.customerName}
                        </div>
                        {testimonial.gamertag && (
                          <div className="text-xs text-orange-400">
                            @{testimonial.gamertag}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300 max-w-md truncate">
                        {testimonial.content}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < testimonial.rating
                                ? 'fill-orange-400 text-orange-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs border ${
                              testimonial.approved
                                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                            }`}
                          >
                            {testimonial.approved ? 'Approved' : 'Pending'}
                          </span>
                          {testimonial.featured && (
                            <span className="px-3 py-1 rounded-full text-xs bg-orange-500/20 border border-orange-500/30 text-orange-400">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleApprove(testimonial.id, testimonial.approved || false)
                          }
                          className={`p-2 rounded-lg transition-all ${
                            testimonial.approved
                              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                              : 'bg-slate-800 hover:bg-slate-700 text-gray-400'
                          }`}
                          title={
                            testimonial.approved ? 'Reject' : 'Approve'
                          }
                        >
                          {testimonial.approved ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 opacity-50" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            handleToggleFeatured(testimonial.id, testimonial.featured || false)
                          }
                          className={`p-2 rounded-lg transition-all ${
                            testimonial.featured
                              ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                              : 'bg-slate-800 hover:bg-slate-700 text-gray-400'
                          }`}
                          title={testimonial.featured ? 'Unfeature' : 'Feature'}
                        >
                          {testimonial.featured ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(testimonial.id)}
                          className="p-2 bg-slate-800 hover:bg-red-500/20 rounded-lg transition-all text-gray-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Testimonial Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-orange-500/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-br from-orange-500/20 to-orange-500/20 p-8 border-b border-orange-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <h2>Add New Testimonial</h2>
              </div>
              <p className="text-gray-400 text-sm">Add a customer testimonial</p>
            </div>

            <form onSubmit={handleCreateTestimonial} className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Gamertag (Optional)
                </label>
                <input
                  type="text"
                  value={formData.gamertag}
                  onChange={(e) =>
                    setFormData({ ...formData, gamertag: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="@gamertag"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Testimonial *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  placeholder="Share your experience..."
                  rows={4}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">
                  Rating
                </label>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: i + 1 })}
                      className="p-2 transition-colors"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          i < formData.rating
                            ? 'fill-orange-400 text-orange-400'
                            : 'text-slate-600 hover:text-orange-400'
                        } transition-colors cursor-pointer`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.approved}
                    onChange={(e) =>
                      setFormData({ ...formData, approved: e.target.checked })
                    }
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm text-gray-400">Approve immediately</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm text-gray-400">Feature this testimonial</span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  Add Testimonial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      customerName: '',
                      gamertag: '',
                      content: '',
                      rating: 5,
                      featured: false,
                      approved: false,
                    });
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
