// ========================================
// App.tsx 中 useEffect 的正確完整程式碼
// 請確保這段程式碼放在 App 組件內部
// ========================================

// 在 App 函數的開頭應該有這些 state 定義：
const [loadingState, setLoadingState] = useState<LoadingState>('idle');
const [loadingMessage, setLoadingMessage] = useState('');

// ... 其他 state 定義 ...

// Progressive Loading Text Logic
// 位置：應該在所有 state 定義之後，handler 函數之前
useEffect(() => {
  if (loadingState === 'analyzing') {  // ✅ 只監聽 analyzing
    const messages = [
      "正在繪製八字命盤...",
      "分析五行能量分佈...",
      "推算喜用神與互補元素..."
      // ❌ 已移除："正在凝聚專屬水晶能量..."
    ];
    let index = 0;
    setLoadingMessage(messages[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 2500);

    return () => clearInterval(interval);
  }
}, [loadingState]);  // ✅ 確保有依賴項


// ========================================
// 檢查清單：確保這些都存在於 App.tsx 中
// ========================================

// 1. ✅ Import React 和 hooks
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

// 2. ✅ Import types
import { CustomerRecord, CustomerProfile, LoadingState, ShippingDetails } from './types';

// 3. ✅ 在 App 組件內定義 state
const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'shop' | 'customize' | 'mine'>('shop');
  
  // Loading State
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');  // ← 這行必須存在
  const [loadingMessage, setLoadingMessage] = useState('');                // ← 這行必須存在
  
  // ... 其他 state ...
  
  // 然後才是 useEffect
  useEffect(() => {
    if (loadingState === 'analyzing') {
      // ...
    }
  }, [loadingState]);
  
  // ... 其他程式碼 ...
}


// ========================================
// 常見錯誤原因
// ========================================

// ❌ 錯誤 1: useEffect 放在組件外面
import React from 'react';

useEffect(() => {  // ❌ 這是錯的！useEffect 不能在組件外
  // ...
});

const App = () => {
  // ...
};


// ❌ 錯誤 2: 缺少 state 定義
const App = () => {
  // 忘記定義這些
  // const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  // const [loadingMessage, setLoadingMessage] = useState('');
  
  useEffect(() => {
    if (loadingState === 'analyzing') {  // ❌ loadingState 未定義
      // ...
    }
  }, [loadingState]);
};


// ❌ 錯誤 3: import 不完整
import React from 'react';  // ❌ 缺少 useEffect

const App = () => {
  useEffect(() => {  // ❌ useEffect is not defined
    // ...
  });
};


// ✅ 正確的結構
import React, { useState, useEffect } from 'react';  // ✅ 正確的 import

const App: React.FC = () => {
  // ✅ State 定義
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // ✅ useEffect 在組件內部
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
  
  return (
    <div>
      {/* ... */}
    </div>
  );
};

export default App;
