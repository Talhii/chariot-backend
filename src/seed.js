import mongoose from 'mongoose';
import Section from './models/Section.js';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

dotenv.config();
// Array of seed data for sections
const sectionsData = [
  {
    number: 1,
    name: 'Cutting',
    checklist: [
      { description: 'Check blade sharpness', isMandatory: true },
      { description: 'Ensure proper material alignment', isMandatory: true },
    ]
  },
  {
    number: 2,
    name: 'Sink Cutout',
    checklist: [
      { description: 'Measure sink area dimensions', isMandatory: true },
      { description: 'Ensure cutout is properly aligned', isMandatory: true },
    ]
  },
  {
    number: 3,
    name: 'Polishing Top',
    checklist: [
      { description: 'Check polishing equipment settings', isMandatory: true },
      { description: 'Ensure the surface is smooth', isMandatory: true },
    ]
  },
  {
    number: 4,
    name: 'Sink and Edge Polishing',
    checklist: [
      { description: 'Inspect sink edges for smoothness', isMandatory: true },
      { description: 'Polish edges to match the top surface', isMandatory: true },
    ]
  },
  {
    number: 5,
    name: 'QC',
    checklist: [
      { description: 'Check overall quality of the product', isMandatory: true },
      { description: 'Ensure all measurements are accurate', isMandatory: true },
    ]
  }
];

// MongoDB seeder function
const seedDatabase = async () => {
  try {
    connectDB().catch((error) => {
      console.error('Error connecting to database:', error);
      process.exit(1);
    });

    console.log('Connected to MongoDB.');

    // Check if any sections already exist
    const existingSections = await Section.find({});

    if (existingSections.length > 0) {
      console.log('Sections already exist. Seeder will not run.');
      mongoose.connection.close();
      return; // Exit the function if sections already exist
    }

    // Insert new sections
    await Section.insertMany(sectionsData);

    console.log('Sections seeded successfully!');

    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding the database:', error);
    mongoose.connection.close();
  }
};

// Run the seeder
seedDatabase();
