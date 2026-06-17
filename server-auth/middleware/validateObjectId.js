import mongoose from 'mongoose';

export const validateParams = (...paramNames) => {
  return (req, res, next) => {
    for (const name of paramNames) {
      const val = req.params[name];
      if (val && val !== 'null' && val !== 'undefined') {
        if (!mongoose.Types.ObjectId.isValid(val)) {
          return res.status(400).json({ error: `Invalid ${name} format` });
        }
      }
    }
    next();
  };
};
