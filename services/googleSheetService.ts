
import { CustomerRecord, CartItem } from '../types';
import { compressBase64Image } from './imageUtils';

export const syncToGoogleSheet = async (record: CustomerRecord, scriptUrl: string) => {
  if (!scriptUrl) return;

  const sanitize = (val: any) => (val === undefined || val === null) ? "" : val;
  const details = record.shippingDetails!;

  // 格式化購物車內容為易讀字串
  const cartStr = details.items.map((item: CartItem) => {
    let s = `【${item.productName} x ${item.quantity}】`;
    if (item.couponCode) s += ` (券: ${item.couponCode}, 折${item.discountAmount * item.quantity})`;
    return s;
  }).join('; ');

  const baziStr = record.analysis?.bazi 
    ? `${record.analysis.bazi.year}/${record.analysis.bazi.month}/${record.analysis.bazi.day}/${record.analysis.bazi.time}`
    : "N/A";

  let cleanBase64 = '';
  if (record.generatedImageUrl && !record.generatedImageUrl.startsWith('http')) {
    try {
      const compressedDataUrl = await compressBase64Image(record.generatedImageUrl, 0.6);
      if (compressedDataUrl.includes('base64,')) {
        cleanBase64 = compressedDataUrl.split('base64,')[1];
      }
    } catch (e) {
      if (record.generatedImageUrl.includes('base64,')) {
         cleanBase64 = record.generatedImageUrl.split('base64,')[1];
      }
    }
  }

  const payload = {
    id: sanitize(record.id),
    name: sanitize(record.name),
    gender: sanitize(record.gender),
    birthDate: sanitize(record.birthDate),
    birthTime: record.isTimeUnsure ? "吉時/未知" : sanitize(record.birthTime),
    wish: cartStr, // 將購物車內容放入 wish 欄位或擴充欄位
    suggestedCrystals: cartStr, // 重複一份在水晶建議欄位方便查看
    bazi: baziStr,
    createdAt: new Date(record.createdAt).toLocaleString('zh-TW'),
    realName: sanitize(details.realName),
    phone: sanitize(details.phone),
    storeCode: sanitize(details.storeCode),
    storeName: sanitize(details.storeName),
    socialId: sanitize(details.socialId),
    wristSize: sanitize(details.wristSize),
    addPurificationBag: details.purificationBagQty > 0 ? `是 (${details.purificationBagQty}個)` : '否',
    totalPrice: details.totalPrice,
    imageBase64: cleanBase64
  };

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });
  } catch (error) {
    console.error("[GoogleSheet] Sync error:", error);
  }
};

export const sendTestPing = async (scriptUrl: string) => {
  try {
    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ test: true }),
      mode: 'no-cors'
    });
    return { status: "ok" };
  } catch (e) {
    return { status: "error" };
  }
};
