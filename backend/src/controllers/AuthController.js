const crypto = require('crypto');
const UserRepository = require('../repositories/UserRepository');
const { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema } = require('../dtos/auth.dto');
const sendEmail = require('../utils/sendEmail');

class AuthController {
  static sendTokenResponse(user, statusCode, res) {
    const token = user.getSignedJwtToken();
    const options = {
      expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };
    const { password, ...userData } = user.toObject();
    res.status(statusCode).cookie('token', token, options).json({ success: true, token, user: userData });
  }

  async register(req, res) {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });
      const dto = result.data;

      const existing = await UserRepository.findByEmail(dto.email);
      if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

      const user = await UserRepository.create(dto);
      AuthController.sendTokenResponse(user, 201, res);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async login(req, res) {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });
      const dto = result.data;

      const user = await UserRepository.findByEmailWithPassword(dto.email);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const isMatch = await user.matchPassword(dto.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      AuthController.sendTokenResponse(user, 200, res);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async logout(req, res) {
    res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.status(200).json({ success: true, message: 'Logged out' });
  }

  async getMe(req, res) {
    res.status(200).json({ success: true, user: req.user });
  }

  async updateProfile(req, res) {
    try {
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });
      const dto = result.data;

      const updates = {};
      if (dto.name) updates.name = dto.name;
      if (dto.email) updates.email = dto.email;

      const user = await UserRepository.updateById(req.user._id, updates);
      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updatePassword(req, res) {
    try {
      const result = updatePasswordSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });
      const dto = result.data;

      const user = await UserRepository.findByIdWithPassword(req.user._id);
      const isMatch = await user.matchPassword(dto.currentPassword);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

      user.password = dto.newPassword;
      await user.save();
      AuthController.sendTokenResponse(user, 200, res);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async forgotPassword(req, res) {
    try {
      const user = await UserRepository.findByEmail(req.body.email);
      if (!user) return res.status(404).json({ success: false, message: 'No user with that email' });

      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      const html = `<h1>Password Reset</h1><p>Click below to reset your Foody password:</p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#c47a5a;color:white;border-radius:25px;text-decoration:none;">Reset Password</a><p>Expires in 10 minutes.</p>`;

      try {
        await sendEmail({ email: user.email, subject: 'Foody - Password Reset', html });
        res.status(200).json({ success: true, message: 'Reset email sent' });
      } catch {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500).json({ success: false, message: 'Email could not be sent' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
      const user = await UserRepository.findByResetToken(resetPasswordToken);
      if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      AuthController.sendTokenResponse(user, 200, res);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload an image' });
      }
      const avatar = `/uploads/${req.file.filename}`;
      const user = await UserRepository.updateById(req.user._id, { avatar });
      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuthController();
