import { connect } from 'mongoose';

export const connectDB = () => {
  try {
    connect(process.env.MONGODB_URI);
    console.log('DB connected');
  } catch (error) {
    console.error('Error connecting to DB:', error);
  }
};
