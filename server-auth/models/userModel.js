import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      minLength: 3,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,
        'please enter a valid email',
      ],
    },
    password: { type: String, minLength: 3 },
    picture: {
      type: String,
      default:
        'https://static.vecteezy.com/system/resources/previews/002/318/271/non_2x/user-profile-icon-free-vector.jpg',
    },
    rootDirId: { type: Schema.Types.ObjectId },
    // Google Drive fields
    googleId: { type: String },
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String },
    googleDriveSyncPreference: {
      type: String,
      enum: ['metadata_only', 'full_file'],
      default: 'metadata_only',
    },
    rootGoogleDriveName: {
      type: String,
      default: 'Google Drive',
    },
    googleDriveRootDirId: { type: Schema.Types.ObjectId },
    lastSyncTime: { type: Date },
    googleDriveSyncToken: { type: String },
  },
  {
    timestamps: true,
    strict: 'throw',
  },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model('User', userSchema);
