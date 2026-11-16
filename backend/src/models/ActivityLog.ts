import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'create',
        'read',
        'update',
        'delete',
        'login',
        'logout',
        'verify',
        'assign',
        'status_change',
        'priority_override',
      ],
    },
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      required: true,
    },
    changes: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
