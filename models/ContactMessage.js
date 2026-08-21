import { Schema, model, models } from 'mongoose';

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    // one of phone/email required -- validated in the API route, not here,
    // so a partial submission doesn't get silently dropped by a mongoose
    // validation error with no useful message back to the user.
    phone: String,
    email: String,
    subject: String,
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'read'], default: 'new' },
  },
  { timestamps: true }
);

export default models.ContactMessage || model('ContactMessage', ContactMessageSchema);
