import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    phone: {
      type: String,
      unique: [true, 'Phone already exists'],
      required: [true, 'Phone number is required'],
      match: [/^09\d{9}$/, 'Invalid Iranian mobile number'],
    },
    username: {
      type: String,
    },
    image: {
      type: String,
    },
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Property',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = models.User || model('User', UserSchema);

export default User;
