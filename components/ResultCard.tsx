import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CustomerRecord, ShippingDetails, PricingStrategy } from '../types';
import ShippingForm from './ShippingForm';
import OrderReceipt from './OrderReceipt';

declare var Chart: any;

interface ResultCardProps {
  record: CustomerRecord;
  onReset: () => void;
  onShippingSubmit: (details: ShippingDetails) => void;
  isSyncing?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ record, onReset, onShippingSubmit, isSyncing = false }) => {
  const successRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const [insightTarget, setInsightTarget] = useState<{name: string, type: 'weak' | 'lucky'} | null>(null);

  const CUSTOM_STRATEGY: PricingStrategy = {
      type: 'custom',
      basePrice: 2400,
      shippingCost: 60,
      sizeThreshold: 16,
      surcharge: 200
  };

  useEffect(() => {
    if (isMounted.current) {
        if (record.shippingDetails && successRef.current) {
            successRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        isMounted.current = true;
    }
  }, [record.shippingDetails]);

  useEffect(() => {
    if (record.analysis && chartRef.current && (window as any).Chart) {
      const elements = record.analysis.fiveElements;
      const dataValues = [elements.gold, elements.wood, elements.water, elements.fire, elements.earth];
      let luckyChar = record.analysis.luckyElement ? record.analysis.luckyElement.charAt(0) : '';
      
      if (!luckyChar) {
          const elementMap = [
              { name: '金', score: elements.gold },
              { name: '木', score: elements.wood },
              { name: '水', score: elements.water },
              { name: '火', score: elements.fire },
              { name: '土', score: elements.earth },
          ];
          const sorted = elementMap.sort((a, b) => a.score - b.score);
          setInsightTarget({ name: sorted[0].name, type: 'weak' });
      } else {
          setInsightTarget({ name: luckyChar, type: 'lucky' });
      }

      if (chartInstance.current) chartInstance.current.destroy();

      chartInstance.current = new (window as any).Chart(chartRef.current, {
        type: 'radar',
        data: {
          labels: ['金', '木', '水', '火', '土'],
          datasets: [{
            label: '五行能量',
            data: dataValues,
            backgroundColor: 'rgba(217, 70, 239, 0.4)',
            borderColor: '#e879f9',
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#d946ef',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#d946ef',
            pointRadius: 4,
            pointHoverRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0, 
              max: 100,
              angleLines: { 
                color: 'rgba(255, 255, 255, 0.1)',
                lineWidth: 1
              },
              grid: { 
                color: 'rgba(255, 255, 255, 0.05)',
                circular: true
              },
              pointLabels: {
                color: '#e2e8f0',
                font: {
                  family: '"Noto Sans TC", sans-serif',
                  size: 14,
                  weight: '700'
                },
                padding: 12
              },
              ticks: { display: false, backdropColor: 'transparent' }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#e879f9',
                bodyColor: '#fff',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function(context: any) {
                        return `能量指數: ${context.raw}`;
                    }
                }
            }
          }
        }
      });
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [record.analysis]);

  if (!record.analysis) return null;

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up pb-12">

      {/* ✅ 主卡片 - 依截圖優化的單欄版面 */}
      <div className="bg-slate-800/40 backdrop-blur-2xl rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] mb-8">
        
        {/* 內容區 */}
        <div className="p-6 md:p-10 relative">
          
          {/* 背景裝飾 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-mystic-600/5 blur-[60px] pointer-events-none"></div>

          <div className="relative z-10 space-y-8">
            
            {/* 1. Header Block: Title & Tags */}
            <div className="border-b border-white/5 pb-6">
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        {record.isTimeUnsure ? (
                            <span className="px-2.5 py-1 bg-gold-900/40 border border-gold-500/50 rounded-lg text-[10px] text-gold-400 font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.15)] flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                                </span>
                                願望顯化模式
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 bg-mystic-900/40 border border-mystic-500/50 rounded-lg text-[10px] text-mystic-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-mystic-400"></span>
                                五行平衡模式
                            </span>
                        )}
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-sans font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 leading-tight">
                        {record.name} 的專屬能量
                    </h2>
                </div>
                
                {/* Wish Tags */}
                <div className="flex items-start gap-3">
                   <div className="mt-1 shrink-0 opacity-60">
                      {record.isTimeUnsure ? (
                         <div className="text-xs font-sans text-gold-400 flex flex-col items-center gap-0.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                         </div>
                      ) : (
                         <div className="text-xs font-sans text-mystic-400 flex flex-col items-center gap-0.5">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         </div>
                      )}
                   </div>

                   <div className="flex flex-wrap gap-2">
                        {record.wishes && Array.isArray(record.wishes) && record.wishes.length > 0 ? (
                            record.wishes.map((w, i) => {
                                const isPrimary = i < 3;
                                const primaryStyle = record.isTimeUnsure 
                                    ? 'bg-gold-500/10 text-gold-300 border-gold-500/30 shadow-[0_0_8px_rgba(251,191,36,0.1)]' 
                                    : 'bg-mystic-500/10 text-mystic-300 border-mystic-500/30 shadow-[0_0_8px_rgba(217,70,239,0.1)]';
                                
                                const secondaryStyle = 'bg-slate-800/40 border-slate-700/50 text-slate-500 scale-95 opacity-70';

                                return (
                                    <span key={i} className={`px-3 py-1 rounded-full text-xs font-sans border transition-all
                                        ${isPrimary ? primaryStyle : secondaryStyle}
                                    `}>
                                        {w.type}
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-slate-500 text-xs italic font-sans py-1">無特別願望</span>
                        )}
                   </div>
                </div>
            </div>

            {/* 2. ✅ 能量視覺中心 - 二欄整合版（依截圖設計） */}
            <div className="bg-slate-900/60 rounded-3xl border border-white/10 p-6 md:p-8 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-40 h-40 bg-mystic-500/10 blur-3xl rounded-full pointer-events-none"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
                  
                  {/* 左：雷達圖 */}
                  <div className="relative h-[280px] flex items-center justify-center flex-col">
                    <canvas ref={chartRef}></canvas>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                       <div className="w-16 h-16 bg-mystic-500/20 blur-xl rounded-full"></div>
                    </div>
                    {record.isTimeUnsure && (
                        <span className="text-[10px] text-gold-500/80 mt-[-20px] mb-2 font-sans opacity-90 font-medium bg-black/20 px-2 py-0.5 rounded backdrop-blur-sm">
                            ⚠️ 三柱推算 (僅供參考)
                        </span>
                    )}
                  </div>

                  {/* 右：核心訊息（完整版） */}
                  {insightTarget && (
                    <div className="flex flex-col justify-center relative md:border-l border-t md:border-t-0 border-white/5 md:pl-8 pt-6 md:pt-0">
                       {/* 標籤 */}
                       <div className="mb-4">
                           <span className={`inline-block text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full
                               ${record.isTimeUnsure 
                                  ? 'text-gold-400 border-gold-500/20 bg-gold-900/10' 
                                  : 'text-mystic-400 border-mystic-500/20 bg-mystic-900/10'}
                           `}>
                             {record.isTimeUnsure ? '願望加持' : '命盤解析'}
                          </span>
                       </div>
                       
                       {/* 主標題 */}
                       <div className="mb-4">
                           <h3 className="text-4xl md:text-5xl font-bold text-white mb-2 font-sans">
                              {insightTarget.name}
                           </h3>
                           <span className="inline-block text-sm font-medium text-green-400 bg-green-900/30 px-3 py-1 rounded-md border border-green-500/30">
                             {record.isTimeUnsure 
                                 ? '您的顯化能量' 
                                 : (insightTarget.type === 'lucky' ? '您的喜用神' : '能量需補強')
                             }
                           </span>
                       </div>
                       
                       {/* 說明文字 */}
                       <p className="text-sm text-slate-300 leading-relaxed font-sans mb-4">
                          {record.isTimeUnsure ? (
                            <>
                              命盤分析顯示，<strong className="text-gold-400 mx-1">{insightTarget.name}</strong> 是您目前最需要的平衡元素。
                            </>
                          ) : (
                            <>
                              命盤分析顯示，<strong className="text-mystic-300 mx-1">{insightTarget.name}</strong> 是您目前最需要的平衡元素。
                            </>
                          )}
                       </p>
                       
                       {/* 底部提示 */}
                       <div className="pt-4 border-t border-white/5">
                           <p className="text-xs text-slate-400 flex items-start gap-2">
                              <span className="text-gold-400 mt-0.5 shrink-0">✦</span>
                              <span>
                                {record.isTimeUnsure ? (
                                   <>針對您的主要願望，透過特定水晶的{insightTarget.name}行磁場，能有效增強運勢。</>
                                ) : (
                                   <>透過五行互補原理，此手鍊將為您注入{insightTarget.name}行能量，協助達成五行圓滿。</>
                                )}
                              </span>
                           </p>
                       </div>
                    </div>
                  )}
                </div>
            </div>

            {/* 3. 詳細分析 */}
            <div>
                <button 
                  onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                  className="w-full flex items-center justify-between text-mystic-300 font-bold mb-4 text-lg font-sans group md:cursor-default"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-mystic-500/10 rounded-full border border-mystic-500/20 text-mystic-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </span>
                    詳細能量報告
                  </div>
                  <span className={`text-sm text-slate-500 transform transition-transform duration-300 md:hidden ${isAnalysisExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                <div className={`bg-slate-900/40 rounded-3xl border relative overflow-hidden transition-all duration-500 ease-in-out 
                    ${isAnalysisExpanded ? 'max-h-[1500px] opacity-100 border-white/5' : 'max-h-0 opacity-0 border-transparent'}
                    md:max-h-none md:opacity-100 md:border-white/5
                `}>
                  <div className="p-6 md:p-8 relative z-10">
                    <p className="text-slate-200 leading-loose text-justify text-base md:text-lg font-sans tracking-wide whitespace-pre-line opacity-90">
                      {record.analysis.reasoning}
                    </p>
                  </div>
                </div>
            </div>

          </div>
        </div>
      </div>

      {/* ✅ Shipping Form / Order Receipt Section - 停用加購功能 */}
      <div ref={successRef}>
        {!record.shippingDetails ? (
            <ShippingForm 
                onSubmit={onShippingSubmit} 
                isSubmitting={isSyncing} 
                pricingStrategy={CUSTOM_STRATEGY} 
                initialItem={{ 
                    productId: 'CUSTOM_BRACELET', 
                    name: '八字水晶訂製款', 
                    price: 2400, 
                    isCustom: true 
                }}
                allowAdditionalPurchase={false} // ✅ 五行客製流程關閉加購
            />
        ) : (
            <OrderReceipt record={record} onReset={onReset} />
        )}
      </div>
    </div>
  );
};

export default ResultCard;
