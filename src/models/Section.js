import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    checklist: [
      {
        description: { type: String, required: true },
        isMandatory: { type: Boolean, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Section = mongoose.model('Section', sectionSchema);

export default Section;
