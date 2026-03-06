const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Bill = require('../../models/Bill');

class StatsController {
  async getDashboardStats(req, res) {
    try {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const lastMonthStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const [
        totalOrders, pendingOrders, totalProducts, totalUsers, totalBills,
        revenueResult, ordersByStatus, dailyOrders, topProducts,
        todayOrders, todayRevenueResult, monthlyOrdersResult, lastMonthOrdersResult,
        categoryBreakdown, paymentMethodBreakdown, avgOrderValueResult,
        hourlyOrders,
      ] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'pending' }),
        Product.countDocuments(),
        User.countDocuments(),
        Bill.countDocuments(),
        Order.aggregate([
          { $match: { status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.aggregate([
          { $match: { createdAt: { $gte: weekAgo } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$total' } } },
          { $sort: { _id: 1 } },
        ]),
        Order.aggregate([
          { $unwind: '$items' },
          { $group: { _id: '$items.name', totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
          { $sort: { totalQuantity: -1 } },
          { $limit: 5 },
        ]),
        Order.countDocuments({ createdAt: { $gte: todayStart } }),
        Order.aggregate([
          { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: todayStart } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Order.aggregate([
          { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: monthAgo } } },
          { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: lastMonthStart, $lt: monthAgo } } },
          { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
        ]),
        // Category breakdown
        Order.aggregate([
          { $unwind: '$items' },
          { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
          { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
          { $lookup: { from: 'categories', localField: 'productInfo.category', foreignField: '_id', as: 'categoryInfo' } },
          { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
          { $group: {
            _id: { $ifNull: ['$categoryInfo.name', 'Other'] },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            totalQuantity: { $sum: '$items.quantity' },
          }},
          { $sort: { totalRevenue: -1 } },
          { $limit: 6 },
        ]),
        // Payment method breakdown
        Bill.aggregate([
          { $match: { isPaid: true } },
          { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$total' } } },
          { $sort: { count: -1 } },
        ]),
        // Average order value
        Order.aggregate([
          { $match: { status: { $ne: 'cancelled' } } },
          { $group: { _id: null, avg: { $avg: '$total' } } },
        ]),
        // Hourly orders today
        Order.aggregate([
          { $match: { createdAt: { $gte: todayStart } } },
          { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const thisMonth = monthlyOrdersResult[0] || { total: 0, count: 0 };
      const lastMonth = lastMonthOrdersResult[0] || { total: 0, count: 0 };
      const revenueGrowth = lastMonth.total > 0
        ? Number((((thisMonth.total - lastMonth.total) / lastMonth.total) * 100).toFixed(1))
        : null;
      const orderGrowth = lastMonth.count > 0
        ? Number((((thisMonth.count - lastMonth.count) / lastMonth.count) * 100).toFixed(1))
        : null;

      res.status(200).json({
        success: true,
        stats: {
          totalOrders,
          pendingOrders,
          totalProducts,
          totalUsers,
          totalBills,
          totalRevenue: revenueResult[0]?.total || 0,
          todayOrders,
          todayRevenue: todayRevenueResult[0]?.total || 0,
          avgOrderValue: avgOrderValueResult[0]?.avg || 0,
          revenueGrowth,
          orderGrowth,
          ordersByStatus: Object.fromEntries(ordersByStatus.map(s => [s._id, s.count])),
          dailyOrders,
          topProducts,
          categoryBreakdown,
          paymentMethodBreakdown,
          hourlyOrders,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new StatsController();
