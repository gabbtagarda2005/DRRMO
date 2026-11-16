// Shared constants for DRRMO system

export const USER_ROLES = {
  ADMIN: 'admin',
  DRRMO_OFFICER: 'drrmo_officer',
  RESPONDER: 'responder',
  BARANGAY_OFFICIAL: 'barangay_official',
  CITIZEN: 'citizen'
} as const;

export const INCIDENT_TYPES = {
  FIRE: 'fire',
  FLOOD: 'flood',
  EARTHQUAKE: 'earthquake',
  MEDICAL: 'medical',
  ACCIDENT: 'accident',
  OTHER: 'other'
} as const;

export const INCIDENT_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export const INCIDENT_STATUSES = {
  REPORTED: 'reported',
  INVESTIGATING: 'investigating',
  RESPONDING: 'responding',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
} as const;

export const RESPONDER_STATUSES = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  ON_DUTY: 'on_duty',
  OFF_DUTY: 'off_duty'
} as const;

export const RESPONDER_SPECIALIZATIONS = {
  FIRE: 'fire',
  MEDICAL: 'medical',
  RESCUE: 'rescue',
  POLICE: 'police',
  GENERAL: 'general'
} as const;

export const EVACUATION_CENTER_STATUSES = {
  AVAILABLE: 'available',
  ACTIVE: 'active',
  FULL: 'full',
  CLOSED: 'closed'
} as const;

export const RESOURCE_STATUSES = {
  AVAILABLE: 'available',
  ALLOCATED: 'allocated',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance'
} as const;

export const RESOURCE_TYPES = {
  VEHICLE: 'vehicle',
  EQUIPMENT: 'equipment',
  SUPPLIES: 'supplies',
  PERSONNEL: 'personnel'
} as const;

export const NOTIFICATION_TYPES = {
  ALERT: 'alert',
  WARNING: 'warning',
  INFO: 'info',
  EMERGENCY: 'emergency'
} as const;

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export const NOTIFICATION_AUDIENCES = {
  ALL: 'all',
  BARANGAY: 'barangay',
  ROLE: 'role',
  SPECIFIC_USERS: 'specific_users'
} as const;

export const EMERGENCY_REQUEST_STATUSES = {
  PENDING: 'pending',
  ACKNOWLEDGED: 'acknowledged',
  RESPONDING: 'responding',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled'
} as const;

export const EMERGENCY_REQUEST_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export const DAMAGE_LEVELS = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  SEVERE: 'severe',
  TOTAL: 'total'
} as const;

export const RESCUE_OPERATION_STATUSES = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile'
  },
  USERS: '/api/users',
  INCIDENTS: '/api/incidents',
  BARANGAYS: '/api/barangays',
  RESPONDERS: '/api/responders',
  EVACUATION_CENTERS: '/api/evacuation-centers',
  RESOURCES: '/api/resources',
  NOTIFICATIONS: '/api/notifications',
  EMERGENCY_REQUESTS: '/api/emergency-requests',
  REPORTS: '/api/reports',
  ACTIVITY_LOGS: '/api/activity-logs',
  DAMAGE_ASSESSMENTS: '/api/damage-assessments',
  RESCUE_OPERATIONS: '/api/rescue-operations'
} as const;

// Real-time event types (canonical names emitted/received via Socket.IO)
export const REALTIME_EVENTS = {
  INCIDENT_UPDATE: 'incident_update',
  RESPONDER_LOCATION: 'responder_location',
  /** Broadcast path when mobiles push opportunistic GPS fixes. */
  RESPONDER_LOCATION_UPDATED: 'responder_location_updated',
  /** Room-scoped payloads after `join_incident`. */
  INCIDENT_UPDATED: 'incident_updated',
  NOTIFICATION: 'notification',
  EMERGENCY_ALERT: 'emergency_alert',
  RESOURCE_UPDATE: 'resource_update',
  EVACUATION_UPDATE: 'evacuation_update'
} as const;

// Map configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 14.5995, lng: 120.9842 }, // Manila coordinates
  DEFAULT_ZOOM: 12,
  MAX_ZOOM: 20,
  MIN_ZOOM: 8,
  TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
} as const;

// PWA configuration
export const PWA_CONFIG = {
  NAME: 'DRRMO Citizen App',
  SHORT_NAME: 'DRRMO',
  DESCRIPTION: 'Disaster Risk Reduction and Management Office Citizen Portal',
  THEME_COLOR: '#1e40af',
  BACKGROUND_COLOR: '#ffffff',
  DISPLAY: 'standalone',
  START_URL: '/',
  SCOPE: '/'
} as const;

// Emergency hotline numbers (Philippines)
export const EMERGENCY_HOTLINES = {
  FIRE: '160',
  POLICE: '911',
  MEDICAL: '911',
  PDRRMO: '+63-912-345-6789', // Sample
  RED_CROSS: '143'
} as const;

// Risk level colors for heatmaps
export const RISK_LEVEL_COLORS = {
  LOW: '#10b981', // green
  MEDIUM: '#f59e0b', // yellow
  HIGH: '#f97316', // orange
  CRITICAL: '#ef4444' // red
} as const;

// Status colors
export const STATUS_COLORS = {
  AVAILABLE: '#10b981',
  ACTIVE: '#3b82f6',
  ASSIGNED: '#f59e0b',
  RESPONDING: '#f97316',
  RESOLVED: '#10b981',
  PENDING: '#6b7280',
  CANCELLED: '#ef4444',
  CLOSED: '#6b7280'
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/avi', 'video/mov']
} as const;

// Cache keys
export const CACHE_KEYS = {
  USERS: 'users',
  INCIDENTS: 'incidents',
  BARANGAYS: 'barangays',
  RESPONDERS: 'responders',
  EVACUATION_CENTERS: 'evacuation_centers',
  RESOURCES: 'resources',
  NOTIFICATIONS: 'notifications'
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const;