import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true
    },
    customerName: {
      type: String,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['InProgress', 'Completed'],
      required: true
    },
    drawings: [
      {
        url: { type: String, required: true }
      }
    ],
    takeOffData: [
      {
        code: { type: String, required: false },
        noOfPiece: { type: String, required: false }
      },
    ]
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
