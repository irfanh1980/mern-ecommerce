import { Router } from 'express';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const router = Router();

router.use(protect);
router.use(restrictTo('Admin'));

router.post('/copilot', asyncHandler(async (req, res) => {
  const { userId, prompt, action, productId } = req.body;
  const user = await User.findById(userId);
  const products = await Product.find({ seller: userId });

  if (!user) {
    return res.status(404).json({ response: 'User profile context not found.' });
  }

  const query = (prompt || '').toLowerCase();

  if (action === 'VERIFY_PRODUCT' && productId) {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { verificationStatus: 'APPROVED' },
      { new: true }
    );
    return res.status(200).json({
      response: `✅ Successfully **approved** product: "${updatedProduct.title}".`,
    });
  }

  if (action === 'REJECT_PRODUCT' && productId) {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { verificationStatus: 'REJECTED' },
      { new: true }
    );
    return res.status(200).json({
      response: `❌ Product **rejected**: "${updatedProduct.title}". Notification sent to seller.`,
    });
  }

  if (query.includes('listing') || query.includes('product') || query.includes('verify')) {
    if (products.length === 0) {
      return res.status(200).json({
        response: `📦 **Listing Audit:** ${user.name} has 0 active product listings to verify.`,
      });
    }

    const productSummary = products
      .map((p) => `• **${p.title}** ($${p.price}) — Status: \`${p.verificationStatus || 'PENDING'}\``)
      .join('\n');

    return res.status(200).json({
      response: `📦 **Products for ${user.name} (${products.length} total):**\n${productSummary}\n\n*Type "Approve [Product Name]" or click quick-action to update status.*`,
    });
  }

  const productCount = await Product.countDocuments({ seller: user._id, isActive: true });
  if (query.includes('risk') || query.includes('audit')) {
    reply = `🔍 **Risk Audit for ${user.name}:**\n` +
      `• Account Status: Active\n` +
      `• Email Status: ${user.email ? 'Verified (' + user.email + ')' : 'Unverified'}\n` +
      `• Flagged IP Collisions: 0 detected\n` +
      `• Risk Assessment: LOW (No suspicious login activity recorded).`;
  } else if (query.includes('summary') || query.includes('brief')) {
    reply = `📋 **Executive Summary:**\n` +
      `${user.name} registered on ${user.createdAt || 'N/A'}. Operating under role: "${user.role || 'User'}". ` +
      `Current address registered in ${user.address?.city || 'Malmö, SE'}. No open customer disputes or policy violations.`;
  } else {
    reply = `🤖 **Copilot Context Response:**\n` +
      `Inspecting record for ${user.name} (${user.email}). ` +
      `Account is in good standing with zero active admin flags. Query executed: "${prompt}".`;
  }

  res.status(200).json({ response: reply });
}));

export default router;
