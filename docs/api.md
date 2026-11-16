# DRRMO System API Documentation

## Overview

The DRRMO system uses a RESTful API architecture with role-based access control. All endpoints require authentication except for public emergency reporting.

## Authentication

### JWT Token Authentication
All authenticated requests must include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "drrmo_officer"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

## API Endpoints

### Users
```
GET    /api/users           # List users (admin only)
POST   /api/users           # Create user (admin only)
GET    /api/users/:id       # Get user details
PUT    /api/users/:id       # Update user
DELETE /api/users/:id       # Delete user (admin only)
```

### Incidents
```
GET    /api/incidents              # List incidents
POST   /api/incidents              # Report incident
GET    /api/incidents/:id          # Get incident details
PUT    /api/incidents/:id          # Update incident
DELETE /api/incidents/:id          # Delete incident (admin only)
POST   /api/incidents/:id/assign   # Assign responder
POST   /api/incidents/:id/resolve  # Mark as resolved
```

### Barangays
```
GET    /api/barangays       # List barangays
GET    /api/barangays/:id   # Get barangay details
PUT    /api/barangays/:id   # Update barangay
```

### Responders
```
GET    /api/responders             # List responders
GET    /api/responders/:id         # Get responder details
PUT    /api/responders/:id         # Update responder
POST   /api/responders/:id/status  # Update status
POST   /api/responders/:id/location # Update location
```

### Evacuation Centers
```
GET    /api/evacuation-centers           # List centers
POST   /api/evacuation-centers           # Create center
GET    /api/evacuation-centers/:id       # Get center details
PUT    /api/evacuation-centers/:id       # Update center
DELETE /api/evacuation-centers/:id       # Delete center
```

### Resources
```
GET    /api/resources              # List resources
POST   /api/resources              # Create resource
GET    /api/resources/:id          # Get resource details
PUT    /api/resources/:id          # Update resource
DELETE /api/resources/:id          # Delete resource
POST   /api/resources/:id/allocate # Allocate resource
```

### Notifications
```
GET    /api/notifications          # List notifications
POST   /api/notifications          # Create notification
GET    /api/notifications/:id      # Get notification
PUT    /api/notifications/:id      # Update notification
DELETE /api/notifications/:id      # Delete notification
POST   /api/notifications/broadcast # Broadcast notification
```

### Emergency Requests
```
GET    /api/emergency-requests           # List requests
POST   /api/emergency-requests           # Create request (public)
GET    /api/emergency-requests/:id       # Get request
PUT    /api/emergency-requests/:id       # Update request
POST   /api/emergency-requests/:id/acknowledge # Acknowledge
```

### Reports
```
GET    /api/reports        # List reports
POST   /api/reports        # Generate report
GET    /api/reports/:id    # Get report
DELETE /api/reports/:id    # Delete report
```

### Activity Logs
```
GET    /api/activity-logs  # List logs (admin only)
GET    /api/activity-logs/:id # Get log details
```

## Real-time Events

### WebSocket Connection
Connect to the WebSocket endpoint for real-time updates:

```
wss://your-realtime-url?token=<jwt_token>
```

### Event Types

#### Incident Updates
```json
{
  "type": "incident_update",
  "payload": {
    "incidentId": "uuid",
    "updates": {
      "status": "responding",
      "assignedTo": "uuid"
    }
  }
}
```

#### Responder Location Updates
```json
{
  "type": "responder_location",
  "payload": {
    "responderId": "uuid",
    "location": {
      "lat": 14.5995,
      "lng": 120.9842
    }
  }
}
```

#### Notifications
```json
{
  "type": "notification",
  "payload": {
    "id": "uuid",
    "title": "Emergency Alert",
    "message": "Flood warning issued",
    "priority": "high"
  }
}
```

#### Emergency Alerts
```json
{
  "type": "emergency_alert",
  "payload": {
    "alertId": "uuid",
    "message": "Immediate evacuation required",
    "priority": "critical",
    "location": {
      "lat": 14.5995,
      "lng": 120.9842
    }
  }
}
```

## Error Handling

All API responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `SERVER_ERROR` - Internal server error

## Rate Limiting

- Public endpoints: 100 requests per minute
- Authenticated endpoints: 1000 requests per minute
- Emergency reporting: Unlimited

## File Upload

### Supported Formats
- Images: JPEG, PNG, GIF, WebP (max 10MB)
- Videos: MP4, AVI, MOV (max 100MB)
- Documents: PDF, DOC, DOCX (max 25MB)

### Upload Endpoint
```
POST /api/upload
Content-Type: multipart/form-data

Form fields:
- file: File to upload
- type: "image" | "video" | "document"
```

Response:
```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/file.jpg",
    "filename": "file.jpg",
    "size": 1024000,
    "type": "image"
  }
}
```

## Pagination

List endpoints support pagination:

```
GET /api/incidents?page=1&limit=20&sort=created_at&order=desc
```

Response:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Filtering and Search

Most list endpoints support filtering:

```
GET /api/incidents?status=active&barangay_id=uuid&search=flood
```

## Data Export

Export endpoints for reports and data:

```
GET /api/reports/export?format=csv&type=incidents&date_from=2024-01-01&date_to=2024-12-31
```

Supported formats: CSV, JSON, PDF