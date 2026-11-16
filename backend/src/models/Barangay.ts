import mongoose, { Schema, Document } from 'mongoose';

export interface IBarangay extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  population: number;
  location: {
    latitude: number;
    longitude: number;
  };
  officials: mongoose.Types.ObjectId[];
  resources?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const barangaySchema = new Schema<IBarangay>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    population: {
      type: Number,
      default: 0,
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
    officials: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    resources: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Resource',
      },
    ],
  },
  { timestamps: true }
);

export const Barangay = mongoose.model<IBarangay>('Barangay', barangaySchema);
