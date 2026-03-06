const AnnouncementRepository = require('../repositories/AnnouncementRepository');

class AnnouncementController {
  // GET /api/announcements - public, returns active announcements
  async getActive(req, res) {
    try {
      const announcements = await AnnouncementRepository.findActive();
      res.status(200).json({ success: true, announcements });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/announcements/all - admin only, returns all
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await AnnouncementRepository.findAll({ page: parseInt(page), limit: parseInt(limit) });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/announcements - admin/staff
  async create(req, res) {
    try {
      const { title, body, type, isPinned, isActive, expiresAt } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Title is required' });
      if (!body || !body.trim()) return res.status(400).json({ success: false, message: 'Body is required' });

      const announcement = await AnnouncementRepository.create({
        title: title.trim(),
        body: body.trim(),
        type: type || 'notice',
        isPinned: isPinned || false,
        isActive: isActive !== undefined ? isActive : true,
        expiresAt: expiresAt || null,
        createdBy: req.user._id,
      });

      const populated = await AnnouncementRepository.model
        .findById(announcement._id)
        .populate('createdBy', 'name');

      res.status(201).json({ success: true, announcement: populated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // PUT /api/announcements/:id - admin/staff
  async update(req, res) {
    try {
      const ann = await AnnouncementRepository.findById(req.params.id);
      if (!ann) return res.status(404).json({ success: false, message: 'Announcement not found' });

      const { title, body, type, isPinned, isActive, expiresAt } = req.body;
      const updates = {};
      if (title !== undefined) updates.title = title.trim();
      if (body !== undefined) updates.body = body.trim();
      if (type !== undefined) updates.type = type;
      if (isPinned !== undefined) updates.isPinned = isPinned;
      if (isActive !== undefined) updates.isActive = isActive;
      if (expiresAt !== undefined) updates.expiresAt = expiresAt || null;

      const updated = await AnnouncementRepository.updateById(req.params.id, updates);
      const populated = await AnnouncementRepository.model
        .findById(updated._id)
        .populate('createdBy', 'name');

      res.status(200).json({ success: true, announcement: populated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/announcements/:id - admin/staff
  async delete(req, res) {
    try {
      const ann = await AnnouncementRepository.findById(req.params.id);
      if (!ann) return res.status(404).json({ success: false, message: 'Announcement not found' });

      await AnnouncementRepository.deleteById(req.params.id);
      res.status(200).json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AnnouncementController();
