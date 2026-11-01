import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createVerificationToken, hashToken } from '../utils/generateToken.js';
import { sendVerificationEmail } from '../utils/emailSender.js';
import { clearFailures, isLocked, keyFor, recordFailure } from '../utils/loginAttempts.js';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between verification emails

const lastResendAt = new Map();

const frontendUrl = () => process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const isDevMode = () => process.env.NODE_ENV !== 'production';

const issueVerification = async (user) => {
  const { token, hashedToken } = createVerificationToken();
  user.verificationToken = hashedToken;
  user.verificationExpires = new Date(Date.now() + VERIFICATION_TTL_MS);
  await user.save();

  const verificationUrl = `${frontendUrl()}/verify-email/${token}`;
  const delivery = await sendVerificationEmail({
    to: user.email,
    name: user.name,
    verificationUrl,
  });

  return {
    verificationUrl,
    delivered: Boolean(delivery?.delivered),
    devMode: Boolean(delivery?.devMode),
  };
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const sendTokenResponse = (user, statusCode, res, extra = {}) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      address: user.address,
      isVerified: user.isVerified,
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    },
    ...extra,
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'Buyer',
    });

    // The account stays unverified until the user opens the link in the email.
    // Never block registration on mail delivery.
    let verification = { delivered: false, devMode: false, verificationUrl: null };
    try {
      verification = await issueVerification(user);
    } catch (mailError) {
      console.error('Failed to send verification email:', mailError.message);
    }

    const extra = {
      verificationRequired: true,
      verificationEmailSent: verification.delivered,
      message: verification.delivered
        ? 'Account created. Check your inbox to verify your email address.'
        : 'Account created, but the verification email could not be sent because email delivery is not configured on the server.',
    };

    // Without SMTP there is no inbox to check, so hand the link back in dev so
    // the user can still confirm the address by opening it themselves.
    if (!verification.delivered && verification.devMode && isDevMode()) {
      extra.verificationUrl = verification.verificationUrl;
      extra.message =
        'Account created. Email delivery is not configured on the server - open the verification link below to verify your address.';
    }

    sendTokenResponse(user, 201, res, extra);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const attemptKey = keyFor(req);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      recordFailure(attemptKey);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      recordFailure(attemptKey);
      if (isLocked(attemptKey)) {
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please try again in a few minutes.',
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    clearFailures(attemptKey);

    // Login never verifies an account - the user has to confirm the address
    // themselves through the link in the email.
    sendTokenResponse(user, 200, res, {
      verificationRequired: !user.isEmailVerified,
      message: user.isEmailVerified
        ? 'Logged in successfully.'
        : 'Logged in. Please verify your email address to activate your account.',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, avatar, address, role } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (role !== undefined) {
      if (role === 'Admin' && req.user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Not allowed to set Admin role' });
      }
      user.role = role;
    }
    if (address !== undefined) {
      user.address = {
        street: address.street ?? user.address?.street ?? '',
        city: address.city ?? user.address?.city ?? '',
        state: address.state ?? user.address?.state ?? '',
        zipCode: address.zipCode ?? user.address?.zipCode ?? '',
        country: address.country ?? user.address?.country ?? '',
      };
    }

    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is missing' });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      verificationToken: hashedToken,
    }).select('+verificationToken +verificationExpires');

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'This verification link is invalid or has already been used' });
    }

    if (user.verificationExpires && user.verificationExpires.getTime() < Date.now()) {
      user.verificationToken = undefined;
      user.verificationExpires = undefined;
      await user.save();
      return res
        .status(400)
        .json({ success: false, message: 'This verification link has expired. Please request a new one.' });
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Your email address has been verified',
      isEmailVerified: true,
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Your email address is already verified' });
    }

    const userKey = user._id.toString();
    const lastSent = lastResendAt.get(userKey);
    if (lastSent) {
      const elapsed = Date.now() - lastSent;
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds} second(s) before requesting another verification email.`,
        });
      }
    }
    lastResendAt.set(userKey, Date.now());

    let verification;
    try {
      verification = await issueVerification(user);
    } catch (mailError) {
      console.error('Failed to send verification email:', mailError.message);
      return res.status(502).json({
        success: false,
        message: `The verification email could not be sent: ${mailError.message}`,
        emailDeliveryConfigured: true,
        emailDeliveryFailed: true,
      });
    }

    if (!verification.delivered) {
      const payload = {
        success: false,
        message:
          'Email delivery is not configured on the server, so no email was sent. Set SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env.',
        emailDeliveryConfigured: false,
      };

      // Dev only: hand the link back so the user can still verify by opening it.
      if (verification.devMode && isDevMode()) {
        payload.verificationUrl = verification.verificationUrl;
        payload.message =
          'Email delivery is not configured on the server, so no email was sent. Open the verification link below to confirm your address.';
      }

      return res.status(503).json(payload);
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent. Check your inbox for the link.',
      verificationEmailSent: true,
    });
  } catch (error) {
    next(error);
  }
};
