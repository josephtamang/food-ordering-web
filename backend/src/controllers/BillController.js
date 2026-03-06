const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const BillRepository = require('../repositories/BillRepository');
const OrderRepository = require('../repositories/OrderRepository');
const { createBillSchema, billQuerySchema, buildBillFilter } = require('../dtos/bill.dto');

class BillController {
  async generate(req, res) {
    try {
      const result = createBillSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });
      const dto = result.data;

      const order = await OrderRepository.findById(req.params.orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const existing = await BillRepository.findByOrder(order._id);
      if (existing) return res.status(200).json({ success: true, bill: existing });

      const bill = await BillRepository.create({
        order: order._id, user: order.user, subtotal: order.subtotal,
        tax: order.tax, total: order.total, paymentMethod: dto.paymentMethod,
      });

      res.status(201).json({ success: true, bill });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const query = billQuerySchema.parse(req.query);
      const filter = buildBillFilter(query);
      const result = await BillRepository.findWithPagination(filter, { page: query.page, limit: query.limit });
      res.status(200).json({ success: true, bills: result.docs, pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const bill = await BillRepository.findByIdFull(req.params.id);
      if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
      res.status(200).json({ success: true, bill });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async markPaid(req, res) {
    try {
      const bill = await BillRepository.updateById(req.params.id, {
        isPaid: true, paidAt: new Date(), paymentMethod: req.body.paymentMethod || 'cash',
      });
      if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
      await OrderRepository.updateById(bill.order, { isPaid: true });
      res.status(200).json({ success: true, bill });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async requestBill(req, res) {
    try {
      const order = await OrderRepository.findById(req.params.orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      if (!['served', 'completed'].includes(order.status)) {
        return res.status(400).json({ success: false, message: 'Order must be served or completed' });
      }
      const existing = await BillRepository.findByOrder(order._id);
      if (existing) return res.status(200).json({ success: true, bill: existing });

      const bill = await BillRepository.create({
        order: order._id, user: order.user,
        subtotal: order.subtotal, tax: order.tax, total: order.total,
        paymentMethod: req.body.paymentMethod || 'cash',
        status: 'requested', requestedBy: 'customer',
        callWaiter: req.body.callWaiter || false,
      });
      res.status(201).json({ success: true, bill });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyBills(req, res) {
    try {
      const Bill = require('../../models/Bill');
      const bills = await Bill.find({ user: req.user._id }).populate('order').sort('-createdAt');
      res.status(200).json({ success: true, bills });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async downloadPDF(req, res) {
    try {
      const bill = await BillRepository.findByIdFull(req.params.id);
      if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

      const qrData = JSON.stringify({
        billNumber: bill.billNumber,
        total: bill.total,
        restaurant: 'Foody',
        paymentMethods: ['esewa', 'khalti', 'bank'],
      });
      const qrImageUrl = await QRCode.toDataURL(qrData, { width: 150 });
      const qrBuffer = Buffer.from(qrImageUrl.split(',')[1], 'base64');

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=bill-${bill.billNumber}.pdf`);
      doc.pipe(res);

      // Header
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#c47a5a').text('FOODY', { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor('#666').text('Restaurant & Cafe', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0d5cc').stroke();
      doc.moveDown(0.8);

      // Bill Info
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#333').text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666');
      doc.text(`Bill No: ${bill.billNumber}`, 50);
      doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50);
      doc.text(`Customer: ${bill.user?.name || 'Guest'}`, 50);
      if (bill.order?.tableNumber) doc.text(`Table: ${bill.order.tableNumber}`, 50);
      doc.text(`Payment: ${bill.paymentMethod.toUpperCase()}`, 50);
      doc.text(`Status: ${bill.isPaid ? 'PAID' : 'UNPAID'}`, 50);
      doc.moveDown(1);

      // Items Table
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#c47a5a').lineWidth(2).stroke();
      doc.moveDown(0.3);
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333');
      doc.text('Item', 50, tableTop, { width: 220 });
      doc.text('Qty', 280, tableTop, { width: 60, align: 'center' });
      doc.text('Price', 350, tableTop, { width: 80, align: 'right' });
      doc.text('Total', 450, tableTop, { width: 95, align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0d5cc').lineWidth(1).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(10).fillColor('#444');
      const items = bill.order?.items || [];
      items.forEach(item => {
        const y = doc.y;
        doc.text(item.name || 'Item', 50, y, { width: 220 });
        doc.text(String(item.quantity), 280, y, { width: 60, align: 'center' });
        doc.text(`Rs ${item.price}`, 350, y, { width: 80, align: 'right' });
        doc.text(`Rs ${item.price * item.quantity}`, 450, y, { width: 95, align: 'right' });
        doc.moveDown(0.5);
      });

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0d5cc').stroke();
      doc.moveDown(0.5);

      // Totals
      const totalsX = 380;
      doc.font('Helvetica').fontSize(11).fillColor('#666');
      doc.text('Subtotal:', totalsX, doc.y, { width: 80 });
      doc.text(`Rs ${bill.subtotal}`, 460, doc.y - 13, { width: 85, align: 'right' });
      doc.moveDown(0.3);
      doc.text('Tax (5%):', totalsX, doc.y, { width: 80 });
      doc.text(`Rs ${bill.tax}`, 460, doc.y - 13, { width: 85, align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(totalsX, doc.y).lineTo(545, doc.y).strokeColor('#c47a5a').lineWidth(2).stroke();
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#c47a5a');
      doc.text('TOTAL:', totalsX, doc.y, { width: 80 });
      doc.text(`Rs ${bill.total}`, 460, doc.y - 16, { width: 85, align: 'right' });
      doc.moveDown(2);

      // QR Code
      doc.font('Helvetica').fontSize(10).fillColor('#666').text('Scan to Pay via eSewa, Khalti or Bank Transfer:', { align: 'center' });
      doc.moveDown(0.3);
      doc.image(qrBuffer, (doc.page.width - 120) / 2, doc.y, { width: 120 });
      doc.moveDown(8);
      doc.fontSize(9).fillColor('#999').text('Thank you for dining with us!', { align: 'center' });
      doc.text('Foody - Your Favorite Restaurant', { align: 'center' });

      doc.end();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new BillController();
