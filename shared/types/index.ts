// Shared TypeScript types for DRRMO system

export type UserRole = 'admin' | 'drrmo_officer' | 'responder' | 'barangay_official' | 'citizen';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'investigating' | 'responding' | 'resolved' | 'closed';
export type IncidentType = 'fire' | 'flood' | 'earthquake' | 'medical' | 'accident' | 'other';

export type ResponderStatus = 'available' | 'assigned' | 'on_duty' | 'off_duty';
export type ResponderSpecialization = 'fire' | 'medical' | 'rescue' | 'police' | 'general';

export type EvacuationCenterStatus = 'available' | 'active' | 'full' | 'closed';

export type ResourceStatus = 'available' | 'allocated' | 'in_use' | 'maintenance';
export type ResourceType = 'vehicle' | 'equipment' | 'supplies' | 'personnel';

export type NotificationType = 'alert' | 'warning' | 'info' | 'emergency';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';
export type NotificationAudience = 'all' | 'barangay' | 'role' | 'specific_users';

export type EmergencyRequestStatus = 'pending' | 'acknowledged' | 'responding' | 'resolved' | 'cancelled';
export type EmergencyRequestPriority = 'low' | 'medium' | 'high' | 'critical';

export type DamageLevel = 'minor' | 'moderate' | 'severe' | 'total';

export type RescueOperationStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  barangayId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Barangay {
  id: string;
  name: string;
  municipality: string;
  province: string;
  population?: number;
  coordinates?: { lat: number; lng: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location?: { lat: number; lng: number };
  address?: string;
  barangayId?: string;
  reportedBy?: string;
  assignedTo?: string;
  images?: string[];
  videos?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface Responder {
  id: string;
  userId: string;
  teamName?: string;
  specialization?: ResponderSpecialization;
  status: ResponderStatus;
  currentLocation?: { lat: number; lng: number };
  vehicleType?: string;
  vehiclePlate?: string;
  equipment?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EvacuationCenter {
  id: string;
  name: string;
  address: string;
  barangayId?: string;
  capacity: number;
  currentOccupancy: number;
  status: EvacuationCenterStatus;
  facilities?: string[];
  contactPerson?: string;
  contactPhone?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  category?: string;
  quantity: number;
  unit?: string;
  locationId?: string;
  status: ResourceStatus;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetAudience: NotificationAudience;
  barangayId?: string;
  sentBy?: string;
  isBroadcast: boolean;
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
}

export interface EmergencyRequest {
  id: string;
  userId?: string;
  type: string;
  description?: string;
  location?: { lat: number; lng: number };
  address?: string;
  barangayId?: string;
  status: EmergencyRequestStatus;
  priority: EmergencyRequestPriority;
  images?: string[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface Report {
  id: string;
  title: string;
  type: string;
  content: any;
  generatedBy?: string;
  incidentId?: string;
  barangayId?: string;
  dateRange?: { start: Date; end: Date };
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface DamageAssessment {
  id: string;
  incidentId?: string;
  barangayId?: string;
  assessorId?: string;
  propertyType?: string;
  damageLevel?: DamageLevel;
  estimatedCost?: number;
  affectedPeople?: number;
  description?: string;
  images?: string[];
  coordinates?: { lat: number; lng: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface RescueOperation {
  id: string;
  incidentId?: string;
  leadResponderId?: string;
  status: RescueOperationStatus;
  operationType?: string;
  location?: { lat: number; lng: number };
  startTime?: Date;
  endTime?: Date;
  resourcesUsed?: string[];
  personnelInvolved?: string[];
  casualties: number;
  peopleRescued: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  barangayId?: string;
}

export interface IncidentForm {
  title: string;
  description?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  address?: string;
  barangayId?: string;
  images?: File[];
  videos?: File[];
}

export interface EmergencyRequestForm {
  type: string;
  description?: string;
  address?: string;
  barangayId?: string;
  priority: EmergencyRequestPriority;
  images?: File[];
}

// Real-time event types
export interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

export type IncidentUpdateEvent = RealtimeEvent & {
  type: 'incident_update';
  payload: { incidentId: string; updates: Partial<Incident> };
};

export type ResponderLocationEvent = RealtimeEvent & {
  type: 'responder_location';
  payload: { responderId: string; location: { lat: number; lng: number } };
};

export type NotificationEvent = RealtimeEvent & {
  type: 'notification';
  payload: Notification;
};

export type EmergencyAlertEvent = RealtimeEvent & {
  type: 'emergency_alert';
  payload: { alertId: string; message: string; priority: NotificationPriority };
};