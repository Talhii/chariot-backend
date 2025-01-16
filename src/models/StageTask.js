import mongoose from 'mongoose';

const stageTaskSchema = new mongoose.Schema(
  {
    stage: {
      type: Number,
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

const StageTask = mongoose.model('StageTask', stageTaskSchema);

export default StageTask;
