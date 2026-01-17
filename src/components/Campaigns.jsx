import { useState, useEffect } from "react";
import { Rocket, CheckCircle, DollarSign, Eye, Plus, Search, X } from "lucide-react";
import { getCampaigns, updateCampaign } from '../services/campaignsServiceSupabase';
import { getCreators } from '../services/creatorsServiceSupabase';

export function Campaigns() {
  console.log('[CAMPAIGNS] ===== NEW CAMPAIGNS COMPONENT LOADED - BUILD ' + Date.now() + ' =====');
  const [filter, setFilter] = useState("all");
  const [campaigns, setCampaigns] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    creators: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [campaignsData, creatorsData] = await Promise.all([
          getCampaigns(),
          getCreators()
        ]);
        setCampaigns(campaignsData);
        setCreators(creatorsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleEditClick = (campaign) => {
    setEditingCampaign(campaign);
    setEditForm({
      title: campaign.title,
      description: campaign.description,
      status: campaign.status,
      creators: (campaign.creators || []).map(c => c.id)
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;

    try {
      const updated = await updateCampaign(editingCampaign.id, editForm);
      if (updated) {
        setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? updated : c));
        setEditingCampaign(null);
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Failed to update campaign');
    }
  };

  const handleCancelEdit = () => {
    setEditingCampaign(null);
    setEditForm({ title: '', description: '', status: 'pending', creators: [] });
  };

  const toggleCreator = (creatorId) => {
    setEditForm(prev => ({
      ...prev,
      creators: prev.creators.includes(creatorId)
        ? prev.creators.filter(id => id !== creatorId)
        : [...prev.creators, creatorId]
    }));
  };

  const stats = [
    {
      label: "In Progress",
      value: "2",
      icon: Rocket,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "Completed",
      value: "9",
      icon: CheckCircle,
      iconColor: "text-green-400",
      iconBg: "bg-green-500/10",
    },
    {
      label: "Budget",
      value: "$45K",
      icon: DollarSign,
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-500/10",
    },
    {
      label: "Reach",
      value: "2.4M",
      icon: Eye,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10",
    },
  ];

  return (
    <section className="py-20 px-6 bg-[#0a0a0a] text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <h1 className="text-6xl font-bold mb-4">Campaigns</h1>
            <p className="text-xl text-neutral-400">
              Manage campaigns and track content delivery across creators
            </p>
          </div>
          <button className="rounded-xl px-6 py-3 bg-[#E5C473] text-black font-semibold hover:bg-[#d4b563] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C473] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] transition-colors">
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <div className={`${stat.iconBg} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-4xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex-1 w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search campaigns..."
                className="w-full bg-neutral-900/50 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10"
              />
              <Search className="w-5 h-5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                All
              </span>
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "active"
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                Active
              </span>
            </button>
            <button
              onClick={() => setFilter("done")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "done"
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Done
              </span>
            </button>
            <button
              onClick={() => setFilter("archived")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "archived"
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                Archived
              </span>
            </button>
          </div>
        </div>

        {/* Campaign Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
              <p className="mt-4 text-neutral-400 font-medium">Loading campaigns...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 mt-8">
            {campaigns
              .filter(campaign => {
                if (filter === "all") return true;
                if (filter === "active") return campaign.status === "in-progress";
                if (filter === "done") return campaign.status === "completed";
                if (filter === "archived") return campaign.status === "cancelled";
                return true;
              })
              .map((campaign) => {
                // Use the pre-calculated actual impressions and cost from the service
                const totalImpressions = campaign.actualImpressions || 0;
                const totalCost = campaign.actualCost || 0;

                return (
                  <div
                    key={campaign.id}
                    onClick={() => handleEditClick(campaign)}
                    className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                        <p className="text-neutral-400 text-sm mb-4">{campaign.description}</p>

                        {/* Metrics Row */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-purple-400" />
                            <span className="text-neutral-400">{totalImpressions.toLocaleString()} impressions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-yellow-400" />
                            <span className="text-neutral-400">${totalCost.toLocaleString()} cost</span>
                          </div>
                          {campaign.creators && campaign.creators.length > 0 && (
                            <div className="flex items-center gap-2 text-neutral-500">
                              <span>{campaign.creators.length} creators</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        campaign.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        campaign.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400' :
                        campaign.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-neutral-500/10 text-neutral-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                );
              })
            }

            {campaigns.filter(campaign => {
              if (filter === "all") return true;
              if (filter === "active") return campaign.status === "in-progress";
              if (filter === "done") return campaign.status === "completed";
              if (filter === "archived") return campaign.status === "cancelled";
              return true;
            }).length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-400">No campaigns found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Campaign</h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/20"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Creators ({editForm.creators.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-white/10 rounded-lg bg-neutral-800 p-3 space-y-2">
                  {creators.map((creator) => (
                    <label
                      key={creator.id}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editForm.creators.includes(creator.id)}
                        onChange={() => toggleCreator(creator.id)}
                        className="w-4 h-4 rounded border-white/20 bg-neutral-700 text-[#E5C473] focus:ring-2 focus:ring-[#E5C473]"
                      />
                      <span className="text-white text-sm">{creator.name}</span>
                      <span className="text-neutral-500 text-xs">@{creator.handle}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-3 bg-[#E5C473] hover:bg-[#d4b563] text-black rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
