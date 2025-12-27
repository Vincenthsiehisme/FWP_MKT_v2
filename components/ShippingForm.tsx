
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ShippingDetails, PricingStrategy, CartItem } from '../types';
import { COUPON_CONFIG } from '../config/coupons';
import { PRODUCT_CATALOG } from '../services/productDatabase';

interface ShippingFormProps {
  onSubmit: (details: ShippingDetails) => void;
  isSubmitting?: boolean;
  pricingStrategy: PricingStrategy;
  initialItem: { productId: string; name: string; price: number; isCustom?: boolean };
}

const toHalfWidth = (str: string) => {
  return str.replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).replace(/\u3000/g, ' ');
};

const ShippingForm: React.FC<ShippingFormProps> = ({ onSubmit, isSubmitting = false, pricingStrategy, initialItem }) => {
  const [cart, setCart] = useState<CartItem[]>([{
    productId: initialItem.productId,
    productName: initialItem.name,
    basePrice: initialItem.price,
    quantity: 1,
    discountAmount: 0,
    isCustomAnalysis: initialItem.isCustom
  }]);

  const [purificationBagQty, setPurificationBagQty] = useState(0);
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [socialId, setSocialId] = useState('');
  const [wristSize, setWristSize] = useState(pricingStrategy.type === 'standard' ? '14' : '15');
  const [agreed, setAgreed] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isTermsExpanded, setIsTermsExpanded] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [shakeField, setShakeField] = useState<string | null>(null);

  const surchargePerItem = useMemo(() => {
    const sizeNum = parseFloat(wristSize);
    if (isNaN(sizeNum)) return 0;
    return sizeNum > pricingStrategy.sizeThreshold ? pricingStrategy.surcharge : 0;
  }, [wristSize, pricingStrategy]);

  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalBraceletQty = 0;
    cart.forEach(item => {
      subtotal += item.basePrice * item.quantity;
      totalDiscount += (item.discountAmount || 0) * item.quantity;
      totalBraceletQty += item.quantity;
    });
    const bagTotal = purificationBagQty * 200;
    const totalSurcharge = totalBraceletQty * surchargePerItem;
    const finalTotal = subtotal + bagTotal + totalSurcharge + pricingStrategy.shippingCost - totalDiscount;
    return { subtotal, totalDiscount, totalBraceletQty, bagTotal, totalSurcharge, finalTotal };
  }, [cart, purificationBagQty, surchargePerItem, pricingStrategy.shippingCost]);

  useEffect(() => {
    const errors: Record<string, string> = {};
    if (realName.trim() && (realName.trim().length < 2 || /[\d\s\W_]/.test(realName))) errors.realName = '請輸入正確的真實姓名';
    if (phone && !/^09\d{8}$/.test(phone)) errors.phone = '手機格式錯誤';
    if (storeCode && !/^\d{6}$/.test(storeCode)) errors.storeCode = '店號應為 6 位數字';
    const s = parseFloat(wristSize);
    if (wristSize && (isNaN(s) || s < 10 || s > 22)) errors.wristSize = '尺寸超出範圍';
    setFieldErrors(errors);
  }, [realName, phone, storeCode, wristSize]);

  const isFormValid = useMemo(() => {
    return (
      realName.trim().length >= 2 &&
      !/[\d\s\W_]/.test(realName) &&
      /^09\d{8}$/.test(phone) &&
      /^\d{6}$/.test(storeCode) &&
      storeName.trim().length >= 2 &&
      socialId.trim().length >= 2 &&
      !isNaN(parseFloat(wristSize)) &&
      agreed &&
      cart.length > 0
    );
  }, [realName, phone, storeCode, storeName, socialId, wristSize, agreed, cart]);

  const handleInputChange = (setter: (v: string) => void, value: string, type: 'text' | 'number' | 'size' = 'text') => {
    let cleanValue = toHalfWidth(value);
    if (type === 'number') cleanValue = cleanValue.replace(/\D/g, '');
    if (type === 'size') cleanValue = cleanValue.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    setter(cleanValue);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    }));
  };

  const applyItemCoupon = (productId: string, code: string) => {
    const isVald = code.trim().toUpperCase() === COUPON_CONFIG.code.toUpperCase() && COUPON_CONFIG.isEnabled;
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        return { 
          ...item, 
          couponCode: isVald ? code.toUpperCase() : undefined,
          discountAmount: isVald ? COUPON_CONFIG.discountAmount : 0
        };
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setShakeField('form');
      setTimeout(() => setShakeField(null), 500);
      return;
    }
    onSubmit({
      realName: realName.trim(),
      phone: phone.trim(),
      storeCode: storeCode.trim(),
      storeName: storeName.trim(),
      socialId: socialId.trim(),
      wristSize: wristSize.trim(),
      purificationBagQty,
      preferredColors: [],
      items: cart,
      totalPrice: cartSummary.finalTotal
    });
  };

  const inputContainerClass = (field: string) => `relative transition-all duration-300 ${shakeField === 'form' && (touched[field] && fieldErrors[field] || !fieldErrors[field] && !touched[field]) ? 'animate-shake' : ''}`;
  const inputClass = (field: string) => `w-full bg-slate-900/60 border rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 outline-none transition-all duration-300 ${touched[field] && fieldErrors[field] ? 'border-red-500 bg-red-500/5' : 'border-slate-700 focus:border-mystic-500 focus:ring-1 focus:ring-mystic-500/30'}`;

  const termsData = [
    { id: '01', text: "由於此商品屬客製化產品，因此恕不接受退換貨服務。" },
    { id: '02', text: "天然石或多或少都會有冰棉裂坑或是偶有黑點，這些都是天然的共生所在，並非瑕疵或損壞。" },
    { id: '03', text: "每批礦石的產地、大小、形狀、色澤皆不同，因此每款水晶飾品皆為獨一無二的單品，照片僅為參考示意圖，無法要求產品完全相同，但設計時都會使用同款水晶搭配，所以功效都是相同的喔！" },
    { id: '04', text: "資料填寫完成，並完成付款後，請務必務必要私訊給我們，才算確認訂單喔！（若未完成、將不會另行通知）" },
    { id: '05', text: "手鍊皆是依據個人命盤及需求搭配設計，設計完成後才會提供照片，為使功效能完整發揮，所以是沒辦法調整設計的喔😊" },
    { id: '06', text: "手鍊中之金屬佩飾為14K金包金，因個人使用習慣及配戴方式，隨著配戴時間增加將可能有磨損及氧化現象，建議配戴時建議避免摩擦及保持乾燥，將有助拉長使用壽命。" },
    { id: '07', text: "飾品自售出後將提供30天保固服務，若飾品非人為因素損壞（如拉扯、掉落損壞）將可免費寄回維修，自售出後第31天起，將不再提供保固。另水晶手鏈若非人為因素自行斷裂，代表水晶為我們擋下了不好的磁場，因此也不建議繼續維修配戴喔。" },
    { id: '08', text: "飾品皆屬於消耗性產品，若希望商品永遠不會磨損、氧化或損壞之高標準者，請勿訂購。" },
    { id: '09', text: "請確認要購買再填寫表單，若填寫後48小時內未付款將是為棄單，未來將列為黑名單，無法再購買店內任何商品。" }
  ];

  return (
    <div className={`space-y-10 animate-fade-in-up ${shakeField === 'form' ? 'animate-shake' : ''}`}>
      {/* 1. 購物清單摘要 */}
      <div className="bg-slate-900/80 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-mystic-900/40 to-slate-900 p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">🛒 結帳清單</h3>
          <span className="text-[10px] text-slate-400 font-black px-3 py-1 rounded-full border border-white/5">ITEM × {cartSummary.totalBraceletQty}</span>
        </div>
        <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
          {cart.map((item) => (
            <div key={item.productId} className="flex flex-col gap-3 p-4 bg-slate-800/30 rounded-2xl border border-white/5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">{item.productName}</h4>
                  <p className="text-[10px] text-slate-500">${item.basePrice.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-950 px-2 py-1 rounded-full border border-white/5">
                  <button type="button" onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400">-</button>
                  <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400">+</button>
                </div>
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="輸入優惠碼" className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none" onBlur={(e) => applyItemCoupon(item.productId, e.target.value)} defaultValue={item.couponCode || ''} />
                {item.discountAmount > 0 && <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-1.5 rounded-lg flex items-center font-bold">-{item.discountAmount * item.quantity}</span>}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-4 bg-slate-800/20 rounded-2xl border border-dashed border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-900/20 rounded-full flex items-center justify-center text-lg">✨</div>
              <div>
                <h4 className="text-sm font-bold text-white">加購 淨化水晶袋</h4>
                <p className="text-[10px] text-slate-500">$200 / 個</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-950 px-2 py-1 rounded-full border border-white/5">
              <button type="button" onClick={() => setPurificationBagQty(Math.max(0, purificationBagQty - 1))} className="w-6 h-6 flex items-center justify-center text-slate-400">-</button>
              <span className="text-xs font-bold text-white w-4 text-center">{purificationBagQty}</span>
              <button type="button" onClick={() => setPurificationBagQty(purificationBagQty + 1)} className="w-6 h-6 flex items-center justify-center text-slate-400">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 費用統計 */}
      <div className="bg-slate-900/60 rounded-3xl p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative z-10">
          <div>
            <label className="block">
              <span className="text-sm font-bold text-white block mb-3">📏 製作手圍尺寸 (cm)</span>
              <input type="text" inputMode="decimal" value={wristSize} onFocus={(e) => e.target.select()} onChange={(e) => handleInputChange(setWristSize, e.target.value, 'size')} className={`w-[140px] bg-slate-950 border-2 ${surchargePerItem > 0 ? 'border-gold-500' : 'border-slate-700'} rounded-2xl px-4 py-4 text-center text-2xl text-white font-mono outline-none shadow-inner`} placeholder="14.5" />
              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">* 超過 {pricingStrategy.sizeThreshold}cm 將加收客製費。</p>
            </label>
          </div>
          <div className="bg-slate-950 rounded-[2rem] p-8 border border-white/5 space-y-4 shadow-2xl">
            <div className="flex justify-between text-xs text-slate-500"><span>小計:</span><span className="font-mono">${cartSummary.subtotal.toLocaleString()}</span></div>
            {cartSummary.totalSurcharge > 0 && <div className="flex justify-between text-xs text-gold-500 font-bold"><span>手圍加價:</span><span className="font-mono">+${cartSummary.totalSurcharge.toLocaleString()}</span></div>}
            <div className="h-px bg-white/10 my-2"></div>
            <div className="flex justify-between items-baseline"><span className="text-sm font-bold text-white uppercase tracking-widest">Total</span><span className="text-4xl font-black text-gold-400 font-mono">${cartSummary.finalTotal.toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* 3. 出貨資料與需知 */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={inputContainerClass('realName')}><input value={realName} onBlur={() => setTouched(t => ({...t, realName: true}))} onChange={e => handleInputChange(setRealName, e.target.value)} placeholder="收件人真實姓名" className={inputClass('realName')} required /></div>
          <div className={inputContainerClass('phone')}><input type="tel" inputMode="numeric" value={phone} onBlur={() => setTouched(t => ({...t, phone: true}))} onChange={e => handleInputChange(setPhone, e.target.value, 'number')} placeholder="手機號碼 (09xxxxxxxx)" className={inputClass('phone')} maxLength={10} required /></div>
          <div className={inputContainerClass('storeCode')}><div className="relative"><input type="tel" inputMode="numeric" value={storeCode} onBlur={() => setTouched(t => ({...t, storeCode: true}))} onChange={e => handleInputChange(setStoreCode, e.target.value, 'number')} placeholder="7-11 店號 (6碼)" className={inputClass('storeCode')} maxLength={6} required /><button type="button" onClick={() => setShowMapModal(true)} className="absolute right-3 top-3 text-[10px] text-orange-400 underline font-black">查詢</button></div></div>
          <div className={inputContainerClass('storeName')}><input value={storeName} onBlur={() => setTouched(t => ({...t, storeName: true}))} onChange={e => setStoreName(e.target.value)} placeholder="門市名稱" className={inputClass('storeName')} required /></div>
        </div>
        <div className={inputContainerClass('socialId')}><input value={socialId} onBlur={() => setTouched(t => ({...t, socialId: true}))} onChange={e => setSocialId(e.target.value)} placeholder="IG / FB 帳號 (聯繫對帳用)" className={inputClass('socialId')} required /></div>

        <div className={`bg-slate-900/60 rounded-[2rem] border transition-all duration-500 overflow-hidden ${!agreed && shakeField === 'form' ? 'border-red-500/50' : 'border-white/5 shadow-xl'}`}>
          <button 
            type="button"
            onClick={() => setIsTermsExpanded(!isTermsExpanded)}
            className="w-full p-6 flex items-center justify-between text-left group hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center text-lg">📜</span>
              <h4 className="text-base font-black text-white uppercase tracking-widest">購買需知與規範 (點擊查看)</h4>
            </div>
            <svg className={`w-5 h-5 text-slate-500 transition-transform duration-500 ${isTermsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isTermsExpanded ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-6 pb-8 space-y-5">
              <div className="h-px bg-white/5 mb-2"></div>
              {termsData.map(term => (
                <div key={term.id} className="flex gap-4 group/item">
                  <span className="text-[10px] font-black text-gold-500/50 group-hover/item:text-gold-500 transition-colors pt-0.5">{term.id}</span>
                  <p className="text-xs text-slate-400 leading-relaxed group-hover/item:text-slate-200 transition-colors">{term.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 p-6 border-t border-white/5">
            <label className={`flex items-start gap-4 cursor-pointer group p-2 rounded-xl transition-all ${!agreed && shakeField === 'form' ? 'bg-red-500/5' : ''}`}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1.5 accent-mystic-500 w-5 h-5 flex-shrink-0" />
              <span className="text-sm text-slate-300 font-bold group-hover:text-white transition-colors leading-relaxed">我已詳閱並確認同意以上所有購買規範與條款。</span>
            </label>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={`w-full py-6 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all duration-500 transform active:scale-95
              ${isFormValid 
                ? 'bg-gradient-to-r from-mystic-600 via-purple-600 to-mystic-600 text-white shadow-mystic-500/30' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
            `}
          >
            {isSubmitting ? '訂單處理中...' : isFormValid ? '確認並送出訂單' : '尚未填寫完成'}
          </button>
        </div>
      </form>

      {showMapModal && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 w-full max-w-[360px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">📍</div>
            <h3 className="text-2xl font-black text-white mb-4">7-11 門市查詢</h3>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">請查詢店號並記下：<br/><a href="https://emap.pcsc.com.tw" target="_blank" className="text-orange-400 font-black text-lg mt-3 block underline underline-offset-4">emap.pcsc.com.tw</a></p>
            <button onClick={() => setShowMapModal(false)} className="w-full py-4 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition">返回填寫</button>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default ShippingForm;
