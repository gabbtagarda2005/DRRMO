import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: string;
  status: string;
  quantity: number;
  location: string;
  assignedTo?: mongoose.Types.ObjectId;
  specifications: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<IResource>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['ambulance', 'vehicle', 'equipment', 'supplies', 'personnel'],
    },
    status: {
      type: String,
      required: true,
      enum: ['available', 'in_use', 'maintenance', 'unavailable'],
      default: 'available',
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    location: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    specifications: Schema.Types.Mixed,
  },
  { timestamps: true }
);

resourceSchema.index({ type: 1, status: 1 });

export const Resource = mongoose.model<IResource>('Resource', resourceSchema);
