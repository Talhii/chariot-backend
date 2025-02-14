import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
  credentialID: String,
  publicKey: String,
  counter: Number,
  transports: [String],
});

const workerSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  displayName: String,
  challenge: String,
  credentials: [credentialSchema],
});

const Worker = mongoose.model('Worker', workerSchema);

export default Worker;
