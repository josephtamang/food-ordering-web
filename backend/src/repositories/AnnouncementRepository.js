const BaseRepository = require('./BaseRepository');
const Announcement = require('../../models/Announcement');

class AnnouncementRepository extends BaseRepository {
  constructor() {
    super(Announcement);
  }

  async findActive() {
    const now = new Date();
    return this.model
      .find({
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      })
      .populate('createdBy', 'name')
      .sort({ isPinned: -1, createdAt: -1 });
  }

  async findAll({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find()
        .populate('createdBy', 'name')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.model.countDocuments(),
    ]);
    return { announcements: docs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}

module.exports = new AnnouncementRepository();
