import mongoose, { Schema, Document } from 'mongoose';

export interface IAgent extends Document {
  username: string;
  password: string;
  createdAt: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export default (mongoose.models.Agent as mongoose.Model<IAgent>) ||
  mongoose.model<IAgent>('Agent', AgentSchema);
