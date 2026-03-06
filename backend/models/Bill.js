const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  billNumber: {
    type: String,
    unique: true,
  },
  subtotal: Number,
  tax: Number,
  total: Number,
  paymentMethod: {
    type: String,
    enum: ['cash', 'esewa', 'khalti', 'bank'],
    default: 'cash',
  },
  status: {
    type: String,
    enum: ['requested', 'generated', 'paid'],
    default: 'generated',
  },
  requestedBy: {
    type: String,
    enum: ['customer', 'staff', 'admin'],
    default: 'staff',
  },
  callWaiter: {
    type: Boolean,
    default: false,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: Date,
}, { timestamps: true });

billSchema.pre('save', async function () {
  if (!this.billNumber) {
    const count = await mongoose.model('Bill').countDocuments();
    this.billNumber = `BILL-${String(count + 1).padStart(6, '0')}`;
  }
});

module.exports = mongoose.model('Bill', billSchema);
