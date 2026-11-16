import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    barangay: string;
  };
  reportedBy: mongoose.Types.ObjectId;
  assignedResponders: mongoose.Types.ObjectId[];
  affectedCount: number;
  injuredCount: number;
  mediaUrls?: string[];
  priority: number;
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  priorityReason: string;
  priorityOverridden: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  closedAt?: Date;
  escalated?: boolean;
  escalatedBy?: mongoose.Types.ObjectId;
  escalatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IIncident>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['flood', 'earthquake', 'fire', 'landslide', 'typhoon', 'accident', 'other'],
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    status: {
      type: String,
      required: true,
      enum: ['reported', 'verified', 'responding', 'in_progress', 'resolved', 'closed'],
      default: 'reported',
    },
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      barangay: {
        type: String,
        required: true,
      },
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedResponders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    affectedCount: {
      type: Number,
      default: 0,
    },
    injuredCount: {
      type: Number,
      default: 0,
    },
    mediaUrls: [String],
    priority: {
      type: Number,
      default: 0,
    },
    priorityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    priorityReason: {
      type: String,
      default: '',
    },
    priorityOverridden: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    closedAt: Date,
    escalated: {
      type: Boolean,
      default: false,
    },
    escalatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    escalatedAt: Date,
  },
  { timestamps: true }
);

incidentSchema.index({ 'location.barangay': 1, status: 1 });
incidentSchema.index({ severity: 1, status: 1 });

export const Incident = mongoose.model<IIncident>('Incident', incidentSchema);
