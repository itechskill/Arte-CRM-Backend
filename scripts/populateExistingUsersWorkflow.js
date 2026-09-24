const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Quotation = require('../models/Quotation');
const SalesOrder = require('../models/SalesOrder');
const DeliveryNote = require('../models/DeliveryNote');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Campaign = require('../models/Campaign');
const AuditLog = require('../models/AuditLog');
const Attendance = require('../models/Attendance');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing non-user collections
  await Promise.all([
    Client.deleteMany({}), Lead.deleteMany({}), Deal.deleteMany({}),
    Quotation.deleteMany({}), SalesOrder.deleteMany({}), DeliveryNote.deleteMany({}),
    Invoice.deleteMany({}), Expense.deleteMany({}), Project.deleteMany({}),
    Task.deleteMany({}), Campaign.deleteMany({}), AuditLog.deleteMany({}),
    Attendance.deleteMany({})
  ]);
  console.log('Cleared existing data.');

  // Fetch users created by the client
  const ceo = await User.findOne({ role: 'ceo' });
  const admin = await User.findOne({ role: 'admin' });
  const hr = await User.findOne({ role: 'hr_manager' });
  const salesManager = await User.findOne({ role: 'sales_manager' });
  const pm = await User.findOne({ role: 'project_manager' });
  const accountant = await User.findOne({ role: 'accountant' });
  const marketing = await User.findOne({ role: 'marketing' });
  const employee = await User.findOne({ role: 'employee' }); // acting as sales rep / general dev

  if (!ceo || !salesManager || !pm || !accountant || !marketing || !employee) {
    console.log('Missing one or more required user roles. Ensure users are created.');
    process.exit(1);
  }

  // 1. Marketing creates campaigns and leads
  const cmp1 = await Campaign.create({
    name: 'Q3 Enterprise Expansion', type: 'Email', status: 'Active',
    budget: 15000, spent: 4500, startDate: new Date('2026-07-01'), endDate: new Date('2026-09-30'),
    createdBy: marketing._id, createdByName: marketing.fullName || 'Marketing User'
  });

  const client1 = await Client.create({
    name: 'Apex Global Corp', industry: 'Finance', status: 'Active',
    contactPerson: 'David Chen', email: 'd.chen@apexglobal.com', phone: '+1-555-0199',
    createdBy: marketing._id, address: '100 Wall St, NY'
  });

  const lead1 = await Lead.create({
    name: 'Enterprise CRM Migration', clientName: client1.name, client: client1._id, source: 'Website',
    status: 'Qualified', value: 85000, assignedTo: employee._id, createdBy: marketing._id
  });

  // 2. Sales rep works lead into a Deal and wins it
  const deal1 = await Deal.create({
    title: 'Apex Cloud Migration', clientName: client1.name, client: client1._id, lead: lead1._id,
    value: 85000, stage: 'Closed Won', expectedCloseDate: new Date(), closingDate: new Date(),
    assignedTo: employee._id, createdBy: employee._id
  });

  // 3. Sales rep generates Quotation, Sales Order, Delivery Note
  const quote = await Quotation.create({
    quotationNumber: 'QT-2026-1001', dealTitle: deal1.title, dealId: deal1._id, clientName: client1.name,
    totalAmount: 85000, status: 'Accepted', date: new Date(), validUntil: new Date(Date.now() + 86400000*30),
    createdBy: employee._id
  });

  const so = await SalesOrder.create({
    orderNumber: 'SO-2026-1001', clientName: client1.name,
    totalAmount: 85000, status: 'Confirmed', orderDate: new Date(), deliveryDate: new Date(),
    salesPerson: employee._id, createdBy: employee._id
  });

  const del = await DeliveryNote.create({
    deliveryNumber: 'DN-2026-1001', salesOrder: so._id, clientName: client1.name,
    status: 'Delivered', deliveryDate: new Date(), receivedBy: 'David Chen',
    createdBy: employee._id
  });

  // 4. Accountant generates Invoice and records payment
  const inv = await Invoice.create({
    invoiceNumber: 'INV-2026-1001', clientName: client1.name, client: client1._id, dealTitle: deal1.title,
    amount: 85000, status: 'Paid', issueDate: new Date(), dueDate: new Date(Date.now() + 86400000*15),
    createdBy: accountant._id
  });

  await Expense.create({
    title: 'Software Licenses - Q3', category: 'Software', amount: 12000,
    date: new Date(), status: 'Approved', requestedBy: employee._id, approvedBy: admin._id
  });

  // 5. Project Manager starts project based on the won deal
  const proj = await Project.create({
    name: 'Apex Cloud Deployment', client: client1._id, deal: deal1._id,
    status: 'In Progress', startDate: new Date(), endDate: new Date(Date.now() + 86400000*60),
    budget: 60000, manager: pm._id, team: [employee._id, pm._id]
  });

  await Task.create({
    title: 'Initial Server Setup', project: proj._id, assignedTo: employee._id,
    status: 'Completed', priority: 'High', dueDate: new Date()
  });
  
  await Task.create({
    title: 'Data Migration Phase 1', project: proj._id, assignedTo: employee._id,
    status: 'In Progress', priority: 'Medium', dueDate: new Date(Date.now() + 86400000*7)
  });

  // 6. Attendance for HR
  await Attendance.create({
    user: employee._id, date: new Date(), status: 'Present',
    checkIn: new Date(new Date().setHours(9, 0, 0, 0))
  });

  console.log('Successfully populated workflow for existing users.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
