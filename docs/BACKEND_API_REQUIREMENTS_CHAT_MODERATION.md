# 🔧 Backend API Requirements - Chat Moderation Features

**Date**: January 8, 2025  
**Status**: 📋 Requirements Document  
**Priority**: 🟡 IMPORTANT (Before Public Release)

---

## 📋 Overview

This document outlines the backend API endpoints required to implement chat moderation features in the TargetBoard app. These features are needed for Google Play Store compliance and user safety.

---

## 🔗 Base URL

**Chat Service**: `https://shark-app-2-dzcvn.ondigitalocean.app/`  
**Main Backend**: `BASE_URL` (from config)

---

## 🔐 Authentication

All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## ✅ Already Available (From Chat Service)

Based on the chat service documentation, these endpoints already exist:

### 1. Block User (Admin Only)
**Endpoint**: `POST /api/v1/chat/block/:streamId`  
**Status**: ✅ Available  
**Request Body**:
```json
{
  "userId": "694fcbaf9c750ed0a7eaf33f",
  "reason": "Spam messages",
  "unblockAt": "2025-01-06T10:00:00Z" // Optional, null = permanent
}
```

### 2. Unblock User (Admin Only)
**Endpoint**: `DELETE /api/v1/chat/unblock/:streamId/:userId`  
**Status**: ✅ Available

### 3. Get Blocked Users (Admin Only)
**Endpoint**: `GET /api/v1/chat/blocked/:streamId`  
**Status**: ✅ Available

### 4. Delete Message (Admin Only - Socket.io)
**Socket Event**: `delete-message`  
**Status**: ✅ Available  
**Payload**:
```json
{
  "streamId": "693c36aabf9e5e75c40f4065",
  "messageId": "message-uuid-here"
}
```

---

## ❌ Missing APIs (Need to be Implemented)

### 1. Report Message (User Endpoint)

**Endpoint**: `POST /api/v1/chat/report/:streamId`  
**Method**: POST  
**Auth**: Required (User token)  
**Priority**: 🔴 HIGH

**Request Body**:
```json
{
  "messageId": "uuid-of-reported-message",
  "reason": "spam" | "harassment" | "inappropriate" | "other",
  "description": "Optional detailed description",
  "reportedUserId": "694fcbaf9c750ed0a7eaf33f"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message reported successfully",
  "reportId": "report-uuid-here"
}
```

**Error Responses**:
- `400`: Invalid request (missing fields)
- `401`: Unauthorized
- `404`: Message not found
- `429`: Too many reports (rate limiting)

**Backend Requirements**:
- Store report in database
- Link report to message and user
- Notify admins (optional: email/webhook)
- Track report count per user
- Auto-block if user receives X reports (configurable)

---

### 2. Get Chat Rules/Guidelines

**Endpoint**: `GET /api/v1/chat/rules`  
**Method**: GET  
**Auth**: Optional (public or authenticated)  
**Priority**: 🟡 MEDIUM

**Response**:
```json
{
  "success": true,
  "rules": [
    {
      "id": 1,
      "title": "Be Respectful",
      "description": "Treat all participants with respect and kindness.",
      "order": 1
    },
    {
      "id": 2,
      "title": "No Spam",
      "description": "Do not send repetitive or irrelevant messages.",
      "order": 2
    },
    {
      "id": 3,
      "title": "No Harassment",
      "description": "Harassment, bullying, or hate speech is not tolerated.",
      "order": 3
    },
    {
      "id": 4,
      "title": "Stay On Topic",
      "description": "Keep discussions relevant to the course content.",
      "order": 4
    },
    {
      "id": 5,
      "title": "Follow Instructions",
      "description": "Follow moderator instructions and guidelines.",
      "order": 5
    }
  ],
  "lastUpdated": "2025-01-08T10:00:00.000Z"
}
```

**Alternative**: If rules are static, can be stored in frontend config file.

**Backend Requirements**:
- Store rules in database (admin can update)
- Support multiple languages (English/Hindi)
- Version tracking for updates

---

### 3. Get User's Report History

**Endpoint**: `GET /api/v1/chat/reports/my`  
**Method**: GET  
**Auth**: Required (User token)  
**Priority**: 🟢 LOW

**Query Parameters**:
- `limit`: Number of reports (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "reports": [
    {
      "reportId": "uuid-here",
      "messageId": "message-uuid",
      "reason": "spam",
      "description": "User was spamming messages",
      "status": "pending" | "reviewed" | "resolved" | "dismissed",
      "createdAt": "2025-01-08T10:00:00.000Z",
      "resolvedAt": "2025-01-08T11:00:00.000Z" // if resolved
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

**Backend Requirements**:
- Return only reports made by current user
- Include report status
- Support pagination

---

### 4. Block User (User-Side - Optional)

**Endpoint**: `POST /api/v1/chat/block-user/:streamId`  
**Method**: POST  
**Auth**: Required (User token)  
**Priority**: 🟡 MEDIUM

**Note**: This is different from admin block. User blocks are client-side only (hide messages from that user).

**Request Body**:
```json
{
  "blockedUserId": "694fcbaf9c750ed0a7eaf33f"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

**Backend Requirements**:
- Store user block preferences (per user, per stream)
- Return blocked users list when joining room
- Filter messages on backend (optional) or frontend

**Alternative**: Can be handled client-side only (store in AsyncStorage)

---

## 🔄 Socket.io Events (Need to be Added)

### 1. Report Message Event

**Event**: `report-message`  
**Emit From**: Client  
**Priority**: 🔴 HIGH

**Payload**:
```json
{
  "streamId": "693c36aabf9e5e75c40f4065",
  "messageId": "message-uuid-here",
  "reason": "spam",
  "description": "Optional description"
}
```

**Response Event**: `report-success`
```json
{
  "success": true,
  "reportId": "report-uuid-here",
  "message": "Message reported successfully"
}
```

**Error Event**: `report-error`
```json
{
  "message": "Error message here"
}
```

---

## 📊 Database Schema Requirements

### Reports Table
```sql
CREATE TABLE chat_reports (
  id VARCHAR(255) PRIMARY KEY,
  streamId VARCHAR(255) NOT NULL,
  messageId VARCHAR(255) NOT NULL,
  reportedUserId VARCHAR(255) NOT NULL,
  reportedByUserId VARCHAR(255) NOT NULL,
  reason ENUM('spam', 'harassment', 'inappropriate', 'other') NOT NULL,
  description TEXT,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
  reviewedBy VARCHAR(255), -- Admin ID
  reviewedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_streamId (streamId),
  INDEX idx_messageId (messageId),
  INDEX idx_reportedUserId (reportedUserId),
  INDEX idx_reportedByUserId (reportedByUserId),
  INDEX idx_status (status)
);
```

### Chat Rules Table
```sql
CREATE TABLE chat_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  orderIndex INT DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_language (language),
  INDEX idx_order (orderIndex)
);
```

### User Blocks Table (Optional - for user-side blocking)
```sql
CREATE TABLE user_blocks (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL, -- User who blocked
  blockedUserId VARCHAR(255) NOT NULL, -- User who is blocked
  streamId VARCHAR(255), -- Optional: block only in specific stream
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_block (userId, blockedUserId, streamId),
  INDEX idx_userId (userId),
  INDEX idx_blockedUserId (blockedUserId)
);
```

---

## 🎯 Implementation Priority

### Phase 1: Critical (Before Public Release)
1. ✅ **Report Message API** - `POST /api/v1/chat/report/:streamId`
2. ✅ **Report Message Socket Event** - `report-message`
3. ✅ **Chat Rules Endpoint** - `GET /api/v1/chat/rules` (or static config)

### Phase 2: Important (Post-Launch)
4. ✅ **User Report History** - `GET /api/v1/chat/reports/my`
5. ✅ **User-Side Block** - `POST /api/v1/chat/block-user/:streamId` (optional)

---

## 📝 Frontend Integration Points

### Files to Update:

1. **`src/services/api.ts`**
   - Add `reportMessage()` function
   - Add `getChatRules()` function
   - Add `getMyReports()` function (optional)
   - Add `blockUser()` function (optional)

2. **`src/services/socketService.ts`**
   - Add `reportMessage()` method
   - Add `onReportSuccess()` listener
   - Add `onReportError()` listener

3. **`src/components/LiveChatInterface/index.tsx`**
   - Add report button on message long-press
   - Add block user option
   - Display chat rules modal
   - Handle report success/error

---

## 🔒 Security Considerations

1. **Rate Limiting**:
   - Limit reports per user (e.g., 5 reports per hour)
   - Prevent spam reporting

2. **Validation**:
   - Verify message exists before reporting
   - Verify user has access to stream
   - Prevent self-reporting

3. **Privacy**:
   - Don't expose reporter identity to reported user
   - Only admins can see report details

4. **Auto-Moderation**:
   - Auto-block users with X reports (configurable threshold)
   - Flag suspicious patterns

---

## 📞 Integration Example

### Frontend Code Structure:

```typescript
// src/services/api.ts
export const reportMessage = async (
  streamId: string,
  messageId: string,
  reason: 'spam' | 'harassment' | 'inappropriate' | 'other',
  description?: string
) => {
  return api.post<{ success: boolean; message: string; reportId: string }>(
    `/api/v1/chat/report/${streamId}`,
    { messageId, reason, description }
  );
};

export const getChatRules = async () => {
  return api.get<{ success: boolean; rules: ChatRule[] }>('/api/v1/chat/rules');
};

// src/services/socketService.ts
reportMessage(streamId: string, messageId: string, reason: string, description?: string) {
  if (!this.socket) return;
  this.socket.emit('report-message', { streamId, messageId, reason, description });
}

onReportSuccess(callback: (data: { reportId: string }) => void) {
  this.socket?.on('report-success', callback);
}

onReportError(callback: (error: { message: string }) => void) {
  this.socket?.on('report-error', callback);
}
```

---

## ✅ Testing Checklist

- [ ] Report message API works correctly
- [ ] Report validation (missing fields, invalid messageId)
- [ ] Rate limiting works (too many reports)
- [ ] Chat rules endpoint returns correct data
- [ ] Socket.io report event works
- [ ] Error handling for all endpoints
- [ ] Admin can see reports
- [ ] Auto-block triggers after X reports

---

## 📋 Summary

### What Backend Needs to Implement:

1. **Report Message Endpoint** (CRITICAL)
   - `POST /api/v1/chat/report/:streamId`
   - Store reports in database
   - Notify admins

2. **Chat Rules Endpoint** (IMPORTANT)
   - `GET /api/v1/chat/rules`
   - Return community guidelines

3. **Socket.io Report Event** (CRITICAL)
   - `report-message` event handler
   - `report-success` response event
   - `report-error` error event

4. **Optional Features**:
   - User report history
   - User-side block functionality

### What's Already Available:

- ✅ Block/Unblock users (Admin)
- ✅ Get blocked users list
- ✅ Delete messages (Admin)

---

**Last Updated**: January 8, 2025  
**Next Steps**: Backend team to implement missing endpoints

