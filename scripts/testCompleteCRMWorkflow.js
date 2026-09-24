const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Quotation = require('../models/Quotation');
const SalesOrder = require('../models/SalesOrder');
const DeliveryNote = require('../models/DeliveryNote');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Payroll = require('../models/Payroll');
const MaintenanceCharge = require('../models/MaintenanceCharge');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Performance = require('../models/Performance');
const Campaign = require('../models/Campaign');
const AuditLog = require('../models/AuditLog');
const SalesTarget = require('../models/SalesTarget');
const SalesActivity = require('../models/SalesActivity');

const runCompleteWorkflow = async () => {
  console.log('========================================================================');
  console.log('      NEXUS CRM COMPLETE REAL-TIME ENTERPRISE WORKFLOW & TEST SUITE     ');
  console.log('========================================================================\n');

  await connectDB();

  console.log('[1/10] Seeding / Verifying All 9 Department User Accounts...');

  const departmentsAndRoles = [
    { role: 'admin', fullName: 'System Administrator', email: (process.env.ADMIN_EMAIL || 'admin@yourcompany.com').toLowerCase(), department: 'Executive Administration' },
    { role: 'ceo', fullName: 'Marcus Vance', email: 'ceo@yourcompany.com', department: 'Executive Leadership' },
    { role: 'administration', fullName: 'Eleanor Davis', email: 'admin.ops@yourcompany.com', department: 'Operations & Facilities' },
    { role: 'hr_manager', fullName: 'Rachel Okafor', email: 'hr.manager@yourcompany.com', department: 'Human Resources' },
    { role: 'sales_manager', fullName: 'Sarah Mitchell', email: 'sales.manager@yourcompany.com', department: 'Sales' },
    { role: 'project_manager', fullName: 'David Park', email: 'project.manager@yourcompany.com', department: 'Project Management' },
    { role: 'accountant', fullName: 'Alex Sterling', email: 'accountant@yourcompany.com', department: 'Finance & Accounting' },
    { role: 'marketing', fullName: 'Jessica Blake', email: 'marketing@yourcompany.com', department: 'Growth & Marketing' },
    { role: 'employee', fullName: 'Johnathan SalesRep', email: 'sales.rep@yourcompany.com', department: 'Sales', position: 'Senior Account Executive', salaryTarget: 6500 },
    { role: 'employee', fullName: 'Emily Chen', email: 'dev.chen@yourcompany.com', department: 'Engineering', position: 'Full Stack Engineer', salaryTarget: 7200 }
  ];

  const userDocs = {};

  for (const userConfig of departmentsAndRoles) {
    let user = await User.findOne({ email: userConfig.email });
    if (!user) {
      user = new User({
        fullName: userConfig.fullName,
        email: userConfig.email,
        password: 'SecurePassword123!',
        role: userConfig.role,
        department: userConfig.department,
        position: userConfig.position || `${userConfig.department} Specialist`,
        salaryTarget: userConfig.salaryTarget || 5000,
        status: 'active',
        isApproved: true,
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`
      });
      await user.save();
      console.log(`  + Created user: ${user.fullName} (${user.role})`);
    } else {
      user.status = 'active';
      user.isApproved = true;
      user.department = userConfig.department;
      await user.save();
      console.log(`  ✓ Verified user: ${user.fullName} (${user.role})`);
    }
    userDocs[userConfig.role] = user;
    if (userConfig.email === 'sales.rep@yourcompany.com') {
      userDocs['salesRep'] = user;
    }
  }

  const admin = userDocs.admin;
  const salesManager = userDocs.sales_manager;
  const salesRep = userDocs.salesRep || userDocs.employee;
  const accountant = userDocs.accountant;
  const pm = userDocs.project_manager;
  const hr = userDocs.hr_manager;
  const marketing = userDocs.marketing;

  console.log('\n[2/10] Seeding Clients & Leads...');
  const clientsData = [
    { name: 'Apex Global Corp', company: 'Apex Global Ltd', email: 'contact@apexglobal.io', phone: '+1 (555) 234-5678', industry: 'Enterprise SaaS', totalValue: 85000 },
    { name: 'Horizon Technologies', company: 'Horizon Tech Inc', email: 'billing@horizontech.com', phone: '+1 (555) 345-6789', industry: 'Cloud Infrastructure', totalValue: 120000 },
    { name: 'Starlight Healthcare', company: 'Starlight Health Group', email: 'procurement@starlighthealth.org', phone: '+1 (555) 456-7890', industry: 'Healthcare Systems', totalValue: 64000 },
    { name: 'Vanguard Media Group', company: 'Vanguard Digital', email: 'partnerships@vanguardmedia.com', phone: '+1 (555) 567-8901', industry: 'Digital Publishing', totalValue: 48000 },
    { name: 'Vertex Logistics', company: 'Vertex Supply Chain Ltd', email: 'ops@vertexlogistics.com', phone: '+1 (555) 678-9012', industry: 'Logistics & Fleet', totalValue: 92000 }
  ];

  const clientDocs = [];
  for (const cData of clientsData) {
    let client = await Client.findOne({ name: cData.name });
    if (!client) {
      client = await Client.create({ ...cData, status: 'Active', createdBy: salesRep._id });
      console.log(`  + Created Client: ${client.name}`);
    }
    clientDocs.push(client);
  }

  const leadsData = [
    { name: 'Dr. Arthur Pendelton', company: 'Starlight Health Group', email: 'arthur@starlighthealth.org', phone: '+1 555-8899', status: 'Converted', value: 64000, source: 'Website', campaign: 'Google Inbound Q3' },
    { name: 'Marcus Sterling', company: 'Apex Global Ltd', email: 'm.sterling@apexglobal.io', phone: '+1 555-4422', status: 'Converted', value: 85000, source: 'Referral', campaign: 'Executive Referral' },
    { name: 'Elena Rostova', company: 'Horizon Tech Inc', email: 'elena@horizontech.com', phone: '+1 555-3311', status: 'Converted', value: 120000, source: 'LinkedIn', campaign: 'Enterprise Cloud Retargeting' },
    { name: 'Jonathan Vance', company: 'Nova Retail Corp', email: 'jvance@novaretail.com', phone: '+1 555-1199', status: 'Qualified', value: 52000, source: 'Email', campaign: 'Q3 Product Newsletter' },
    { name: 'Sophia Loren', company: 'Aero Dynamics Ltd', email: 'sloren@aerodynamics.com', phone: '+1 555-7766', status: 'Contacted', value: 36000, source: 'Trade Show', campaign: 'Tech Expo 2026' },
    { name: 'Brian O’Connor', company: 'Quantum Cyber Systems', email: 'brian@quantumcyber.com', phone: '+1 555-6655', status: 'New', value: 45000, source: 'Website', campaign: 'Google Inbound Q3' }
  ];

  const leadDocs = [];
  for (const lData of leadsData) {
    let lead = await Lead.findOne({ email: lData.email });
    if (!lead) {
      lead = await Lead.create({ ...lData, assignedTo: salesRep._id, createdBy: marketing._id });
      console.log(`  + Created Lead: ${lead.name} ($${lead.value})`);
    }
    leadDocs.push(lead);
  }

  console.log('\n[3/10] Seeding Deals & Pipeline...');
  const dealsData = [
    { title: 'Horizon Cloud Migration Enterprise', clientName: 'Horizon Technologies', value: 120000, stage: 'Won', probability: 100 },
    { title: 'Apex Global CRM Implementation', clientName: 'Apex Global Corp', value: 85000, stage: 'Won', probability: 100 },
    { title: 'Vertex Fleet Analytics Suite', clientName: 'Vertex Logistics', value: 92000, stage: 'Negotiation', probability: 80 },
    { title: 'Starlight EMR Integration Phase 1', clientName: 'Starlight Healthcare', value: 64000, stage: 'Proposal', probability: 60 },
    { title: 'Vanguard Content Automation Hub', clientName: 'Vanguard Media Group', value: 48000, stage: 'Qualification', probability: 40 }
  ];

  const dealDocs = [];
  for (const dData of dealsData) {
    let deal = await Deal.findOne({ title: dData.title });
    if (!deal) {
      deal = await Deal.create({
        ...dData,
        closingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        createdBy: salesRep._id
      });
      console.log(`  + Created Deal: ${deal.title} - $${deal.value.toLocaleString()} [${deal.stage}]`);
    }
    dealDocs.push(deal);
  }

  console.log('\n[4/10] Seeding Quotations, Sales Orders & Delivery Notes...');
  const wonDeal1 = dealDocs[0];
  const wonDeal2 = dealDocs[1];

  let quote = await Quotation.findOne({ quotationNumber: 'QT-2026-001' });
  if (!quote) {
    quote = await Quotation.create({
      quotationNumber: 'QT-2026-001',
      clientName: wonDeal1.clientName,
      dealTitle: wonDeal1.title,
      dealId: wonDeal1._id,
      totalAmount: wonDeal1.value,
      taxAmount: 0,
      discountAmount: 0,
      status: 'Accepted',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [{ description: 'Enterprise Cloud Architecture', quantity: 1, unitPrice: wonDeal1.value, total: wonDeal1.value }],
      createdBy: salesRep._id
    });
    console.log(`  + Created Quotation: ${quote.quotationNumber}`);
  }

  let order = await SalesOrder.findOne({ clientName: wonDeal1.clientName });
  if (!order) {
    order = await SalesOrder.create({
      orderNumber: 'SO-1001',
      clientName: wonDeal1.clientName,
      totalAmount: wonDeal1.value,
      status: 'Delivered',
      deliveryDate: new Date(),
      salesPerson: salesRep._id
    });
    console.log(`  + Created Sales Order: ${order.orderNumber}`);
  }

  let delNote = await DeliveryNote.findOne({ clientName: wonDeal1.clientName });
  if (!delNote) {
    delNote = await DeliveryNote.create({
      deliveryNumber: 'DN-1001',
      salesOrder: order._id,
      clientName: wonDeal1.clientName,
      deliveredItems: [{ description: 'Cloud Platform Deployment Artifacts', quantity: 1 }],
      deliveryDate: new Date(),
      status: 'Delivered',
      receivedBy: 'Elena Rostova',
      createdBy: salesRep._id
    });
    console.log(`  + Created Delivery Note: ${delNote.deliveryNumber}`);
  }

  console.log('\n[5/10] Seeding Invoices, Expenses, Payroll & Maintenance...');
  const invoicesData = [
    { invoiceNumber: 'INV-2026-1001', clientName: 'Horizon Technologies', amount: 120000, status: 'Paid', description: 'Enterprise Cloud Migration - Final Payment' },
    { invoiceNumber: 'INV-2026-1002', clientName: 'Apex Global Corp', amount: 85000, status: 'Paid', description: 'CRM Platform Implementation - Milestone 1' },
    { invoiceNumber: 'INV-2026-1003', clientName: 'Vertex Logistics', amount: 46000, status: 'Sent', description: 'Analytics Suite Deployment Deposit' },
    { invoiceNumber: 'INV-2026-1004', clientName: 'Starlight Healthcare', amount: 32000, status: 'Overdue', description: 'EMR Custom Integration SOW' }
  ];

  for (const invData of invoicesData) {
    let inv = await Invoice.findOne({ invoiceNumber: invData.invoiceNumber });
    if (!inv) {
      inv = await Invoice.create({
        ...invData,
        dueDate: new Date(Date.now() + (invData.status === 'Overdue' ? -10 : 15) * 24 * 60 * 60 * 1000),
        createdBy: accountant._id
      });
      console.log(`  + Created Invoice: ${inv.invoiceNumber} ($${inv.amount.toLocaleString()} - ${inv.status})`);
    }
  }

  const expensesData = [
    { title: 'AWS Cloud Server Infrastructure', category: 'Software', amount: 8400, status: 'Approved' },
    { title: 'Quarterly Google Ads Campaign', category: 'Marketing', amount: 6200, status: 'Approved' },
    { title: 'HQ Office Internet & Dedicated Fiber', category: 'Utilities', amount: 2800, status: 'Approved' },
    { title: 'Legal Counsel Retainer', category: 'Other', amount: 4500, status: 'Approved' },
    { title: 'Team Building Workshop Catering', category: 'Office Supplies', amount: 1200, status: 'Pending' }
  ];

  for (const expData of expensesData) {
    let exp = await Expense.findOne({ title: expData.title });
    if (!exp) {
      exp = await Expense.create({
        ...expData,
        submittedBy: accountant._id,
        submittedByName: accountant.fullName
      });
      console.log(`  + Created Expense: ${exp.title} ($${exp.amount})`);
    }
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  for (const roleKey of Object.keys(userDocs)) {
    const userObj = userDocs[roleKey];
    let payroll = await Payroll.findOne({ user: userObj._id, month: currentMonth, year: currentYear });
    if (!payroll) {
      const baseSalary = userObj.salaryTarget || 5000;
      const bonus = roleKey.includes('sales') ? 1500 : 500;
      const taxDeduction = Math.round(baseSalary * 0.15);
      const netPay = baseSalary + bonus - taxDeduction;

      payroll = await Payroll.create({
        user: userObj._id,
        month: currentMonth,
        year: currentYear,
        baseSalary,
        bonus,
        taxDeduction,
        netPay,
        status: 'Processed',
        paymentMethod: 'Direct Deposit',
        processedBy: accountant._id,
        processedDate: new Date()
      });
      console.log(`  + Created Payroll: ${userObj.fullName} (Net: $${netPay})`);
    }
  }

  const maintenanceData = [
    { name: 'HVAC Airflow & Climate Filter Replacement', maintenanceType: 'Building Maintenance', amount: 1850, status: 'Paid', dueDate: new Date() },
    { name: 'Server Room UPS Battery Diagnostics', maintenanceType: 'Equipment Maintenance', amount: 2400, status: 'Pending', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) }
  ];

  for (const mData of maintenanceData) {
    let m = await MaintenanceCharge.findOne({ name: mData.name });
    if (!m) {
      m = await MaintenanceCharge.create({ ...mData, createdBy: accountant._id, createdByName: accountant.fullName });
      console.log(`  + Created Maintenance Charge: ${m.name}`);
    }
  }

  console.log('\n[6/10] Seeding Enterprise Projects & Tasks...');
  const projectsData = [
    { name: 'Horizon Cloud Architecture & Multi-Region Setup', client: 'Horizon Technologies', status: 'In Progress', priority: 'High', budget: 120000, progress: 65 },
    { name: 'Apex Global CRM Integration & Workflow Engine', client: 'Apex Global Corp', status: 'In Progress', priority: 'High', budget: 85000, progress: 45 },
    { name: 'Internal Security Audit & ISO 27001 Compliance', client: 'Arte Internal', status: 'In Progress', priority: 'Urgent', budget: 35000, progress: 80 },
    { name: 'Arte Mobile Customer Portal v2.0', client: 'Vertex Logistics', status: 'In Progress', priority: 'Medium', budget: 55000, progress: 30 },
    { name: 'Legacy Data Migration & Warehouse Pipeline', client: 'Starlight Healthcare', status: 'Completed', priority: 'Medium', budget: 64000, progress: 100 }
  ];

  const projectDocs = [];
  for (const pData of projectsData) {
    let proj = await Project.findOne({ name: pData.name });
    if (!proj) {
      proj = await Project.create({
        ...pData,
        code: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
        team: [pm._id, salesRep._id, userDocs.employee._id],
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdBy: pm._id
      });
      console.log(`  + Created Project: ${proj.name} [${proj.status}]`);
    }
    projectDocs.push(proj);
  }

  const tasksData = [
    { title: 'Provision Terraform infrastructure templates', project: projectDocs[0].name, priority: 'High', status: 'Completed', assignedTo: userDocs.employee._id, assignedToName: userDocs.employee.fullName },
    { title: 'Implement RBAC authentication guards', project: projectDocs[1].name, priority: 'Urgent', status: 'In Progress', assignedTo: userDocs.employee._id, assignedToName: userDocs.employee.fullName },
    { title: 'Configure VPC peering and automated failover', project: projectDocs[0].name, priority: 'High', status: 'In Progress', assignedTo: pm._id, assignedToName: pm.fullName },
    { title: 'Execute penetration tests on staging API endpoints', project: projectDocs[2].name, priority: 'Urgent', status: 'Under Review', assignedTo: pm._id, assignedToName: pm.fullName },
    { title: 'Prepare end-user training documentation & video guides', project: projectDocs[1].name, priority: 'Medium', status: 'Pending', assignedTo: salesRep._id, assignedToName: salesRep.fullName }
  ];

  for (const tData of tasksData) {
    let task = await Task.findOne({ title: tData.title });
    if (!task) {
      task = await Task.create({
        ...tData,
        assignedByName: pm.fullName,
        category: 'Development',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      console.log(`  + Created Task: ${task.title} [${task.status}]`);
    }
  }

  console.log('\n[7/10] Seeding HR Attendance, Leaves & Performance Reviews...');
  const today = new Date();
  today.setHours(9, 0, 0, 0);

  for (const roleKey of Object.keys(userDocs)) {
    const userObj = userDocs[roleKey];
    let att = await Attendance.findOne({ user: userObj._id, date: { $gte: new Date(new Date().setHours(0,0,0,0)) } });
    if (!att) {
      att = await Attendance.create({
        user: userObj._id,
        userName: userObj.fullName,
        date: today,
        checkIn: '09:00 AM',
        checkOut: '05:30 PM',
        status: 'Present',
        workHours: 8.5
      });
      console.log(`  + Created Attendance for: ${userObj.fullName}`);
    }
  }

  let leave = await Leave.findOne({ user: userDocs.employee._id, status: 'Pending' });
  if (!leave) {
    leave = await Leave.create({
      user: userDocs.employee._id,
      userName: userDocs.employee.fullName,
      leaveType: 'Annual Leave',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      reason: 'Annual family vacation',
      status: 'Pending'
    });
    console.log(`  + Created Pending Leave Request for: ${userDocs.employee.fullName}`);
  }

  let review = await Performance.findOne({ user: salesRep._id });
  if (!review) {
    review = await Performance.create({
      user: salesRep._id,
      period: 'Q3 2026',
      rating: 5,
      goals: 100,
      score: 95,
      status: 'Excellent',
      notes: 'Consistently exceeds revenue targets and maintains strong client relationships.',
      reviewedBy: salesManager._id
    });
    console.log(`  + Created Performance Review for: ${salesRep.fullName}`);
  }

  console.log('\n[8/10] Seeding Marketing Campaigns...');
  const campaignsData = [
    { name: 'Q3 Enterprise SaaS Launch', type: 'Search Engine', budget: 15000, reach: 45000, leadsGenerated: 120, status: 'Active' },
    { name: 'Executive LinkedIn Inbound Sprint', type: 'Social Media', budget: 10000, reach: 28000, leadsGenerated: 85, status: 'Active' },
    { name: 'Cloud Infrastructure Whitepaper Funnel', type: 'Content', budget: 6000, reach: 35000, leadsGenerated: 94, status: 'Active' },
    { name: 'Industry Leadership Webinar 2026', type: 'Event', budget: 4500, reach: 18000, leadsGenerated: 62, status: 'Completed' }
  ];

  for (const cmpData of campaignsData) {
    let cmp = await Campaign.findOne({ name: cmpData.name });
    if (!cmp) {
      cmp = await Campaign.create({
        ...cmpData,
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        createdBy: marketing._id
      });
      console.log(`  + Created Campaign: ${cmp.name} ($${cmp.budget.toLocaleString()})`);
    }
  }

  console.log('\n[9/10] Seeding Audit Logs...');
  const auditLogsData = [
    { action: 'Deal Won', performedBy: salesRep._id, performedByName: salesRep.fullName, targetUserName: 'Horizon Technologies', details: 'Deal "Horizon Cloud Migration Enterprise" ($120,000) closed won.' },
    { action: 'Invoice Paid', performedBy: accountant._id, performedByName: accountant.fullName, targetUserName: 'Apex Global Corp', details: 'Invoice INV-2026-1002 ($85,000) marked as Paid.' },
    { action: 'Project Created', performedBy: pm._id, performedByName: pm.fullName, targetUserName: 'Horizon Technologies', details: 'Project "Horizon Cloud Architecture" created with $120k budget.' },
    { action: 'Registration Approved', performedBy: admin._id, performedByName: admin.fullName, targetUserName: 'Rachel Okafor', details: 'HR Manager account approved and activated.' }
  ];

  for (const aData of auditLogsData) {
    const existing = await AuditLog.findOne({ details: aData.details });
    if (!existing) {
      await AuditLog.create(aData);
      console.log(`  + Created Audit Log: ${aData.action}`);
    }
  }

  console.log('\n[10/10] Verifying System Calculations & Dynamic Aggregations...');

  const totalUsersCount = await User.countDocuments({ status: 'active' });
  const totalInvoicesPaid = await Invoice.find({ status: 'Paid' });
  const totalPaidRevenue = totalInvoicesPaid.reduce((sum, i) => sum + i.amount, 0);
  const totalProjectsCount = await Project.countDocuments();
  const totalTasksCount = await Task.countDocuments();
  const totalCampaignsCount = await Campaign.countDocuments();
  const totalAuditLogsCount = await AuditLog.countDocuments();

  console.log('  ═══════════════════════════════════════════════════════');
  console.log(`  • Total Active Enterprise Users in DB: ${totalUsersCount}`);
  console.log(`  • Real Invoiced Revenue (Paid) in DB:  $${totalPaidRevenue.toLocaleString()}`);
  console.log(`  • Real Active Projects in DB:          ${totalProjectsCount}`);
  console.log(`  • Real Active Tasks in DB:             ${totalTasksCount}`);
  console.log(`  • Real Marketing Campaigns in DB:      ${totalCampaignsCount}`);
  console.log(`  • Real Audit Logs in DB:               ${totalAuditLogsCount}`);
  console.log('  ═══════════════════════════════════════════════════════');

  if (totalPaidRevenue > 0 && totalProjectsCount > 0 && totalUsersCount >= 9) {
    console.log('\n>>> SUCCESS: COMPLETE ENTERPRISE WORKFLOW SEEDED & VERIFIED IN MONGODB! <<<');
  } else {
    throw new Error('Database verification failed — figures unexpected.');
  }

  await mongoose.disconnect();
};

runCompleteWorkflow().catch((err) => {
  console.error('[Workflow Error]:', err);
  process.exit(1);
});
