const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('../models/User');
  await User.deleteMany({
    email: {
      $in: [
        'ceo@yourcompany.com',
        'admin.ops@yourcompany.com',
        'hr.manager@yourcompany.com',
        'sales.manager@yourcompany.com',
        'project.manager@yourcompany.com',
        'accountant@yourcompany.com',
        'marketing@yourcompany.com',
        'sales.rep@yourcompany.com',
        'dev.chen@yourcompany.com'
      ]
    }
  });
  console.log('Test users deleted');
  process.exit(0);
});
