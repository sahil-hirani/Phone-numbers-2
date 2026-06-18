import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleEntry extends Document {
  clientId: string;
  number: string;
  assignedTo: string;
  lastActivityDate: Date;
  activityCount: number;
  createdAt: Date;
}

const SaleEntrySchema = new Schema<ISaleEntry>(
  {
    clientId: { type: String, required: true, unique: true, trim: true, lowercase: true },
    number: { type: String, required: true, unique: true, trim: true },
    assignedTo: { type: String, required: true },
    lastActivityDate: { type: Date, required: true, default: Date.now },
    activityCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

SaleEntrySchema.index({ assignedTo: 1, lastActivityDate: -1 });

export default (mongoose.models.SaleEntry as mongoose.Model<ISaleEntry>) ||
  mongoose.model<ISaleEntry>('SaleEntry', SaleEntrySchema);
