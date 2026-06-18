import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoneNumber extends Document {
  number: string;
  assignedTo: string | null;
  status: 'pending' | 'connected' | 'not_connected';
  connected: boolean;
  notConnected: boolean;
  whatsappDone: boolean;
  remark: string;
  submittedAt: Date | null;
  uploadBatch: string;
  createdAt: Date;
}

const PhoneNumberSchema = new Schema<IPhoneNumber>(
  {
    number: { type: String, required: true, trim: true, unique: true },
    assignedTo: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'connected', 'not_connected'],
      default: 'pending',
    },
    connected: { type: Boolean, default: false },
    notConnected: { type: Boolean, default: false },
    whatsappDone: { type: Boolean, default: false },
    remark: { type: String, default: '', maxlength: 200 },
    submittedAt: { type: Date, default: null },
    uploadBatch: { type: String, required: true },
  },
  { timestamps: true }
);

export default (mongoose.models.PhoneNumber as mongoose.Model<IPhoneNumber>) ||
  mongoose.model<IPhoneNumber>('PhoneNumber', PhoneNumberSchema);
