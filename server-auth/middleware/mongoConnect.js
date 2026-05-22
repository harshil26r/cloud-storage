import { connect } from 'mongoose';

export const connectDB = () => {
  try {
    connect(
      'mongodb://admin:admin@localhost:27017/storageDB?replicaSet=storageDB&authSource=admin',
    );
    console.log('DB connected');
  } catch (error) {
    console.log('Eroor while connecting DB', error);
  }
};
