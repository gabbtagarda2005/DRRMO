import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: string;
  relatedIncident?: mongoose.Types.ObjectId;
  recipients: mongoose.Types.ObjectId[];
  isRead: Map<string, boolean>;
  createdBy?: mongoose.Types.ObjectId;
  audience?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['alert', 'update', 'warning', 'info'],
    },
    relatedIncident: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
    },
    recipients: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isRead: {
      type: Map,
      of: Boolean,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    audience: {
      type: String,
      default: 'direct',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipients: 1, createdAt: -1 });
notificationSchema.index({ createdBy: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
