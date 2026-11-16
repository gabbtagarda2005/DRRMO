import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyRequest extends Document {
  _id: mongoose.Types.ObjectId;
  type: string;
  description: string;
  status: string;
  priority: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    barangay: string;
  };
  reportedBy: mongoose.Types.ObjectId;
  assignedResponder?: mongoose.Types.ObjectId;
  mediaUrls?: string[];
  verifiedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyRequestSchema = new Schema<IEmergencyRequest>(
  {
    type: {
      type: String,
      required: true,
      enum: ['medical', 'fire', 'accident', 'flood', 'earthquake', 'other'],
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'acknowledged', 'responding', 'resolved', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true },
      barangay: { type: String, required: true },
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedResponder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    mediaUrls: [String],
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
  },
  { timestamps: true }
);

emergencyRequestSchema.index({ status: 1, priority: -1, 'location.barangay': 1 });

export const EmergencyRequest = mongoose.model<IEmergencyRequest>('EmergencyRequest', emergencyRequestSchema);
