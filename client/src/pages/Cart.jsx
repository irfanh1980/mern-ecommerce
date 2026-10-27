import { useState, useEffect } from 'react';

export default function Cart() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem('cart') || '[]'));
  }, []);

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      {items.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between border rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  {item.images?.[0]?.url && (
                    <img src={item.images[0].url} alt={item.title} className="h-16 w-16 rounded object-cover" />
                  )}
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">${item.price}</span>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center border-t pt-4">
            <span className="text-lg font-bold">Total: ${total.toFixed(2)}</span>
            <button
              onClick={() => {
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                orders.push({ items, total, date: new Date().toISOString() });
                localStorage.setItem('orders', JSON.stringify(orders));
                localStorage.removeItem('cart');
                setItems([]);
                alert('Order placed (dummy)');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}