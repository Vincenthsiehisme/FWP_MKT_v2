
import React, { useState, useMemo } from 'react';
import { CustomerRecord } from '../types';

interface OrderReceiptProps {
  record: CustomerRecord;
  onReset: () => void;
}

const OrderReceipt: React.FC<OrderReceiptProps> = ({ record, onReset }) => {
  const [isAccountCopied, setIsAccountCopied] = useState(false);
  const [isAmountCopied, setIsAmountCopied] = useState(false);
  const details = record.shippingDetails!;

  // 1. 訂單基本資訊
  const orderId = record.id.split('-')[0].toUpperCase();
  const orderTime = new Date(record.createdAt).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // 2. 費用拆解計算
  const financialSummary = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalQty = 0;

    details.items.forEach(item => {
      subtotal += item.basePrice * item.quantity;
      totalDiscount += (item.discountAmount || 0) * item.quantity;
      totalQty += item.quantity;
    });

    const bagTotal = details.purificationBagQty * 200;
    const shippingCost = record.isStandardProduct ? 0 : 60;
    // 反推手圍加價總額
    const totalSurcharge = details.totalPrice - (subtotal + bagTotal + shippingCost - totalDiscount);

    return { subtotal, totalDiscount, totalQty, bagTotal, shippingCost, totalSurcharge };
  }, [record, details]);

  // 3. 複製功能
  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // 4. IG 預填訊息生成
  const igMessage = encodeURIComponent(
    `你好，我已完成訂單！\n訂單編號：${orderId}\n訂購人：${details.realName}\n總金額：$${details.totalPrice}\n轉帳後五碼：`
  );

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden">
        
        {/* --- 頂部狀態區 --- */}
        <div className="bg-gradient-to-b from-green-500/10 to-transparent p-10 text-center relative">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)] animate-scale-in">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">訂單送出成功</h2>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950/50 rounded-full border border-white/5 text-[10px] text-slate-400 font-mono">
            ID: {orderId} • {orderTime}
          </div>
        </div>

        <div className="px-6 md:px-10 pb-12 space-y-8">
          
          {/* --- 區塊 1: 製作規格與收件資訊 --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 space-y-4">
              <h4 className="text-[10px] font-black text-mystic-400 uppercase tracking-[0.2em] mb-2">📐 製作規格</h4>
              <div>
                <p className="text-xs text-slate-500 mb-1">製作手圍</p>
                <p className="text-xl font-bold text-white font-mono">{details.wristSize} <span className="text-xs font-sans text-slate-400">cm</span></p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">社交帳號</p>
                <p className="text-sm font-medium text-slate-200">{details.socialId}</p>
              </div>
            </div>

            <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 space-y-4">
              <h4 className="text-[10px] font-black text-mystic-400 uppercase tracking-[0.2em] mb-2">📦 收件資訊</h4>
              <div className="space-y-2">
                <p className="text-sm font-bold text-white">{details.realName} <span className="text-xs font-normal text-slate-500 ml-2">{details.phone}</span></p>
                <p className="text-xs text-slate-300">7-11 {details.storeName} ({details.storeCode})</p>
              </div>
            </div>
          </div>

          {/* --- 區塊 2: 商品與費用明細 --- */}
          <div className="bg-slate-950/50 rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="p-6 space-y-4">
              <h4 className="text-[10px] font-black text-mystic-400 uppercase tracking-[0.2em]">🛒 購買項目</h4>
              <div className="space-y-3">
                {details.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start group">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-200">{item.productName}</p>
                      <p className="text-[10px] text-slate-500">數量: {item.quantity} {item.couponCode && <span className="text-green-500 ml-2">已使用券: {item.couponCode}</span>}</p>
                    </div>
                    <span className="text-sm text-white font-mono">${(item.basePrice * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                {details.purificationBagQty > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">淨化水晶袋 x {details.purificationBagQty}</span>
                    <span className="text-white font-mono">${(details.purificationBagQty * 200).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-white/5 my-4"></div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>商品小計</span>
                  <span className="font-mono">${financialSummary.subtotal.toLocaleString()}</span>
                </div>
                {financialSummary.totalSurcharge > 0 && (
                  <div className="flex justify-between text-xs text-gold-500">
                    <span>手圍加大費 (${(financialSummary.totalSurcharge / financialSummary.totalQty).toFixed(0)} x {financialSummary.totalQty})</span>
                    <span className="font-mono">+${financialSummary.totalSurcharge.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-500">
                  <span>運費</span>
                  <span className="font-mono">{financialSummary.shippingCost === 0 ? '免運' : `+$${financialSummary.shippingCost}`}</span>
                </div>
                {financialSummary.totalDiscount > 0 && (
                  <div className="flex justify-between text-xs text-green-400">
                    <span>優惠代碼折抵</span>
                    <span className="font-mono">-${financialSummary.totalDiscount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white/5 p-6 flex justify-between items-center">
              <span className="text-sm font-bold text-white">應付總額</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-gold-400 font-mono">${details.totalPrice.toLocaleString()}</span>
                <button 
                  onClick={() => copyToClipboard(details.totalPrice.toString(), setIsAmountCopied)}
                  className={`p-2 rounded-lg transition-all ${isAmountCopied ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  title="複製金額"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* --- 區塊 3: 支付與聯繫導向 --- */}
          <div className="space-y-4 pt-2">
            <a 
              href="https://p.ecpay.com.tw/4BCFFAA" 
              target="_blank" 
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center gap-3 text-white font-bold text-lg shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              綠界線上支付 (信用卡/超商)
            </a>

            <div className="bg-slate-950 p-6 rounded-3xl border border-gold-500/20 text-left relative group">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">ATM 銀行轉帳</p>
                <span className="text-[10px] text-gold-500 font-bold">玉山銀行 808</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-mono font-bold text-gold-300 tracking-tighter">0897-9790-32175</span>
                <button 
                  onClick={() => copyToClipboard("0897979032175", setIsAccountCopied)} 
                  className={`text-xs px-4 py-2 rounded-xl border font-bold transition-all ${isAccountCopied ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}
                >
                  {isAccountCopied ? '已複製' : '複製帳號'}
                </button>
              </div>
            </div>

            <div className="p-6 bg-purple-900/10 border border-purple-500/20 rounded-3xl text-center space-y-4">
              <p className="text-sm text-purple-200 font-medium leading-relaxed">
                完成支付後，請截圖此收據並私訊 IG<br/>
                並告知 <span className="text-white font-bold underline">轉帳後五碼</span> 進行核對。
              </p>
              <a 
                href={`https://www.instagram.com/fwp_boutique/?message=${igMessage}`} 
                target="_blank" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-bold shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.072 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                前往私訊確認
              </a>
            </div>
          </div>

          <button 
            onClick={onReset} 
            className="w-full py-4 text-slate-500 hover:text-slate-200 transition-colors text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回市集首頁
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;
