import mongoose from 'mongoose';

const pieceSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    refNumber: {
      type: String,
      required: true,
      unique: true
    },
    dimensions: {
      type: String,
      required: true
    },
    currentStage: { type: mongoose.Schema.Types.ObjectId, ref: 'Stage', required: true },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Flagged', 'Completed'],
      required: true
    },
    qrCode: {
      type: String,
      required: true
    },
    flagged: {
      type: Boolean,
      required: true
    },
    history: [
      {
        stage: { type: Number, required: true },
        workerId: { type: String, required: true },
        timestamp: { type: Date, required: true },
        photoUrl: { type: String, required: true },
        notes: { type: String },
        flagged: { type: Boolean, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Piece = mongoose.model('Piece', pieceSchema);

export default Piece;
