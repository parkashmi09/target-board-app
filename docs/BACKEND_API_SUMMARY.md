# 📋 Backend API Summary - Chat Moderation

**Quick Reference for Backend Team**

---

## ✅ Already Implemented (Chat Service)

These endpoints already exist in the chat service:

1. **Block User (Admin)** - `POST /api/v1/chat/block/:streamId`
2. **Unblock User (Admin)** - `DELETE /api/v1/chat/unblock/:streamId/:userId`
3. **Get Blocked Users (Admin)** - `GET /api/v1/chat/blocked/:streamId`
4. **Delete Message (Admin)** - Socket.io event `delete-message`

---

## ❌ Need to Implement

### 1. Report Message (CRITICAL)
**Endpoint**: `POST /api/v1/chat/report/:streamId`  
**Base URL**: `https://shark-app-2-dzcvn.ondigitalocean.app/`

**Request**:
```json
{
  "messageId": "uuid-here",
  "reason": "spam" | "harassment" | "inappropriate" | "other",
  "description": "Optional description"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message reported successfully",
  "reportId": "uuid-here"
}
```

---

### 2. Chat Rules (IMPORTANT)
**Endpoint**: `GET /api/v1/chat/rules`  
**Base URL**: `https://shark-app-2-dzcvn.ondigitalocean.app/`

**Response**:
```json
{
  "success": true,
  "rules": [
    {
      "id": 1,
      "title": "Be Respectful",
      "description": "Treat all participants with respect.",
      "order": 1
    }
  ]
}
```

**Note**: Can return static rules or fetch from database.

---

### 3. Socket.io Report Event (CRITICAL)
**Event**: `report-message`  
**Emit From**: Client

**Payload**:
```json
{
  "streamId": "stream-id",
  "messageId": "message-id",
  "reason": "spam",
  "description": "Optional"
}
```

**Response Events**:
- `report-success` - `{ reportId: "uuid", message: "..." }`
- `report-error` - `{ message: "error message" }`

---

## 📝 Frontend Status

✅ **Frontend is ready** - All API functions are added:
- `reportChatMessage()` - in `src/services/api.ts`
- `getChatRules()` - in `src/services/api.ts`
- `reportMessage()` - in `src/services/socketService.ts`
- `onReportSuccess()` - in `src/services/socketService.ts`
- `onReportError()` - in `src/services/socketService.ts`

**Frontend will work once backend implements these endpoints.**

---

## 🎯 Priority

1. **Report Message API** - 🔴 HIGH (Required for Play Store)
2. **Socket.io Report Event** - 🔴 HIGH (Real-time reporting)
3. **Chat Rules Endpoint** - 🟡 MEDIUM (Can use static rules as fallback)

---

**Full Documentation**: See `BACKEND_API_REQUIREMENTS_CHAT_MODERATION.md`

