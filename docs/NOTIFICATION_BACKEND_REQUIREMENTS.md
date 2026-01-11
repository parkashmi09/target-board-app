# Notification Backend API Requirements

## 📋 Overview

This document outlines the backend API endpoints needed for the notification system with read/unread functionality.

---

## 🔌 Required Backend APIs

### 1. Get Notifications
**Endpoint**: `GET /notifications`

**Description**: Fetch all notifications for the current user

**Headers**:
```
Authorization: Bearer {token}
```

**Response Format**:
```json
{
  "notifications": [
    {
      "id": "notif_123",
      "title": "New Course Available",
      "body": "Check out our new course",
      "data": {
        "screen": "CourseDetails",
        "courseId": "123"
      },
      "timestamp": 1768120236167,
      "read": false,
      "messageId": "0:1768120236177460%22a1cf0822a1cf08"
    }
  ],
  "unreadCount": 5
}
```

**Notes**:
- Notifications should be sorted by timestamp (newest first)
- Include `read` status for each notification
- Return total `unreadCount`

---

### 2. Mark Notification as Read
**Endpoint**: `PUT /notifications/:id/read`

**Description**: Mark a specific notification as read

**Headers**:
```
Authorization: Bearer {token}
```

**URL Parameters**:
- `id`: Notification ID

**Response Format**:
```json
{
  "message": "Notification marked as read",
  "success": true
}
```

---

### 3. Mark All Notifications as Read
**Endpoint**: `PUT /notifications/read-all`

**Description**: Mark all notifications as read for the current user

**Headers**:
```
Authorization: Bearer {token}
```

**Response Format**:
```json
{
  "message": "All notifications marked as read",
  "success": true
}
```

---

## 📱 Current Implementation Status

### ✅ What's Working (Local Storage)
- Notifications are stored locally in AsyncStorage
- Read/unread status tracked locally
- Unread count badge on notification icon
- Notification screen displays all notifications
- Mark as read functionality (local)
- Mark all as read functionality (local)

### 🔄 What Needs Backend Integration
- Sync notifications from backend
- Mark as read on backend
- Mark all as read on backend
- Real-time unread count from backend

---

## 🗄️ Database Schema Suggestions

### Notifications Table
```sql
CREATE TABLE notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSON,
  message_id VARCHAR(255),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_read ON notifications(user_id, read);
CREATE INDEX idx_user_created ON notifications(user_id, created_at DESC);
```

---

## 🔄 Integration Steps

### Step 1: Update NotificationsScreen.tsx
Replace local storage calls with API calls:

```typescript
// Instead of loading from AsyncStorage
const { data: notificationsData } = useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
});

// Instead of local mark as read
await markNotificationAsRead(notificationId);
```

### Step 2: Sync on App Start
Call `fetchNotifications()` when app starts to sync with backend.

### Step 3: Update Unread Count
Use `unreadCount` from API response instead of calculating locally.

---

## 📝 FCM Payload Format

When sending notifications, include `messageId` in data for tracking:

```json
{
  "to": "FCM_TOKEN",
  "notification": {
    "title": "New Course",
    "body": "Check this out!"
  },
  "data": {
    "screen": "CourseDetails",
    "courseId": "123",
    "messageId": "0:1768120236177460%22a1cf0822a1cf08"
  }
}
```

**Important**: Store `messageId` in backend when notification is sent, so you can track which notifications were delivered.

---

## 🧪 Testing Checklist

- [ ] GET /notifications returns user's notifications
- [ ] Notifications sorted by timestamp (newest first)
- [ ] Read status correctly returned
- [ ] Unread count accurate
- [ ] PUT /notifications/:id/read marks notification as read
- [ ] PUT /notifications/read-all marks all as read
- [ ] Backend stores notification when FCM is sent
- [ ] Backend tracks read/unread status

---

## 📞 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/notifications` | Get all notifications |
| PUT | `/notifications/:id/read` | Mark one as read |
| PUT | `/notifications/read-all` | Mark all as read |

---

*Last Updated: Notification System Implementation*

