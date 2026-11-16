import mongoose, { Schema, Document } from 'mongoose';

export interface IEvacuationCenter extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  address: string;
  barangay: string;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  supplies: Record<string, number>;
  manager?: mongoose.Types.ObjectId;
  status: 'operational' | 'closed' | 'under_maintenance';
  createdAt: Date;
  updatedAt: Date;
}

const evacuationCenterSchema = new Schema<IEvacuationCenter>(
  {
    name: {
      type: String,
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
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    capacity: {
      type: Number,
      required: true,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
    },
    facilities: [String],
    supplies: Schema.Types.Mixed,
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['operational', 'closed', 'under_maintenance'],
      default: 'operational',
    },
  },
  { timestamps: true }
);

evacuationCenterSchema.index({ barangay: 1, status: 1 });

export const EvacuationCenter = mongoose.model<IEvacuationCenter>(
  'EvacuationCenter',
  evacuationCenterSchema
);
