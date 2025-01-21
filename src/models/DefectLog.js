import mongoose from 'mongoose';

const defectLogSchema = new mongoose.Schema(
  {
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
    description: {
      type: String,
      required: true
    },
    photoUrl: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Reported', 'Resolved', 'Rework Required'],
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    resolvedBy: {
      type: String
    },
    resolutionNotes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const DefectLog = mongoose.model('DefectLog', defectLogSchema);

export default DefectLog;
