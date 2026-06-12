import { connect } from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await connect(process.env.MONGODB_URI);
    console.log('DB connected');
    return conn;
  } catch (error) {
    console.error('Error connecting to DB:', error);
  }
};
