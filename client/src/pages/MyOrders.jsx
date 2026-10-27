import { useState, useEffect } from 'react';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    setOrders(JSON.parse(localStorage.getItem('orders') || '[]'));
  }, []);
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <div key={i} className="border rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">{new Date(order.date).toLocaleString()}</p>
              <ul className="mb-2">
                {order.items.map((item, j) => (
                  <li key={j}>{item.title} - ${item.price}</li>
                ))}
              </ul>
              <p className="font-bold">Total: ${order.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}