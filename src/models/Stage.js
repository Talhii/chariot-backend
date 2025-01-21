import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema(
  {
    stage: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      enum: ['Cutting', 'Sink Cutout', 'Polishing Top', 'Sink and Edge Polishing', 'QC'],
      required: true
    },
    checklist: [
      {
        taskId: { type: String, required: true },
        description: { type: String, required: true },
        isMandatory: { type: Boolean, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Stage = mongoose.model('Stage', stageSchema);

export default Stage;
