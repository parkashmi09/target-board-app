# 📋 Backend Notes - Chat Report Feature

**For Backend Developer**  
**Date**: January 8, 2025  
**Priority**: 🔴 HIGH (Required for Play Store compliance)

---

## 🎯 What Frontend Needs

Frontend needs **ONE endpoint** to allow users to report inappropriate chat messages.

---

## 📡 Required Endpoint

### Report Chat Message

**Endpoint**: `POST /api/v1/chat/report/:streamId`  
**Base URL**: `https://shark-app-2-dzcvn.ondigitalocean.app/`  
**Auth**: Required (JWT token in Authorization header)

**Request Body**:
```json
{
  "messageId": "uuid-of-message-to-report",
  "reason": "spam" | "harassment" | "inappropriate" | "other",
  "description": "Optional detailed description"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Message reported successfully",
  "reportId": "report-uuid-here"
}
```

**Response (Error - 400/401/404/429)**:
```json
{
  "success": false,
  "message": "Error message here"
}
```

**Error Cases**:
- `400`: Invalid request (missing messageId, invalid reason)
- `401`: Unauthorized (invalid/missing token)
- `404`: Message not found
- `429`: Too many reports (rate limiting - e.g., max 5 reports per hour per user)

---

## 🔄 Socket.io Event (Optional but Recommended)

**Event Name**: `report-message`  
**Emit From**: Client  
**Listen For**: `report-success` or `report-error`

**Client Emits**:
```json
{
  "streamId": "693c36aabf9e5e75c40f4065",
  "messageId": "message-uuid-here",
  "reason": "spam",
  "description": "Optional description"
}
```

**Server Responds with**:
- `report-success` event: `{ reportId: "uuid", message: "Reported successfully" }`
- `report-error` event: `{ message: "Error message" }`

**Note**: If Socket.io event is not implemented, frontend will use HTTP API only.

---

## 💾 Database Requirements

Store reports in database:

**Reports Table**:
- `id` (UUID)
- `streamId` (String)
- `messageId` (String)
- `reportedUserId` (String) - User who sent the message
- `reportedByUserId` (String) - User who reported
- `reason` (Enum: spam, harassment, inappropriate, other)
- `description` (Text, optional)
- `status` (Enum: pending, reviewed, resolved, dismissed)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Indexes**:
- `messageId`
- `reportedByUserId`
- `status`

---

## 🔒 Security & Validation

1. **Rate Limiting**: Max 5 reports per user per hour
2. **Validation**: 
   - Verify message exists
   - Verify user has access to stream
   - Prevent self-reporting (user can't report their own messages)
3. **Privacy**: Don't expose reporter identity to reported user

---

## 📝 Implementation Notes

1. **Store Report**: Save report to database with status "pending"
2. **Notify Admins**: Optional - send notification to admins (email/webhook)
3. **Auto-Moderation**: Optional - auto-block user if they receive X reports (configurable threshold)
4. **Track Reports**: Count reports per user for moderation purposes

---

## ✅ Testing Checklist

- [ ] Report message API works
- [ ] Validation works (missing fields, invalid messageId)
- [ ] Rate limiting works (too many reports)
- [ ] Self-reporting is prevented
- [ ] Reports are stored correctly
- [ ] Socket.io event works (if implemented)
- [ ] Error handling works

---

## 📞 Frontend Integration

Frontend will call:
- HTTP: `POST /api/v1/chat/report/:streamId` (if Socket.io not available)
- Socket.io: `report-message` event (preferred for real-time)

**Frontend is ready** - just needs backend endpoint to be implemented.

---

**Questions?** Contact frontend team for integration details.

