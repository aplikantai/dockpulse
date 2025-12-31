'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { GlassCard, GlassCardTitle } from '@/components/ui/GlassCard';
import {
  Package,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Check,
  Search,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'products' | 'summary'>('products');

  useEffect(() => {
    // Mock products - will be replaced with API call
    setProducts([
      { id: '1', name: 'Widget Standard', sku: 'PRD-001', price: 99, category: 'Widgety', inStock: true },
      { id: '2', name: 'Widget Premium', sku: 'PRD-002', price: 199, category: 'Widgety', inStock: true },
      { id: '3', name: 'Widget Pro Max', sku: 'PRD-003', price: 349, category: 'Widgety', inStock: true },
      { id: '4', name: 'Gadget Basic', sku: 'PRD-004', price: 49, category: 'Gadżety', inStock: true },
      { id: '5', name: 'Gadget Pro', sku: 'PRD-005', price: 149, category: 'Gadżety', inStock: true },
      { id: '6', name: 'Akcesoria zestaw', sku: 'PRD-006', price: 29, category: 'Akcesoria', inStock: false },
      { id: '7', name: 'Kabel premium', sku: 'PRD-007', price: 39, category: 'Akcesoria', inStock: true },
      { id: '8', name: 'Etui ochronne', sku: 'PRD-008', price: 59, category: 'Akcesoria', inStock: true },
    ]);
    setLoading(false);
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success - redirect to orders
      router.push('/portal/orders');
    } catch (error) {
      console.error('Order submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nowe zamówienie</h1>
        <p className="text-gray-500 mt-1">
          {step === 'products'
            ? 'Wybierz produkty do zamówienia'
            : 'Sprawdź i potwierdź zamówienie'}
        </p>
      </div>

      {step === 'products' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products list */}
          <div className="lg:col-span-2">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj produktów..."
                className="
                  w-full pl-12 pr-4 py-3 rounded-xl
                  bg-white/70 backdrop-blur-sm border border-gray-200
                  focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20
                  transition-all duration-200 outline-none
                "
              />
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                return (
                  <GlassCard
                    key={product.id}
                    className={`relative ${!product.inStock ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono text-gray-400">{product.sku}</span>
                        <h3 className="font-semibold text-gray-900 mt-1">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.category}</p>
                        <p className="text-lg font-bold text-primary mt-2">
                          {product.price.toLocaleString('pl-PL')} zł
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>

                    {!product.inStock ? (
                      <div className="mt-4 py-2 text-center text-sm text-red-500 bg-red-50 rounded-lg">
                        Niedostępny
                      </div>
                    ) : inCart ? (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="
                          mt-4 w-full py-2 rounded-xl
                          bg-primary/10 text-primary font-medium
                          hover:bg-primary hover:text-white
                          transition-all duration-200
                          flex items-center justify-center gap-2
                        "
                      >
                        <Plus className="w-4 h-4" />
                        Dodaj do koszyka
                      </button>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>

          {/* Cart sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <GlassCard>
                <GlassCardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Koszyk ({cartItemsCount})
                </GlassCardTitle>

                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Koszyk jest pusty</p>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 divide-y divide-gray-100 max-h-80 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} × {item.product.price} zł
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {(item.product.price * item.quantity).toLocaleString('pl-PL')} zł
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-lg">
                        <span className="font-medium text-gray-700">Razem:</span>
                        <span className="font-bold text-gray-900">
                          {cartTotal.toLocaleString('pl-PL')} zł
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        + VAT 23% = {(cartTotal * 1.23).toLocaleString('pl-PL')} zł brutto
                      </p>
                    </div>

                    <button
                      onClick={() => setStep('summary')}
                      className="
                        mt-6 w-full py-3 rounded-xl font-semibold
                        bg-primary text-white
                        hover:bg-primary-600 transition-colors
                        flex items-center justify-center gap-2
                        shadow-lg shadow-primary/25
                      "
                    >
                      Dalej
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      ) : (
        /* Order summary step */
        <div className="max-w-2xl mx-auto">
          <GlassCard>
            <GlassCardTitle>Podsumowanie zamówienia</GlassCardTitle>

            {/* Order items */}
            <div className="mt-4 divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.product.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × {item.product.price.toLocaleString('pl-PL')} zł
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {(item.product.price * item.quantity).toLocaleString('pl-PL')} zł
                  </p>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uwagi do zamówienia (opcjonalnie)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Np. preferowana data dostawy, specjalne instrukcje..."
                rows={3}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-gray-50 border border-gray-200
                  focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20
                  transition-all duration-200 outline-none resize-none
                "
              />
            </div>

            {/* Total */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Wartość netto:</span>
                <span className="font-medium">{cartTotal.toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">VAT (23%):</span>
                <span className="font-medium">{(cartTotal * 0.23).toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Do zapłaty:</span>
                <span className="text-xl font-bold text-primary">
                  {(cartTotal * 1.23).toLocaleString('pl-PL')} zł
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep('products')}
                className="
                  flex-1 py-3 rounded-xl font-medium
                  bg-gray-100 text-gray-700
                  hover:bg-gray-200 transition-colors
                "
              >
                Wróć do produktów
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="
                  flex-1 py-3 rounded-xl font-semibold
                  bg-green-500 text-white
                  hover:bg-green-600 transition-colors
                  disabled:opacity-50
                  flex items-center justify-center gap-2
                  shadow-lg shadow-green-500/25
                "
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Składam zamówienie...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Złóż zamówienie
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </PortalLayout>
  );
}
