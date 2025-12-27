
/**
 * FWP Boutique - Google Apps Script 訂單同步服務 (v4.3)
 * 
 * 使用說明：
 * 1. 在 Google 試算表中點擊「擴充功能」>「Apps Script」。
 * 2. 貼上此腳本並點擊儲存。
 * 3. 點擊「部署」>「新增部署」。
 * 4. 類型選擇「網頁應用程式」。
 * 5. 誰可以存取選擇「任何人」。
 * 6. 部署後複製網頁應用程式 URL，並貼回網頁版的 App.tsx 中。
 */

function doPost(e) {
  try {
    // 解析前端發送的 JSON 資料
    var data = JSON.parse(e.postData.contents);
    
    // 如果是測試 Ping，直接返回 OK
    if (data.test) {
      return ContentService.createTextOutput("Ping OK").setMimeType(ContentService.MimeType.TEXT);
    }

    // 取得當前試算表的第一個工作表
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];

    // --- 欄位對應邏輯 (與 googleSheetService.ts 同步) ---
    // 1. 訂單編號 (ID)
    // 2. 建立時間 (createdAt)
    // 3. 收件人姓名 (realName)
    // 4. 手機號碼 (phone)
    // 5. IG/FB 帳號 (socialId)
    // 6. 7-11 門市 (storeName)
    // 7. 7-11 店號 (storeCode)
    // 8. 手圍尺寸 (wristSize)
    // 9. 淨化水晶袋 (addPurificationBag)
    // 10. 訂單總價 (totalPrice)
    // 11. 購物清單/願望 (wish)
    // 12. 八字資訊 (bazi)
    // 13. 用戶暱稱 (name)
    // 14. 性別 (gender)
    // 15. 出生日期 (birthDate)
    // 16. 出生時辰 (birthTime)
    // 17. 圖片編碼 (imageBase64)
    
    var rowData = [
      data.id,                   // 1
      data.createdAt,            // 2
      data.realName,             // 3
      data.phone,                // 4
      data.socialId,             // 5
      data.storeName,            // 6
      data.storeCode,            // 7
      data.wristSize,            // 8
      data.addPurificationBag,   // 9
      data.totalPrice,           // 10
      data.wish,                 // 11
      data.bazi,                 // 12
      data.name,                 // 13
      data.gender,               // 14
      data.birthDate,            // 15
      data.birthTime,            // 16
      data.imageBase64 ? "data:image/jpeg;base64," + data.imageBase64 : "" // 17
    ];

    // 將資料寫入試算表最後一行
    sheet.appendRow(rowData);

    // 返回成功回應
    return ContentService.createTextOutput("Success")
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    // 錯誤處理
    Logger.log("Error: " + error.toString());
    return ContentService.createTextOutput("Error: " + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
