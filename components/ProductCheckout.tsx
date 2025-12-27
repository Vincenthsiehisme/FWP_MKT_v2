import React, { useRef, useEffect } from 'react';
import { CustomerRecord, ShippingDetails, PricingStrategy } from '../types';
import ShippingForm from './ShippingForm';
import OrderReceipt from './OrderReceipt';
import { ProductEntry } from '../services/productDatabase';

interface ProductCheckoutProps {
  record: CustomerRecord;
  product: ProductEntry & { name: string };
  onBack: () => void;
  onShippingSubmit: (details: ShippingDetails) => void;
  isSyncing: boolean;
  onReset: () => void;
}

const ProductCheckout: React.FC<ProductCheckoutProps> = ({ record, product, onBack, onShippingSubmit, isSyncing, onReset }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  const STANDARD_STRATEGY: PricingStrategy = {
      type: 'standard',
      basePrice: product.price,
      shippingCost: 0,
      sizeThreshold: 14,
      surcharge: 200
  };

  useEffect(() => {
    if (isMounted.current) {
        if (record.shippingDetails && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        isMounted.current = true;
    }
  }, [record.shippingDetails]);

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up pb-12 pt-4">
        {!record.shippingDetails && (
          <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition group bg-slate-800/50 px-4 py-2 rounded-full border border-white/5 w-fit">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              回到市集
          </button>
        )}

        <div ref={scrollRef}>
          {!record.shippingDetails ? (
              <div className="space-y-12">
                  <div className="flex flex-col lg:flex-row gap-10 items-center">
                      <div className="w-full lg:w-1/3 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative bg-slate-900 aspect-square flex items-center justify-center">
                          <img src={product.imageUrl} className="relative z-10 w-[90%] h-[90%] object-contain" />
                      </div>
                      <div className="w-full lg:w-2/3">
                          <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
                          <p className="text-slate-300 leading-loose text-lg font-light mb-8">{product.description}</p>
                      </div>
                  </div>

                  {/* ✅ 標準商品結帳 - 保持加購功能開啟 */}
                  <ShippingForm 
                      onSubmit={onShippingSubmit} 
                      isSubmitting={isSyncing} 
                      pricingStrategy={STANDARD_STRATEGY}
                      initialItem={{ productId: product.name, name: product.name, price: product.price }}
                      allowAdditionalPurchase={true} // ✅ 標準商品保持加購功能
                  />
              </div>
          ) : (
              <OrderReceipt record={record} onReset={onReset} />
          )}
        </div>
    </div>
  );
};

export default ProductCheckout;
