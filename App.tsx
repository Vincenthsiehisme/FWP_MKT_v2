// ========================================
// App.tsx 需要修改的完整程式碼片段
// ========================================

// -----------------------------------------
// 修改 1: useEffect (約在第 130 行)
// -----------------------------------------

// ❌ 刪除這段
/*
useEffect(() => {
  if (loadingState === 'analyzing' || loadingState === 'generating_image') {
    const messages = [
      "正在繪製八字命盤...",
      "分析五行能量分佈...",
      "推算喜用神與互補元素...",
      "正在凝聚專屬水晶能量..."
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
*/

// ✅ 替換成這段
useEffect(() => {
  if (loadingState === 'analyzing') {  // ✅ 只監聽 analyzing
    const messages = [
      "正在繪製八字命盤...",
      "分析五行能量分佈...",
      "推算喜用神與互補元素..."
      // ❌ 移除："正在凝聚專屬水晶能量..."
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


// -----------------------------------------
// 修改 2: Loading Overlay (約在第 348 行)
// -----------------------------------------

// ❌ 刪除這段
/*
{(loadingState === 'analyzing' || loadingState === 'generating_image') && (
  <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl transition-all duration-500">
*/

// ✅ 替換成這段
{loadingState === 'analyzing' && (
  <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl transition-all duration-500">
     <div className="relative w-24 h-24 mb-8">
      <div className="absolute inset-0 border-2 border-mystic-900/50 rounded-full scale-110"></div>
      <div className="absolute inset-0 border-t-2 border-mystic-400 rounded-full animate-spin"></div>
      <div className="absolute inset-2 border-2 border-slate-800 rounded-full"></div>
    </div>
    <h3 className="text-2xl md:text-3xl font-sans font-bold text-white animate-pulse tracking-wide text-center px-4">
      {loadingMessage || '正在啟動能量分析...'}
    </h3>
    <p className="text-mystic-400/70 mt-4 text-sm font-normal tracking-wider font-sans opacity-80">
        凝聚天地能量，探尋命理奧秘
    </p>
  </div>
)}


// -----------------------------------------
// 修改 3: handleFormSubmit (你已經改好了！)
// -----------------------------------------

// ✅ 你的版本已經是對的：
const handleFormSubmit = async (profileData: Omit<CustomerProfile, 'id' | 'createdAt'>) => {
  setLoadingState('analyzing');
  setErrorMessage(null);

  const newProfile: CustomerProfile = {
    ...profileData,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    wishes: profileData.wishes || []
  };

  try {
    // 步驟 1: 分析八字
    const analysis = await analyzeCustomerProfile(newProfile);
    
    // ❌ 已移除：setLoadingState('generating_image');
    // ❌ 已移除：const imageUrl = await generateBraceletImage(analysis, newProfile);

    // 步驟 2: 建立完整記錄（圖片欄位直接設為空字串）
    const fullRecord: CustomerRecord = {
      ...newProfile,
      analysis,
      generatedImageUrl: "", // ✅ 不再生成圖片
    };

    // 步驟 3: 儲存到資料庫
    await dbService.addCustomer(fullRecord);
    const updatedRecords = await dbService.getAllCustomers();
    setCustomers(updatedRecords);
    
    // 步驟 4: 顯示結果
    setCustomAnalysisRecord(fullRecord);
    setLoadingState('completed');
    setView('result');

  } catch (error: any) {
    console.error(error);
    setErrorMessage(error.message || "發生未知錯誤");
    setLoadingState('error');
  }
};
