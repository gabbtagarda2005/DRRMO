import mongoose, { Schema, Document } from 'mongoose';

export interface IResponder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  assignedIncidents: mongoose.Types.ObjectId[];
  resourceAssigned?: mongoose.Types.ObjectId;
  team?: string;
  certifications: string[];
  rating: number;
  totalIncidentsResolved: number;
  createdAt: Date;
  updatedAt: Date;
}

const responderSchema = new Schema<IResponder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['available', 'on_duty', 'responding', 'on_scene', 'off_duty'],
      default: 'off_duty',
    },
    currentLocation: {
      latitude: Number,
      longitude: Number,
    },
    assignedIncidents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Incident',
      },
    ],
    resourceAssigned: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
    },
    team: String,
    certifications: [String],
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    totalIncidentsResolved: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

responderSchema.index({ status: 1, 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

export const Responder = mongoose.model<IResponder>('Responder', responderSchema);
