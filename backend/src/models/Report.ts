import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: string;
  relatedIncident?: mongoose.Types.ObjectId;
  barangay?: string;
  details?: Record<string, unknown>;
  submittedBy: mongoose.Types.ObjectId;
  mediaUrls?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
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
      enum: ['damage_report', 'field_report', 'casualty_report', 'resource_report'],
    },
    relatedIncident: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
    },
    barangay: {
      type: String,
    },
    /** Structured payload, e.g. damage sector / structure counts or requested items. */
    details: Schema.Types.Mixed,
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaUrls: [String],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'processed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

reportSchema.index({ relatedIncident: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
