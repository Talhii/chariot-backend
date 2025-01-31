import mongoose from 'mongoose';

const pieceSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    currentSectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    status: {
      type: String,
      enum: ['Pending', 'InProgress', 'Flagged', 'Completed'],
      required: true
    },
    history: [
      {
        section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: false },
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
        timestamp: { type: Date, required: false },
        photoUrl: { type: String, required: false },
        notes: { type: String },
        flagged: { type: Boolean, required: false }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Piece = mongoose.model('Piece', pieceSchema);

export default Piece;
