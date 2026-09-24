const Campaign = require('../models/Campaign');
const Lead = require('../models/Lead');

// GET /api/campaigns
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving campaigns.' });
  }
};

// GET /api/campaigns/summary
const getMarketingSummary = async (req, res) => {
  try {
    const [campaigns, leads] = await Promise.all([
      Campaign.find().sort({ createdAt: -1 }),
      Lead.find().sort({ createdAt: -1 })
    ]);

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalReach = campaigns.reduce((sum, c) => sum + (c.reach || 0), 0);
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => ['Qualified', 'Converted'].includes(l.status)).length;
    const convertedLeads = leads.filter(l => l.status === 'Converted').length;

    // Channel Share Breakdown
    const channelCounts = {};
    leads.forEach(l => {
      const src = l.source || 'Website';
      channelCounts[src] = (channelCounts[src] || 0) + 1;
    });

    const channelShare = Object.entries(channelCounts).map(([channel, count]) => ({
      channel,
      mqls: count,
      pct: totalLeads > 0 ? `${Math.round((count / totalLeads) * 100)}%` : '0%'
    }));

    // Monthly Lead Trends (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyDataMap[key] = {
        month: monthNames[d.getMonth()],
        mqls: 0,
        sqls: 0,
        converted: 0
      };
    }

    leads.forEach(l => {
      const date = new Date(l.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthlyDataMap[key]) {
        monthlyDataMap[key].mqls += 1;
        if (['Qualified', 'Converted'].includes(l.status)) {
          monthlyDataMap[key].sqls += 1;
        }
        if (l.status === 'Converted') {
          monthlyDataMap[key].converted += 1;
        }
      }
    });

    const leadTrendData = Object.values(monthlyDataMap);

    const conversionRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : 0;
    const averageCPL = totalLeads > 0 ? Math.round(totalBudget / totalLeads) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalCampaigns,
        activeCampaigns,
        totalBudget,
        totalReach,
        totalLeads,
        qualifiedLeads,
        convertedLeads,
        conversionRate: `${conversionRate}%`,
        averageCPL: `$${averageCPL}`,
        channelShare,
        leadTrendData,
        topCampaigns: campaigns.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('[Marketing Summary Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving marketing summary.' });
  }
};

// POST /api/campaigns
const createCampaign = async (req, res) => {
  try {
    const { name, type, status, budget, reach, leadsGenerated, endDate } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Campaign name is required.' });

    const campaign = await Campaign.create({
      name: name.trim(),
      type: type || 'Email',
      status: status || 'Active',
      budget: budget ? Number(budget) : 0,
      reach: reach ? Number(reach) : 0,
      leadsGenerated: leadsGenerated ? Number(leadsGenerated) : 0,
      endDate: endDate || null,
      createdBy: req.user._id
    });

    return res.status(201).json({ success: true, message: 'Campaign created successfully.', data: campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error creating campaign.' });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }
    return res.status(200).json({ success: true, message: 'Campaign updated successfully.', data: campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error updating campaign.' });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }
    return res.status(200).json({ success: true, message: 'Campaign deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error deleting campaign.' });
  }
};

module.exports = {
  getCampaigns,
  getMarketingSummary,
  createCampaign,
  updateCampaign,
  deleteCampaign
};
