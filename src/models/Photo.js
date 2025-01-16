import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema(
  {
    photoId: {
      type: String,
      required: true,
      unique: true
    },
    pieceId: {
      type: String,
      required: true
    },
    stage: {
      type: Number,
      required: true
    },
    workerId: {
      type: String,
      required: true
    },
    photoUrl: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Photo = mongoose.model('Photo', photoSchema);

export default Photo;
