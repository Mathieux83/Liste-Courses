import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  subscription: { type: Object, required: true }
});

export default mongoose.model('Subscription', subscriptionSchema);