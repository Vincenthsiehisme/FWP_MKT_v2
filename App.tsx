import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { CustomerRecord, CustomerProfile, LoadingState, ShippingDetails } from './types';
import CustomerForm from './components/CustomerForm';
import ResultCard from './components/ResultCard';
import Marketplace from './components/Marketplace';
import BottomNav from './components/BottomNav';
import CRMList from './components/CRMList';
import ProductCheckout from './components/ProductCheckout'; 
import ZodiacSelector from './components/ZodiacSelector';
import { analyzeCustomerProfile } from './services/geminiService';
import { syncToGoogleSheet } from './services/googleSheetService';
import { dbService } from './services/dbService';
import { ProductEntry } from './services/productDatabase';
import { COUPON_CONFIG } from './config/coupons';

const HARDCODED_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbymE_hk3XoyMK45dluWCASGzVmwNU_TSj2wgmNVNkSseqRW7bEOCRzwZSFe8KfoNEsDcg/exec"; 

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shop' | 'customize' | 'mine'>('shop');
  const [shopView, setShopView] = useState<'list' | 'zodiac' | 'checkout'>('list');
  const [checkoutOrigin, setCheckoutOrigin] = useState<'list' | 'zodiac'>('list');
  const [selectedProduct, setSelectedProduct] = useState<ProductEntry & { name: string } | null>(null);

  const [customAnalysisRecord, setCustomAnalysisRecord] = useState<CustomerRecord | null>(null);
  const [shopTempRecord, setShopTempRecord] = useState<CustomerRecord | null>(null);

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [view, setView] = useState<'form' | 'result'>('form');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [googleScriptUrl, setGoogleScriptUrl] = useState(HARDCODED_SCRIPT_URL);
  const [stars, setStars] = useState<any[]>([]);
  const [loadingMessage, setLoadingMessage] = useState('');

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, shopView, view]); 

  useEffect(() => {
    const newStars = Array.from({ length: 50 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.7 + 0.3
    }));
    setStars(newStars);
    dbService.getAllCustomers().then(setCustomers);
  }, []);

  useEffect(() => {
    if (loadingState === 'analyzing') {
      const messages = [
        "正在繪製八字命盤...",
        "分析五行能量分佈...",
        "推算喜用神與互補元素..."
      ];
      let index = 0;
      setLoadingMessage(messages[0]);
      
      const interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setLoadingMessage(messages[index]);
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [loadingState]);

  const handleFormSubmit = async (profileData: Omit<CustomerProfile, 'id' | 'createdAt'>) => {
    setLoadingState('analyzing');
    setErrorMessage(null);
    const newProfile: CustomerProfile = { ...profileData, id: crypto.randomUUID(), createdAt: Date.now(), wishes: profileData.wishes || [] };
    try {
      const analysis = await analyzeCustomerProfile(newProfile);
      const fullRecord: CustomerRecord = { ...newProfile, analysis, generatedImageUrl: "" };
      await dbService.addCustomer(fullRecord);
      setCustomers(await dbService.getAllCustomers());
      setCustomAnalysisRecord(fullRecord);
      setLoadingState('completed');
      setView('result');
    } catch (error: any) {
      setErrorMessage(error.message || "分析失敗");
      setLoadingState('error');
    }
  };

  const handleProductSelect = (product: ProductEntry & { name: string }, origin: 'list' | 'zodiac') => {
      setSelectedProduct(product);
      setCheckoutOrigin(origin);
      const tempRecord: CustomerRecord = {
          id: crypto.randomUUID(), createdAt: Date.now(), name: product.name, gender: '其他' as any, birthDate: '', birthTime: '', wishes: [], isStandardProduct: true, generatedImageUrl: product.imageUrl,
          analysis: { zodiacSign: '', element: product.element, bazi: { year: '', month: '', day: '', time: '' }, fiveElements: { gold: 0, wood: 0, water: 0, fire: 0, earth: 0 }, luckyElement: product.element, suggestedCrystals: [product.name], reasoning: product.description, visualDescription: '標準商品', colorPalette: [] }
      };
      setShopTempRecord(tempRecord);
      setShopView('checkout');
  };

  const handleStandardOrderSubmit = async (details: ShippingDetails) => {
      if (!shopTempRecord) return;
      setIsSyncing(true);
      const completedRecord = { ...shopTempRecord, shippingDetails: details };
      await dbService.addCustomer(completedRecord); 
      setCustomers(await dbService.getAllCustomers());
      setShopTempRecord(completedRecord);
      if (googleScriptUrl) await syncToGoogleSheet(completedRecord, googleScriptUrl);
      setIsSyncing(false);
  };

  const handleCustomShippingSubmit = async (details: ShippingDetails) => {
    if (!customAnalysisRecord) return;
    setIsSyncing(true);
    const updatedRecord = { ...customAnalysisRecord, shippingDetails: details };
    await dbService.updateCustomer(updatedRecord);
    setCustomers(await dbService.getAllCustomers());
    setCustomAnalysisRecord(updatedRecord);
    if (googleScriptUrl) await syncToGoogleSheet(updatedRecord, googleScriptUrl);
    setIsSyncing(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-slate-200 font-sans flex flex-col relative overflow-x-hidden">
      <div className="noise-overlay"></div>
      <div className="stars">
        {stars.map((star, i) => (
          <div key={i} className="star" style={{ top: star.top, left: star.left, width: star.size, height: star.size, '--duration': star.duration, '--delay': star.delay, '--opacity': star.opacity } as any} />
        ))}
      </div>

      <header className="pt-8 pb-4 text-center z-10 px-4 w-full">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-mystic-200 via-white to-mystic-200 cursor-pointer" onClick={() => { setActiveTab('shop'); setShopView('list'); }}>
          FWP Boutique
        </h1>
        <p className="text-mystic-300 tracking-[0.4em] text-[10px] md:text-xs uppercase mt-2">追求最純凈的美好</p>
      </header>

      <main className="container mx-auto px-4 relative z-10 flex-grow w-full max-w-7xl pb-24">
        {loadingState === 'analyzing' && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl">
             <div className="w-16 h-16 border-t-2 border-mystic-400 rounded-full animate-spin mb-6"></div>
             <h3 className="text-xl font-bold text-white animate-pulse">{loadingMessage || '正在為您凝聚能量...'}</h3>
          </div>
        )}

        {activeTab === 'shop' && (
           <>
              {shopView === 'list' && <Marketplace onProductSelect={(p) => handleProductSelect(p, 'list')} onOpenZodiac={() => setShopView('zodiac')} />}
              {shopView === 'zodiac' && <ZodiacSelector onBack={() => setShopView('list')} onProductSelect={(p) => handleProductSelect(p, 'zodiac')} />}
              {shopView === 'checkout' && shopTempRecord && selectedProduct && (
                  <ProductCheckout 
                     record={shopTempRecord} product={selectedProduct} onBack={() => setShopView(checkoutOrigin)} 
                     onShippingSubmit={handleStandardOrderSubmit} isSyncing={isSyncing} onReset={() => { setShopView('list'); setShopTempRecord(null); }}
                  />
              )}
           </>
        )}

        {activeTab === 'customize' && (
          <div className="flex flex-col items-center gap-8">
            {view === 'form' ? <CustomerForm onSubmit={handleFormSubmit} isProcessing={loadingState !== 'idle' && loadingState !== 'completed'} /> : (
              customAnalysisRecord && <ResultCard record={customAnalysisRecord} onReset={() => setView('form')} onShippingSubmit={handleCustomShippingSubmit} isSyncing={isSyncing} />
            )}
          </div>
        )}

        {activeTab === 'mine' && isAdmin && (
          <div className="animate-fade-in"><CRMList customers={customers} onSelect={() => {}} onDelete={async (id) => { await dbService.deleteCustomer(id); setCustomers(await dbService.getAllCustomers()); }} /></div>
        )}
        {activeTab === 'mine' && !isAdmin && (
          <div className="max-w-xs mx-auto mt-20 bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center">
            <h3 className="text-xl font-bold text-white mb-6">管理員登入</h3>
            <input type="password" value={adminPasswordInput} onChange={e => setAdminPasswordInput(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white mb-6 text-center" placeholder="密碼" />
            <button onClick={() => adminPasswordInput === '8888' && setIsAdmin(true)} className="w-full py-3 bg-mystic-700 rounded-xl text-white font-bold">登入</button>
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={tab => { setActiveTab(tab); if (tab === 'shop') setShopView('list'); }} />
    </div>
  );
};

export default App;
