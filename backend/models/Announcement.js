const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  body: {
    type: String,
    required: [true, 'Body is required'],
    trim: true,
    maxlength: [1000, 'Body cannot exceed 1000 characters'],
  },
  type: {
    type: String,
    enum: ['offer', 'event', 'notice', 'closure', 'update'],
    default: 'notice',
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Auto-deactivate expired announcements via a virtual or index
announcementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true } } });

module.exports = mongoose.model('Announcement', announcementSchema);
