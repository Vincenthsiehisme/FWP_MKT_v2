
import { CustomerRecord, CartItem } from '../types';
import { compressBase64Image } from './imageUtils';

export const syncToGoogleSheet = async (record: CustomerRecord, scriptUrl: string) => {
  if (!scriptUrl) return;

  const sanitize = (val: any) => (val === undefined || val === null) ? "" : val;
  const details = record.shippingDetails!;

  const cartStr = details.items.map((item: CartItem) => {
    let s = `【${item.productName} x ${item.quantity}】`;
    if (item.couponCode) s += ` (券: ${item.couponCode})`;
    return s;
  }).join('; ');

  const baziStr = record.analysis?.bazi 
    ? `${record.analysis.bazi.year}/${record.analysis.bazi.month}/${record.analysis.bazi.day}/${record.analysis.bazi.time}`
    : "時辰未知";

  let cleanBase64 = '';
  if (record.generatedImageUrl && record.generatedImageUrl.startsWith('data:image')) {
    try {
      const compressed = await compressBase64Image(record.generatedImageUrl, 0.5, 800);
      cleanBase64 = compressed.split('base64,')[1] || '';
    } catch (e) {
      cleanBase64 = record.generatedImageUrl.split('base64,')[1] || '';
    }
  }

  const payload = {
    id: sanitize(record.id),
    name: sanitize(record.name),
    gender: sanitize(record.gender),
    birthDate: sanitize(record.birthDate),
    birthTime: record.isTimeUnsure ? "吉時/未知" : sanitize(record.birthTime),
    wish: cartStr,
    suggestedCrystals: record.analysis?.suggestedCrystals?.join('、') || "",
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
