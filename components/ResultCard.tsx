
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
  const [isImageZoomed, setIsImageZoomed] = useState(false);
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
            pointRadius: 4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0, 
              max: 100,
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              grid: { color: 'rgba(255, 255, 255, 0.05)', circular: true },
              pointLabels: {
                color: '#e2e8f0',
                font: { family: '"Noto Sans TC", sans-serif', size: 14, weight: '700' },
                padding: 12
              },
              ticks: { display: false }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [record.analysis]);

  const lightboxContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 animate-fade-in cursor-zoom-out" onClick={() => setIsImageZoomed(false)}>
      <img src={record.generatedImageUrl} className="max-w-full max-h-[90dvh] object-contain shadow-2xl rounded animate-scale-in" alt="Zoomed View" />
    </div>
  );

  if (!record.analysis) return null;

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up pb-12">
      {isImageZoomed && createPortal(lightboxContent, document.body)}

      <div className="flex flex-col lg:flex-row gap-0 bg-slate-800/40 backdrop-blur-2xl rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl mb-12">
        <div className="lg:w-1/2 relative h-[45dvh] lg:h-auto bg-slate-950 cursor-zoom-in" onClick={() => setIsImageZoomed(true)}>
          {record.generatedImageUrl && <img src={record.generatedImageUrl} className="w-full h-full object-cover animate-scale-in" alt="Analysis" />}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 whitespace-nowrap z-10">
            <span className="text-[10px] text-slate-300 font-sans tracking-wide">圖片僅供參考，實際設計以實品為準</span>
          </div>
        </div>

        <div className="lg:w-1/2 p-10 flex flex-col justify-center">
            <div className="mb-8">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-4 inline-block ${record.isTimeUnsure ? 'bg-gold-900/40 text-gold-400 border border-gold-500/50' : 'bg-mystic-900/40 text-mystic-300 border border-mystic-500/50'}`}>
                    {record.isTimeUnsure ? '願願顯化模式' : '五行平衡模式'}
                </span>
                <h2 className="text-3xl font-bold text-white leading-tight">{record.name} 的專屬能量報告</h2>
            </div>

            <div className="bg-slate-900/60 rounded-3xl border border-white/10 p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="h-[180px] w-full md:w-1/2"><canvas ref={chartRef}></canvas></div>
                <div className="w-full md:w-1/2 space-y-2">
                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                        {insightTarget?.name} <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-500/30">核心元素</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        {record.isTimeUnsure ? '根據您的主要願望，此元素能提供最強的運勢支持。' : '這是您命盤中最需要的平衡能量，有助於身心和諧。'}
                    </p>
                </div>
            </div>
        </div>
      </div>

      <div ref={successRef}>
        {!record.shippingDetails ? (
            <ShippingForm onSubmit={onShippingSubmit} isSubmitting={isSyncing} pricingStrategy={CUSTOM_STRATEGY} initialItem={{ productId: 'CUSTOM_BRACELET', name: '八字水晶訂製款', price: 2400, isCustom: true }} />
        ) : (
            <OrderReceipt record={record} onReset={onReset} />
        )}
      </div>
    </div>
  );
};

export default ResultCard;
