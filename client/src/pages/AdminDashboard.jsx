import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const TABS = [
  { key: 'stats', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
];

export default function AdminDashboard() {
  const { api, user } = useAuth();
  const [tab, setTab] = useState(new URLSearchParams(window.location.search).get('tab') || 'stats');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updatingUser, setUpdatingUser] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', street: '', apartment: '', city: '', state: '', zipCode: '', country: '', role: '', isVerified: false });

  // Products
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user, api]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/api/admin/dashboard/stats');
      setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUserError('');
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(data.data);
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const { data } = await api.get('/api/admin/products');
      setProducts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data } = await api.get('/api/admin/orders');
      setOrders(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'products') fetchProducts();
    if (tab === 'orders') fetchOrders();
  }, [tab, user, api]);

  const openEditUser = (u) => {
    setEditUser(u);
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      street: u.address?.street || '',
      apartment: u.address?.apartment || '',
      city: u.address?.city || '',
      state: u.address?.state || '',
      zipCode: u.address?.zipCode || '',
      country: u.address?.country || '',
      role: u.role,
      isVerified: !!u.isVerified,
      password: '',
    });
  };

  const closeEditUser = () => setEditUser(null);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setUpdateError('');
    setUpdatingUser(true);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        isVerified: editForm.isVerified,
        address: {
          street: editForm.street,
          apartment: editForm.apartment,
          city: editForm.city,
          state: editForm.state,
          zipCode: editForm.zipCode,
          country: editForm.country,
        },
      };
      if (editForm.password) payload.password = editForm.password;
      const { data } = await api.put(`/api/admin/users/${editUser._id}`, payload);
      setUsers((prev) => prev.map((u) => (u._id === data.data._id ? data.data : u)));
      closeEditUser();
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrder = async (id, field, value) => {
    try {
      await api.patch(`/api/admin/orders/${id}/status`, { [field]: value });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await api.delete(`/api/admin/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-600">Loading...</div>;
  if (user?.role !== 'Admin') return <div className="p-6 text-center text-red-600">Access denied. Admins only.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Full control over users, products, and orders</p>
        </div>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Stats Tab */}
      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="bg-blue-500" />
          <StatCard title="Total Products" value={stats.totalProducts} icon="📦" color="bg-green-500" />
          <StatCard title="Total Orders" value={stats.totalOrders} icon="🛒" color="bg-purple-500" />
          <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon="💰" color="bg-orange-500" />
        </div>
      )}

      {/* Users Tab - Full CRUD */}
      {tab === 'users' && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold">All Users</h2>
            {userError && (
              <div className="rounded bg-red-50 p-3 text-sm text-red-700">{userError}</div>
            )}
          </div>

          {usersLoading ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Phone</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Role</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Verified seller</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Listings</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Email verified</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Joined</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">                        <Link to={`/seller/${u._id}`} className="text-blue-600 hover:underline">{u.name}</Link></td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">{u.phone || '-'}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : u.role === 'Seller' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-2">{u.isVerified ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2">{u.listingCount ?? 0}</td>
                      <td className="px-3 py-2">{u.isEmailVerified ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => openEditUser(u)}
                          className="mr-2 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        {u.role !== 'Admin' ? (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

        {/* Edit User Modal */}
        {editUser && (
          
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
  <div 
    className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-200 relative z-10 my-8" 
    onClick={(e) => e.stopPropagation()}
  >
              <h2 className="mb-4 text-xl font-bold">Edit User</h2>
              {updateError && (
                <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{updateError}</div>
              )}
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label htmlFor="edit-user-name" className="block text-sm font-medium mb-1">Name</label>
                  <input
                    id="edit-user-name"
                    name="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded border px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-user-email" className="block text-sm font-medium mb-1">Email</label>
                  <input
                    id="edit-user-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full rounded border px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-user-phone" className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    id="edit-user-phone"
                    name="phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="edit-user-password" className="block text-sm font-medium mb-1">Password</label>
                  <input
                    id="edit-user-password"
                    name="password"
                    type="password"
                    placeholder="Leave blank to keep unchanged"
                    autoComplete="current-password"
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-user-street" className="block text-sm font-medium mb-1">Street address</label>
                    <input
                      id="edit-user-street"
                      value={editForm.street}
                      onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-user-apartment" className="block text-sm font-medium mb-1">Apartment / suite</label>
                    <input
                      id="edit-user-apartment"
                      value={editForm.apartment}
                      onChange={(e) => setEditForm({ ...editForm, apartment: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="edit-user-city" className="block text-sm font-medium mb-1">City</label>
                    <input
                      id="edit-user-city"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-user-state" className="block text-sm font-medium mb-1">State / province</label>
                    <input
                      id="edit-user-state"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-user-zip" className="block text-sm font-medium mb-1">Postal code</label>
                    <input
                      id="edit-user-zip"
                      value={editForm.zipCode}
                      onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-user-country" className="block text-sm font-medium mb-1">Country</label>
                  <input
                    id="edit-user-country"
                    value={editForm.country}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="edit-user-role" className="block text-sm font-medium mb-1">Role</label>
                  <select
                    id="edit-user-role"
                    name="role"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                    <option value="Both">Seller &amp; Buyer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="edit-user-isVerified"
                    type="checkbox"
                    checked={editForm.isVerified}
                    onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="edit-user-isVerified" className="text-sm text-gray-700">
                    Verified seller
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={closeEditUser}
                    disabled={updatingUser}
                    className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingUser}
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {updatingUser ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">All Products</h2>
          {productsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No products found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Title</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Price</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Seller</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">                      <Link to={`/products/${p._id}`} className="text-blue-600 hover:underline">{p.title}</Link></td>
                      <td className="px-3 py-2 capitalize">{p.category}</td>
                      <td className="px-3 py-2">${p.price.toFixed(2)}</td>
                      <td className="px-3 py-2">{p.seller?.name || 'Unknown'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">All Orders</h2>
          {ordersLoading ? (
            <div className="text-center py-8 text-gray-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Buyer</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Total</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Order Status</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Payment Status</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{o.buyer?.name || 'Unknown'}</td>
                      <td className="px-3 py-2">${o.totalPrice.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`Order status for order ${o._id}`}
                          value={o.orderStatus}
                          onChange={(e) => handleUpdateOrder(o._id, 'orderStatus', e.target.value)}
                          className="rounded border px-2 py-1 text-sm bg-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`Payment status for order ${o._id}`}
                          value={o.paymentStatus}
                          onChange={(e) => handleUpdateOrder(o._id, 'paymentStatus', e.target.value)}
                          className="rounded border px-2 py-1 text-sm bg-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDeleteOrder(o._id)}
                          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`${color} rounded-lg p-4 text-white`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-opacity-80 text-sm mt-1">{title}</p>
    </div>
  );
}
