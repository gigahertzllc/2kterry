import { X, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState } from 'react';
import { toast } from 'sonner';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, clearCart, totalPrice, itemCount } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    // Separate free and paid items
    const freeItems = items.filter(i => i.price === 0);
    const paidItems = items.filter(i => i.price > 0);

    // Download free items directly
    for (const item of freeItems) {
      if (item.downloadUrl) {
        window.open(item.downloadUrl, '_blank');
      }
    }

    // If there are paid items, create a Stripe checkout session
    if (paidItems.length > 0) {
      setIsCheckingOut(true);
      try {
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: paidItems.map(item => ({
              skinPackId: item.id,
              skinPackName: item.name,
              price: item.price,
              r2Key: item.r2Key || '',
              stripePriceId: item.stripePriceId || '',
            })),
          }),
        });

        const data = await response.json();
        if (data.url) {
          clearCart();
          window.location.href = data.url;
        } else {
          toast.error('Failed to create checkout session');
        }
      } catch (err) {
        toast.error('Checkout failed. Please try again.');
      } finally {
        setIsCheckingOut(false);
      }
    } else {
      // Only free items — clear cart and show success
      clearCart();
      closeCart();
      toast.success('Free mods downloading!');
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Cart ({itemCount})</h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
              <p className="text-gray-600 text-sm mt-1">Browse mods and add them to your cart</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-sm font-medium truncate">{item.name}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{item.gameName}</p>
                    <p className="text-orange-400 font-semibold mt-1">
                      {item.price === 0 ? 'FREE' : `$${item.price.toFixed(2)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors self-start"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Total</span>
              <span className="text-xl font-bold text-white">${totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Checkout</>
              )}
            </button>
            <button
              onClick={clearCart}
              className="w-full mt-2 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
