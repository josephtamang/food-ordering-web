const BaseRepository = require('./BaseRepository');
const User = require('../../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.model.findOne({ email });
  }

  async findByEmailWithPassword(email) {
    return this.model.findOne({ email }).select('+password');
  }

  async findByIdWithPassword(id) {
    return this.model.findById(id).select('+password');
  }

  async findByResetToken(token) {
    return this.model.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });
  }
}

module.exports = new UserRepository();
