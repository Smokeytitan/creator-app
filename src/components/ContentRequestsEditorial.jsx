import { useState, useMemo, useEffect } from 'react';
import { Plus, Calendar, User, CheckCircle, Clock, XCircle, Trash2, Edit2, Save, X, Search, RefreshCw, Eye, DollarSign, Download, FileText, Loader2, ChevronDown, ExternalLink, TrendingUp } from 'lucide-react';
import ContentRequestModal from './ContentRequestModal';
import { extractTweetId, fetchTweets } from '../services/twitterService';
import { createCampaign, updateCampaign, deleteCampaign as deleteCampaignSupabase, getCampaigns } from '../services/campaignsServiceSupabase';
import { addPost } from '../services/creatorsServiceSupabase';
import { supabase } from '../lib/supabaseClient';

const ContentRequestsEditorial = ({ creators, setCreators, requests = [], setRequests }) => {
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCreatorId, setFilterCreatorId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);
  const [editRequestForm, setEditRequestForm] = useState({
    title: '',
    description: '',
    selectedCreatorIds: [],
    dueDate: '',
    status: 'pending'
  });

  // Add content state
  const [addingContentForRequest, setAddingContentForRequest] = useState(null);
  const [contentForm, setContentForm] = useState({
    selectedCreatorIds: [],
    description: '',
    platforms: ['X'], // Array of platforms: X, Facebook, Instagram, YouTube, TikTok
    // Per-platform data structure: { platform: { link, impressions, likes, comments } }
    platformData: {
      'X': { link: '', impressions: '', likes: '', comments: '' },
      'Facebook': { link: '', impressions: '', likes: '', comments: '' },
      'Instagram': { link: '', impressions: '', likes: '', comments: '' },
      'YouTube': { link: '', impressions: '', likes: '', comments: '' },
      'TikTok': { link: '', impressions: '', likes: '', comments: '' }
    },
    cost: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [fetchingTweetData, setFetchingTweetData] = useState(false);

  // Background tweet scanner - runs every 24 hours to update metrics
  useEffect(() => {
    const scanTweetsForUpdates = async () => {
      console.log('Running background tweet scanner...');

      // Get fresh creators data from state
      setCreators(currentCreators => {
        // Collect all X platform posts that need scanning
        const tweetsToScan = [];

        currentCreators.forEach(creator => {
          (creator.posts || []).forEach(post => {
            if (post.platform === 'X' && post.link) {
              const tweetId = extractTweetId(post.link);
              if (!tweetId) return;

              // Check if tweet is old enough (48+ hours) and needs rescan (24+ hours since last scan)
              if (isTweetOldEnough(post.date) && needsRescan(post.lastScanned)) {
                tweetsToScan.push({
                  creatorId: creator.id,
                  postId: post.id,
                  tweetId,
                  link: post.link,
                  date: post.date
                });
              }
            }
          });
        });

        if (tweetsToScan.length === 0) {
          console.log('No tweets need scanning');
          return currentCreators; // Return unchanged
        }

        console.log(`Scanning ${tweetsToScan.length} tweets for updates...`);

        // Async function to handle batch fetching
        (async () => {
          // Batch fetch tweets (max 100 per request)
          for (let i = 0; i < tweetsToScan.length; i += 100) {
            const batch = tweetsToScan.slice(i, i + 100);
            const tweetIds = batch.map(t => t.tweetId);

            try {
              const response = await fetchTweets(tweetIds);

              if (response.data && response.data.length > 0) {
                // Update creators with new metrics
                setCreators(prevCreators => {
                  return prevCreators.map(creator => {
                    const creatorTweets = batch.filter(t => t.creatorId === creator.id);
                    if (creatorTweets.length === 0) return creator;

                    return {
                      ...creator,
                      posts: (creator.posts || []).map(post => {
                        const tweetToUpdate = creatorTweets.find(t => t.postId === post.id);
                        if (!tweetToUpdate) return post;

                        const tweetData = response.data.find(t => t.id === tweetToUpdate.tweetId);
                        if (!tweetData) return post;

                        const metrics = tweetData.public_metrics;
                        console.log(`Updated metrics for tweet ${tweetToUpdate.tweetId}:`, metrics);

                        return {
                          ...post,
                          impressions: metrics.impression_count || post.impressions,
                          likes: metrics.like_count || post.likes,
                          comments: metrics.reply_count || post.comments,
                          lastScanned: new Date().toISOString()
                        };
                      })
                    };
                  });
                });
              }
            } catch (error) {
              console.error('Error scanning tweet batch:', error);
            }

            // Add delay to avoid rate limiting
            if (i + 100 < tweetsToScan.length) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }

          console.log('Background tweet scan complete');
        })();

        return currentCreators; // Return current state immediately
      });
    };

    // Run scan on mount
    scanTweetsForUpdates();

    // Run scan every 24 hours
    const interval = setInterval(scanTweetsForUpdates, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const startEditRequest = (request) => {
    setEditingRequestId(request.id);
    setEditRequestForm({
      title: request.title,
      description: request.description,
      selectedCreatorIds: (request.creators || []).map(c => c.id),
      dueDate: request.dueDate ? new Date(request.dueDate).toISOString().slice(0, 10) : '',
      status: request.status
    });
  };

  const saveEditRequest = async () => {
    if (!editRequestForm.title.trim()) {
      alert('Title is required');
      return;
    }

    if (editRequestForm.selectedCreatorIds.length === 0) {
      alert('At least one creator is required');
      return;
    }

    if (!supabase) {
      // Fallback to local state if Supabase not configured
      const selectedCreators = creators.filter(c => editRequestForm.selectedCreatorIds.includes(c.id));
      setRequests(requests.map(req =>
        req.id === editingRequestId
          ? {
              ...req,
              title: editRequestForm.title,
              description: editRequestForm.description,
              creators: selectedCreators.map(c => ({ id: c.id, name: c.name })),
              dueDate: new Date(editRequestForm.dueDate).toISOString(),
              status: editRequestForm.status
            }
          : req
      ));
      setEditingRequestId(null);
      return;
    }

    try {
      // Update campaign in Supabase
      const updated = await updateCampaign(editingRequestId, {
        title: editRequestForm.title,
        description: editRequestForm.description,
        creators: editRequestForm.selectedCreatorIds,
        status: editRequestForm.status
      });

      if (updated) {
        // Update local state with the response from Supabase
        setRequests(requests.map(req =>
          req.id === editingRequestId ? updated : req
        ));
        setEditingRequestId(null);
      } else {
        alert('Failed to update campaign');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Failed to update campaign: ' + error.message);
    }
  };

  const cancelEditRequest = () => {
    setEditingRequestId(null);
    setEditRequestForm({
      title: '',
      description: '',
      selectedCreatorIds: [],
      dueDate: '',
      status: 'pending'
    });
  };

  const deleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return;
    }

    if (!supabase) {
      // Fallback to local state if Supabase not configured
      setRequests(requests.filter(req => req.id !== requestId));
      return;
    }

    try {
      const success = await deleteCampaignSupabase(requestId);
      if (success) {
        setRequests(requests.filter(req => req.id !== requestId));
      } else {
        alert('Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign: ' + error.message);
    }
  };

  const startAddContent = (request) => {
    setAddingContentForRequest(request);
    setContentForm({
      selectedCreatorIds: [],
      description: '',
      platforms: ['X'],
      platformData: {
        'X': { link: '', impressions: 0, likes: 0, comments: 0 },
        'Facebook': { link: '', impressions: 0, likes: 0, comments: 0 },
        'Instagram': { link: '', impressions: 0, likes: 0, comments: 0 },
        'YouTube': { link: '', impressions: 0, likes: 0, comments: 0 },
        'TikTok': { link: '', impressions: 0, likes: 0, comments: 0 }
      },
      cost: 0,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const cancelAddContent = () => {
    setAddingContentForRequest(null);
    setContentForm({
      selectedCreatorIds: [],
      description: '',
      platforms: ['X'],
      platformData: {
        'X': { link: '', impressions: 0, likes: 0, comments: 0 },
        'Facebook': { link: '', impressions: 0, likes: 0, comments: 0 },
        'Instagram': { link: '', impressions: 0, likes: 0, comments: 0 },
        'YouTube': { link: '', impressions: 0, likes: 0, comments: 0 },
        'TikTok': { link: '', impressions: 0, likes: 0, comments: 0 }
      },
      cost: 0,
      date: new Date().toISOString().split('T')[0]
    });
    setFetchingTweetData(false);
  };

  // Check if tweet is old enough to scan (48 hours)
  const isTweetOldEnough = (tweetDate) => {
    if (!tweetDate) return false;
    const tweetTime = new Date(tweetDate).getTime();
    const now = Date.now();
    const hoursSincePost = (now - tweetTime) / (1000 * 60 * 60);
    return hoursSincePost >= 48;
  };

  // Check if tweet needs rescanning (24 hours since last scan)
  const needsRescan = (lastScanned) => {
    if (!lastScanned) return true;
    const lastScanTime = new Date(lastScanned).getTime();
    const now = Date.now();
    const hoursSinceScan = (now - lastScanTime) / (1000 * 60 * 60);
    return hoursSinceScan >= 24;
  };

  // Fetch tweet metrics from Twitter API
  const fetchTweetMetrics = async (url, skipAgeCheck = false) => {
    const tweetId = extractTweetId(url);
    if (!tweetId) {
      console.log('Invalid Twitter URL');
      return;
    }

    setFetchingTweetData(true);

    try {
      const response = await fetchTweets([tweetId]);

      if (response.data && response.data.length > 0) {
        const tweet = response.data[0];
        const metrics = tweet.public_metrics;

        // Extract date from created_at and format as YYYY-MM-DD
        const tweetDate = tweet.created_at ? new Date(tweet.created_at).toISOString().split('T')[0] : '';

        // Check if tweet is at least 48 hours old (unless skipping age check for manual refresh)
        if (!skipAgeCheck && tweetDate && !isTweetOldEnough(tweetDate)) {
          console.log('Tweet is less than 48 hours old, metrics may not be final');
          alert('This tweet is less than 48 hours old. Metrics may not be final yet. You can still add it, but consider rescanning later for accurate data.');
        }

        // Update form with fetched metrics for X platform
        setContentForm(prev => ({
          ...prev,
          platformData: {
            ...prev.platformData,
            'X': {
              ...prev.platformData['X'],
              impressions: metrics.impression_count || 0,
              likes: metrics.like_count || 0,
              comments: metrics.reply_count || 0
            }
          },
          date: tweetDate || prev.date // Use tweet date if available, otherwise keep current date
        }));

        console.log('Successfully fetched tweet metrics:', metrics, 'Date:', tweetDate);
      } else {
        console.warn('No tweet data found');
      }
    } catch (error) {
      console.error('Failed to fetch tweet metrics:', error);
      // Don't show alert, just log - user can still enter manually
    } finally {
      setFetchingTweetData(false);
    }
  };

  // Handle link input change with automatic metric fetching for X platform
  const handlePlatformLinkChange = (platform, newLink) => {
    setContentForm(prev => ({
      ...prev,
      platformData: {
        ...prev.platformData,
        [platform]: {
          ...prev.platformData[platform],
          link: newLink
        }
      }
    }));

    // Auto-fetch metrics when a valid Twitter URL is pasted for X platform
    if (platform === 'X' && newLink.includes('/status/')) {
      fetchTweetMetrics(newLink);
    }
  };

  // Update platform data field
  const updatePlatformData = (platform, field, value) => {
    setContentForm(prev => ({
      ...prev,
      platformData: {
        ...prev.platformData,
        [platform]: {
          ...prev.platformData[platform],
          [field]: value
        }
      }
    }));
  };

  const submitContent = async () => {
    if (contentForm.selectedCreatorIds.length === 0) {
      alert('Please select at least one creator');
      return;
    }

    if (contentForm.platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    // Validate that each selected platform has required data
    for (const platform of contentForm.platforms) {
      const platformData = contentForm.platformData[platform];

      // For non-X platforms, impressions are required
      if (platform !== 'X' && (!platformData.impressions || platformData.impressions === 0)) {
        alert(`Impressions are required for ${platform}`);
        return;
      }
    }

    const request = addingContentForRequest;

    if (!supabase) {
      // Fallback to local state if Supabase not configured
      setCreators(creators.map(creator => {
        if (contentForm.selectedCreatorIds.includes(creator.id)) {
          // Create a post for each selected platform with its specific data
          const newPosts = contentForm.platforms.map(platform => {
            const platformData = contentForm.platformData[platform];
            return {
              id: Date.now() + Math.random(),
              description: request.title,
              platform: platform,
              date: contentForm.date,
              cost: Number(contentForm.cost) || 0,
              link: platformData.link,
              impressions: Number(platformData.impressions) || 0,
              likes: Number(platformData.likes) || 0,
              comments: Number(platformData.comments) || 0,
              lastScanned: platform === 'X' && platformData.impressions ? new Date().toISOString() : null,
              campaign_id: request.id
            };
          });

          return {
            ...creator,
            posts: [...(creator.posts || []), ...newPosts]
          };
        }
        return creator;
      }));
      cancelAddContent();
      alert(`Content added to ${contentForm.selectedCreatorIds.length} creator(s) across ${contentForm.platforms.length} platform(s) for "${request.title}"!`);
      return;
    }

    // Use Supabase
    try {
      let totalPostsCreated = 0;
      let supabaseFailed = false;

      // For each selected creator
      for (const creatorId of contentForm.selectedCreatorIds) {
        // Create a post for each selected platform with its specific data
        for (const platform of contentForm.platforms) {
          const platformData = contentForm.platformData[platform];
          const postData = {
            description: request.title,
            platform: platform,
            date: contentForm.date,
            cost: Number(contentForm.cost) || 0,
            link: platformData.link,
            impressions: Number(platformData.impressions) || 0,
            likes: Number(platformData.likes) || 0,
            comments: Number(platformData.comments) || 0,
            lastScanned: platform === 'X' && platformData.impressions ? new Date().toISOString() : null
          };

          const updatedCreator = await addPost(creatorId, postData, request.id);
          if (updatedCreator) {
            // Update local state with the updated creator
            setCreators(currentCreators =>
              currentCreators.map(c => c.id === creatorId ? updatedCreator : c)
            );
            totalPostsCreated++;
          } else {
            supabaseFailed = true;
          }
        }
      }

      // If Supabase failed, fall back to localStorage
      if (supabaseFailed && totalPostsCreated === 0) {
        console.warn('Supabase failed, falling back to localStorage');
        setCreators(creators.map(creator => {
          if (contentForm.selectedCreatorIds.includes(creator.id)) {
            // Create a post for each selected platform with its specific data
            const newPosts = contentForm.platforms.map(platform => {
              const platformData = contentForm.platformData[platform];
              return {
                id: Date.now() + Math.random(),
                description: request.title,
                platform: platform,
                date: contentForm.date,
                cost: Number(contentForm.cost) || 0,
                link: platformData.link,
                impressions: Number(platformData.impressions) || 0,
                likes: Number(platformData.likes) || 0,
                comments: Number(platformData.comments) || 0,
                lastScanned: platform === 'X' && platformData.impressions ? new Date().toISOString() : null,
                campaign_id: request.id
              };
            });

            return {
              ...creator,
              posts: [...(creator.posts || []), ...newPosts]
            };
          }
          return creator;
        }));
        cancelAddContent();
        alert(`Content added to ${contentForm.selectedCreatorIds.length} creator(s) across ${contentForm.platforms.length} platform(s) for "${request.title}"!`);
        return;
      }

      cancelAddContent();
      alert(`Successfully added ${totalPostsCreated} posts to ${contentForm.selectedCreatorIds.length} creator(s) across ${contentForm.platforms.length} platform(s) for "${request.title}"!`);
    } catch (error) {
      console.error('Error adding content:', error);
      // Fall back to localStorage on error
      console.warn('Error occurred, falling back to localStorage');
      setCreators(creators.map(creator => {
        if (contentForm.selectedCreatorIds.includes(creator.id)) {
          const newPosts = contentForm.platforms.map(platform => {
            const platformData = contentForm.platformData[platform];
            return {
              id: Date.now() + Math.random(),
              description: request.title,
              platform: platform,
              date: contentForm.date,
              cost: Number(contentForm.cost) || 0,
              link: platformData.link,
              impressions: Number(platformData.impressions) || 0,
              likes: Number(platformData.likes) || 0,
              comments: Number(platformData.comments) || 0,
              lastScanned: platform === 'X' && platformData.impressions ? new Date().toISOString() : null
            };
          });

          return {
            ...creator,
            posts: [...(creator.posts || []), ...newPosts]
          };
        }
        return creator;
      }));
      cancelAddContent();
      alert(`Content added to ${contentForm.selectedCreatorIds.length} creator(s) across ${contentForm.platforms.length} platform(s) for "${request.title}"!`);
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filter by status
    if (filterStatus === 'completed') {
      filtered = filtered.filter(req => req.status === 'completed');
    } else if (filterStatus === 'all') {
      // Show only ongoing (non-completed) requests
      filtered = filtered.filter(req => req.status !== 'completed');
    }

    // Filter by creator
    if (filterCreatorId !== 'all') {
      filtered = filtered.filter(req =>
        (req.creators || []).some(c => String(c.id) === String(filterCreatorId))
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(req => {
        const titleMatch = req.title?.toLowerCase().includes(search);
        const descriptionMatch = req.description?.toLowerCase().includes(search);
        const creatorMatch = (req.creators || []).some(c =>
          c.name?.toLowerCase().includes(search)
        );
        return titleMatch || descriptionMatch || creatorMatch;
      });
    }

    return filtered;
  }, [requests, filterStatus, filterCreatorId, searchTerm]);

  const statusCounts = useMemo(() => {
    return {
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in-progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
    };
  }, [requests]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-[var(--color-accent-primary)]" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-[var(--color-text-tertiary)]" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'in-progress':
        return 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default:
        return 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]';
    }
  };

  const getCampaignMetrics = (request) => {
    let totalImpressions = 0;
    let totalCost = 0;

    // Get the campaign creators
    const campaignCreators = request.creators || [];

    // Normalize campaign title for matching
    const campaignTitle = request.title.toLowerCase().trim();

    // For each creator in the campaign
    campaignCreators.forEach(campaignCreator => {
      // Find the creator in the full creators list
      const creator = creators.find(c => c.id === campaignCreator.id);
      if (!creator || !creator.posts) return;

      // Find posts that match this campaign by exact description match
      const matchingPosts = creator.posts.filter(post => {
        if (!post.description) return false;
        const postDesc = post.description.toLowerCase().trim();
        // Try exact match first, then contains match
        return postDesc === campaignTitle || postDesc.includes(campaignTitle) || campaignTitle.includes(postDesc);
      });

      // Sum up impressions and costs from matching posts
      matchingPosts.forEach(post => {
        if (post.impressions) {
          const impressions = Number(post.impressions);
          if (!isNaN(impressions)) {
            totalImpressions += impressions;
          }
        }
        if (post.cost) {
          const cost = Number(post.cost);
          if (!isNaN(cost)) {
            totalCost += cost;
          }
        }
      });
    });

    return {
      totalImpressions,
      totalCost
    };
  };

  const exportCampaignsToCSV = () => {
    // Prepare campaign data with metrics
    const campaignRows = filteredRequests.map(request => {
      const metrics = getCampaignMetrics(request);
      const creatorNames = (request.creators || []).map(c => c.name).join(', ');

      return {
        'Campaign': request.title,
        'Description': request.description,
        'Creators': creatorNames,
        'Status': request.status,
        'Due Date': new Date(request.dueDate).toLocaleDateString(),
        'Total Impressions': metrics.totalImpressions.toLocaleString(),
        'Total Cost': `$${metrics.totalCost.toFixed(2)}`,
        'CPM': metrics.totalImpressions > 0 ? `$${((metrics.totalCost / metrics.totalImpressions) * 1000).toFixed(2)}` : '$0.00'
      };
    });

    // Convert to CSV
    let csv = 'CAMPAIGN DATA EXPORT\n';
    csv += `Exported: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    if (filterStatus !== 'all') {
      csv += `Filter: ${filterStatus}\n`;
    }
    csv += '\n';

    if (campaignRows.length > 0) {
      const headers = Object.keys(campaignRows[0]);
      csv += headers.join(',') + '\n';
      campaignRows.forEach(row => {
        csv += headers.map(header => `"${row[header]}"`).join(',') + '\n';
      });
    } else {
      csv += 'No campaigns to export\n';
    }

    // Summary statistics
    const totalImpressions = campaignRows.reduce((sum, row) => {
      const impressions = parseFloat(row['Total Impressions'].replace(/,/g, ''));
      return sum + impressions;
    }, 0);
    const totalCost = campaignRows.reduce((sum, row) => {
      const cost = parseFloat(row['Total Cost'].replace(/[$,]/g, ''));
      return sum + cost;
    }, 0);

    csv += '\nSUMMARY\n';
    csv += `Total Campaigns,${campaignRows.length}\n`;
    csv += `Total Impressions,${totalImpressions.toLocaleString()}\n`;
    csv += `Total Cost,$${totalCost.toFixed(2)}\n`;
    csv += `Average CPM,${totalImpressions > 0 ? `$${((totalCost / totalImpressions) * 1000).toFixed(2)}` : '$0.00'}\n`;

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `campaign_data_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEstimatedMetrics = (request) => {
    let estimatedImpressions = 0;
    let estimatedCost = 0;

    // First, try to use stored estimated values from the campaign itself
    if (request.estimatedImpressions && request.estimatedImpressions > 0) {
      estimatedImpressions = request.estimatedImpressions;
    }
    if (request.estimatedCost && request.estimatedCost > 0) {
      estimatedCost = request.estimatedCost;
    }

    // If no stored values, calculate from creators
    if (estimatedImpressions === 0 || estimatedCost === 0) {
      const campaignCreators = request.creators || [];

      campaignCreators.forEach(campaignCreator => {
        const creator = creators.find(c => c.id === campaignCreator.id);
        if (!creator) return;

        // Calculate average impressions from their posts (only if not already set)
        if (estimatedImpressions === 0) {
          const posts = creator.posts || [];
          if (posts.length > 0) {
            const totalCreatorImpressions = posts.reduce((sum, post) => {
              if (post.impressions) {
                const impressions = Number(post.impressions);
                if (!isNaN(impressions)) {
                  return sum + impressions;
                }
              }
              return sum;
            }, 0);
            estimatedImpressions += Math.round(totalCreatorImpressions / posts.length);
          }
        }

        // Get cost per post from creator (only if not already set)
        if (estimatedCost === 0 && creator.costPerPost) {
          const cost = Number(creator.costPerPost);
          if (!isNaN(cost)) {
            estimatedCost += cost;
          }
        }
      });
    }

    return {
      estimatedImpressions,
      estimatedCost
    };
  };

  // Get all posts for a campaign
  const getCampaignPosts = (request) => {
    const posts = [];
    const campaignCreators = request.creators || [];

    console.log(`[getCampaignPosts] Campaign "${request.title}" (ID: ${request.id})`);
    console.log(`[getCampaignPosts] Campaign has ${campaignCreators.length} creators:`, campaignCreators.map(c => c.name || c.id));

    campaignCreators.forEach(campaignCreator => {
      const creator = creators.find(c => c.id === campaignCreator.id);
      if (!creator) {
        console.log(`[getCampaignPosts] Creator ${campaignCreator.id} not found in creators array`);
        return;
      }

      console.log(`[getCampaignPosts] Checking creator "${creator.name}" - has ${creator.posts?.length || 0} posts`);
      if (creator.posts && creator.posts.length > 0) {
        console.log(`[getCampaignPosts] Sample post from ${creator.name}:`, creator.posts[0]);
      }

      const creatorPosts = (creator.posts || []).filter(post => {
        const matches = post.campaign_id === request.id;
        if (!matches && post.campaign_id) {
          console.log(`[getCampaignPosts] Post ${post.id} has campaign_id ${post.campaign_id}, doesn't match ${request.id}`);
        }
        return matches;
      });

      console.log(`[getCampaignPosts] Found ${creatorPosts.length} matching posts for creator "${creator.name}"`);

      creatorPosts.forEach(post => {
        posts.push({
          ...post,
          creatorName: creator.name,
          creatorHandle: creator.handle,
          creatorId: creator.id
        });
      });
    });

    console.log(`[getCampaignPosts] Total posts found: ${posts.length}`);
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="border-b border-[var(--color-border)] pb-8" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <h1 className="text-display text-5xl mb-3 text-[var(--color-text-primary)]">
          Campaigns
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg">
          Manage campaigns and track content delivery across creators
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        <StatCard label="Pending" value={statusCounts.pending} delay="0s" />
        <StatCard label="In Progress" value={statusCounts.inProgress} delay="0.05s" />
        <StatCard label="Completed" value={statusCounts.completed} delay="0.1s" />
        <StatCard label="Cancelled" value={statusCounts.cancelled} delay="0.15s" />
      </div>

      {/* Filters and Create Button */}
      <div className="card-editorial p-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filterStatus === 'all' || (filterStatus !== 'completed')
                    ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white shadow-lg shadow-[var(--color-accent-primary)]/25'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                }`}
              >
                Ongoing
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filterStatus === 'completed'
                    ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white shadow-lg shadow-[var(--color-accent-primary)]/25'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                }`}
              >
                Completed
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={exportCampaignsToCSV}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all duration-200 shadow-lg shadow-green-500/25"
                title="Export campaign data to CSV"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search by title, description, or creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Creator Filter */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[var(--color-text-tertiary)]" />
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Creator:</label>
              <select
                value={filterCreatorId}
                onChange={(e) => setFilterCreatorId(e.target.value)}
                className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
              >
                <option value="all">All Creators</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {filterCreatorId !== 'all' && (
                <button
                  onClick={() => setFilterCreatorId('all')}
                  className="inline-flex items-center px-2 py-1 text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Requests Grid */}
      <div className={`grid gap-4 ${filterStatus === 'completed' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`} style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
        {filteredRequests.map((request, index) => {
          const isExpanded = expandedCampaignId === request.id;
          const campaignPosts = getCampaignPosts(request);
          const hasContent = campaignPosts.length > 0;

          // Debug logging
          console.log('Campaign:', request.title, 'Posts found:', campaignPosts.length, 'HasContent:', hasContent, 'Campaign ID:', request.id);
          if (campaignPosts.length > 0) {
            console.log('Sample post:', campaignPosts[0]);
          }

          return (
          <div
            key={request.id}
            className="card-editorial p-4 sm:p-6 hover:shadow-lg transition-all duration-200"
            style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both` }}
          >
              {editingRequestId === request.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      value={editRequestForm.title}
                      onChange={(e) => setEditRequestForm({ ...editRequestForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      value={editRequestForm.description}
                      onChange={(e) => setEditRequestForm({ ...editRequestForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Creators ({editRequestForm.selectedCreatorIds.length} selected)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3 bg-[var(--color-bg-tertiary)] space-y-2">
                      {creators.map((c) => (
                        <label key={c.id} className="flex items-center space-x-2 cursor-pointer hover:bg-[var(--color-bg-secondary)] p-2 rounded">
                          <input
                            type="checkbox"
                            checked={editRequestForm.selectedCreatorIds.includes(c.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const isChecked = e.target.checked;
                              setEditRequestForm({
                                ...editRequestForm,
                                selectedCreatorIds: isChecked
                                  ? [...editRequestForm.selectedCreatorIds, c.id]
                                  : editRequestForm.selectedCreatorIds.filter(id => id !== c.id)
                              });
                            }}
                            className="h-4 w-4 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] border-[var(--color-border)] rounded"
                          />
                          <span className="text-sm text-[var(--color-text-primary)]">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Due Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                        value={editRequestForm.dueDate}
                        onChange={(e) => setEditRequestForm({ ...editRequestForm, dueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                        value={editRequestForm.status}
                        onChange={(e) => setEditRequestForm({ ...editRequestForm, status: e.target.value })}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveEditRequest}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200 font-medium"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditRequest}
                      className="inline-flex items-center px-4 py-2 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] transition-all duration-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {getStatusIcon(request.status)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                          {request.title}
                        </h4>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-2">{request.description}</p>
                        <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)] mb-2">
                          <div className="flex items-center text-mono">
                            <User className="h-4 w-4 mr-1" />
                            {(request.creators || []).map(c => c.name).join(', ')}
                          </div>
                          {request.startDate && (
                            <div className="flex items-center text-mono">
                              <Calendar className="h-4 w-4 mr-1" />
                              Started: {new Date(request.startDate).toLocaleDateString()}
                            </div>
                          )}
                          {request.dueDate && (
                            <div className="flex items-center text-mono">
                              <Calendar className="h-4 w-4 mr-1" />
                              Due: {new Date(request.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {(() => {
                          // First, check if there are actual posts with metrics
                          const actualMetrics = getCampaignMetrics(request);
                          const hasActualData = actualMetrics.totalImpressions > 0 || actualMetrics.totalCost > 0;

                          if (hasActualData) {
                            // Show actual metrics from posts
                            const cpm = actualMetrics.totalImpressions > 0
                              ? (actualMetrics.totalCost / actualMetrics.totalImpressions) * 1000
                              : 0;

                            return (
                              <div className="flex items-center gap-4 text-sm font-medium">
                                {actualMetrics.totalImpressions > 0 && (
                                  <div className="flex items-center text-[var(--color-accent-primary)]">
                                    <Eye className="h-4 w-4 mr-1" />
                                    <span className="text-mono">
                                      {actualMetrics.totalImpressions.toLocaleString()} impressions
                                    </span>
                                  </div>
                                )}
                                {actualMetrics.totalCost > 0 && (
                                  <div className="flex items-center text-green-500">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    <span className="text-mono">
                                      ${actualMetrics.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                                {cpm > 0 && (
                                  <div className="flex items-center text-blue-400">
                                    <span className="text-mono text-xs">
                                      ${cpm.toFixed(2)} CPM
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            // Fallback to estimated metrics if no posts yet
                            const estimated = getEstimatedMetrics(request);
                            if (estimated.estimatedImpressions > 0 || estimated.estimatedCost > 0) {
                              return (
                                <div className="flex items-center gap-4 text-sm font-medium">
                                  {estimated.estimatedImpressions > 0 && (
                                    <div className="flex items-center text-[var(--color-accent-primary)]">
                                      <Eye className="h-4 w-4 mr-1" />
                                      <span className="text-mono">
                                        ~{estimated.estimatedImpressions.toLocaleString()} est. impressions
                                      </span>
                                    </div>
                                  )}
                                  {estimated.estimatedCost > 0 && (
                                    <div className="flex items-center text-green-500">
                                      <DollarSign className="h-4 w-4 mr-1" />
                                      <span className="text-mono">
                                        ~${estimated.estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} est. cost
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditRequest(request);
                        }}
                        className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)] hover:bg-[var(--color-bg-tertiary)] rounded transition-colors"
                        title="Edit request"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRequest(request.id);
                        }}
                        className="p-2 text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete request"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Add Content Button - Full Width */}
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => startAddContent(request)}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Content
                    </button>
                  </div>

                  {/* Campaign Results Section */}
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                      {/* Toggle Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCampaignId(isExpanded ? null : request.id);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg transition-all duration-200"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                          <TrendingUp className="w-4 h-4 text-[var(--color-accent-primary)]" />
                          View Campaign Results ({campaignPosts.length} post{campaignPosts.length !== 1 ? 's' : ''})
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[var(--color-accent-primary)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Expandable Content */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">All Campaign Posts</h4>
                            <span className="text-xs text-[var(--color-text-tertiary)] font-mono">{campaignPosts.length} total</span>
                          </div>

                          {/* Posts List */}
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {campaignPosts.length === 0 ? (
                              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                                <p className="text-sm">No posts added to this campaign yet.</p>
                                <p className="text-xs mt-1 text-[var(--color-text-tertiary)]">Use the "Add Content" button above to add posts.</p>
                              </div>
                            ) : (
                              campaignPosts.map((post, idx) => (
                              <div
                                key={`${post.id}-${idx}`}
                                className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all duration-200"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    {/* Creator Info */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{post.creatorName}</span>
                                      <span className="text-xs text-[var(--color-text-tertiary)]">{post.creatorHandle}</span>
                                      <span className="px-2 py-0.5 text-xs bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-full border border-[var(--color-accent-primary)]/30">
                                        {post.platform}
                                      </span>
                                    </div>

                                    {/* Post Metrics */}
                                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                                      {post.date && (
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(post.date).toLocaleDateString()}
                                        </div>
                                      )}
                                      {post.impressions && (
                                        <div className="flex items-center gap-1 text-[var(--color-accent-primary)]">
                                          <Eye className="w-3 h-3" />
                                          {parseFloat(post.impressions).toLocaleString()} impressions
                                        </div>
                                      )}
                                      {post.cost && (
                                        <div className="flex items-center gap-1 text-green-500">
                                          <DollarSign className="w-3 h-3" />
                                          {post.cost}
                                        </div>
                                      )}
                                    </div>

                                    {/* Additional Metrics */}
                                    {(post.likes || post.comments) && (
                                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-tertiary)]">
                                        {post.likes && <span>♥ {post.likes} likes</span>}
                                        {post.comments && <span>💬 {post.comments} comments</span>}
                                      </div>
                                    )}
                                  </div>

                                  {/* Link */}
                                  {post.link && (
                                    <a
                                      href={post.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 text-xs text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] transition-colors whitespace-nowrap"
                                    >
                                      View
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              )}
          </div>
          );
        })}
        {filteredRequests.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-[var(--color-text-secondary)]">No campaigns found.</p>
          </div>
        )}
      </div>

      {/* Content Request Modal */}
      {showModal && (
        <ContentRequestModal
          creators={creators}
          onClose={() => setShowModal(false)}
          onSubmit={async (newRequest) => {
            if (!supabase) {
              // Fallback to local state if Supabase not configured
              setRequests([...requests, { ...newRequest, id: Date.now() }]);
              setShowModal(false);
              return;
            }

            try {
              // Create campaign in Supabase
              // Extract creator IDs from the creators array
              const creatorIds = (newRequest.creators || []).map(c => c.id);
              console.log('Creating campaign with creators:', creatorIds);

              const created = await createCampaign({
                title: newRequest.title,
                description: newRequest.description,
                creators: creatorIds,
                status: newRequest.status || 'pending',
                estimatedCost: newRequest.estimatedCost || 0,
                estimatedImpressions: newRequest.estimatedImpressions || 0
              });

              if (created) {
                setRequests([...requests, created]);
                setShowModal(false);
              } else {
                alert('Failed to create campaign');
              }
            } catch (error) {
              console.error('Error creating campaign:', error);
              alert('Failed to create campaign: ' + error.message);
            }
          }}
        />
      )}

      {/* Add Content Modal */}
      {addingContentForRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cancelAddContent}>
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Add Content for: {addingContentForRequest.title}
              </h3>
              <button
                onClick={cancelAddContent}
                className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Creator Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Select Creator {contentForm.selectedCreatorIds.length > 0 && '(1 selected)'} *
                </label>
                <div className="max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3 bg-[var(--color-bg-tertiary)] space-y-2">
                  {(() => {
                    console.log('Add Content Modal - Campaign creators:', addingContentForRequest.creators);
                    console.log('Add Content Modal - All creators:', creators.map(c => ({ id: c.id, name: c.name })));
                    const filteredCreators = creators.filter(c => (addingContentForRequest.creators || []).some(rc => rc.id === c.id));
                    console.log('Add Content Modal - Filtered creators:', filteredCreators.map(c => ({ id: c.id, name: c.name })));
                    return filteredCreators;
                  })()
                    .map((creator) => {
                      const isSelected = contentForm.selectedCreatorIds.includes(creator.id);
                      const isDisabled = contentForm.selectedCreatorIds.length > 0 && !isSelected;

                      return (
                        <label
                          key={creator.id}
                          className={`flex items-center space-x-2 p-2 rounded ${
                            isDisabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer hover:bg-[var(--color-bg-secondary)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={(e) => {
                              const isChecked = e.target.checked;

                              if (isChecked) {
                                // When selecting, only allow this one creator
                                const cost = creator.costPerPost
                                  ? parseFloat(creator.costPerPost.replace(/[^0-9.-]+/g, ''))
                                  : 0;

                                setContentForm({
                                  ...contentForm,
                                  selectedCreatorIds: [creator.id],
                                  cost: !isNaN(cost) && cost > 0 ? cost.toString() : ''
                                });
                              } else {
                                // When deselecting, clear selection and cost
                                setContentForm({
                                  ...contentForm,
                                  selectedCreatorIds: [],
                                  cost: ''
                                });
                              }
                            }}
                            className="h-4 w-4 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] border-[var(--color-border)] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-[var(--color-text-primary)]">
                            {creator.name} ({creator.handle})
                          </span>
                        </label>
                      );
                    })}
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Only showing creators assigned to this campaign
                </p>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Platforms ({contentForm.platforms.length} selected) *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['X', 'Facebook', 'Instagram', 'YouTube', 'TikTok'].map((platform) => (
                    <label
                      key={platform}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-[var(--color-bg-secondary)] p-2 rounded border border-[var(--color-border)]"
                    >
                      <input
                        type="checkbox"
                        checked={contentForm.platforms.includes(platform)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const newPlatforms = isChecked
                            ? [...contentForm.platforms, platform]
                            : contentForm.platforms.filter(p => p !== platform);

                          setContentForm({
                            ...contentForm,
                            platforms: newPlatforms
                          });
                        }}
                        className="h-4 w-4 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] border-[var(--color-border)] rounded"
                      />
                      <span className="text-sm text-[var(--color-text-primary)]">
                        {platform === 'X' ? 'X (Twitter)' : platform}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date and Cost in a grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={contentForm.date}
                    onChange={(e) => setContentForm({ ...contentForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1250.00"
                    value={contentForm.cost}
                    onChange={(e) => setContentForm({ ...contentForm, cost: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                  />
                </div>
              </div>

              {/* Per-Platform Content Entry */}
              {contentForm.platforms.length > 0 && (
                <div className="border-t border-[var(--color-border)] pt-4">
                  <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                    Platform Content & Metrics ({contentForm.platforms.length} platform{contentForm.platforms.length !== 1 ? 's' : ''})
                  </h4>
                  <div className="space-y-4">
                    {contentForm.platforms.map((platform) => (
                    <div key={platform} className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-bg-tertiary)]">
                      <h5 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
                        {platform === 'X' ? '🐦 X (Twitter)' :
                         platform === 'Facebook' ? '👍 Facebook' :
                         platform === 'Instagram' ? '📸 Instagram' :
                         platform === 'YouTube' ? '▶️ YouTube' :
                         '🎵 TikTok'}
                        {platform === 'X' && (
                          <span className="ml-2 text-xs text-green-500 font-normal">
                            (Auto-fills from Twitter API)
                          </span>
                        )}
                      </h5>

                      {/* Link */}
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                          Post URL
                          {platform === 'X' && fetchingTweetData && (
                            <span className="ml-2 text-xs text-blue-500 inline-flex items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Fetching...
                            </span>
                          )}
                        </label>
                        <input
                          type="url"
                          placeholder={`https://${platform.toLowerCase()}.com/...`}
                          value={contentForm.platformData[platform].link}
                          onChange={(e) => handlePlatformLinkChange(platform, e.target.value)}
                          disabled={platform === 'X' && fetchingTweetData}
                          className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] disabled:opacity-50"
                        />
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                            Impressions {platform !== 'X' && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="10000"
                            value={contentForm.platformData[platform].impressions}
                            onChange={(e) => updatePlatformData(platform, 'impressions', Number(e.target.value) || 0)}
                            disabled={platform === 'X' && fetchingTweetData}
                            className="w-full px-2 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1">
                            Likes
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="500"
                            value={contentForm.platformData[platform].likes}
                            onChange={(e) => updatePlatformData(platform, 'likes', Number(e.target.value) || 0)}
                            disabled={platform === 'X' && fetchingTweetData}
                            className="w-full px-2 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1">
                            {platform === 'X' ? 'Replies' : 'Comments'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="50"
                            value={contentForm.platformData[platform].comments}
                            onChange={(e) => updatePlatformData(platform, 'comments', Number(e.target.value) || 0)}
                            disabled={platform === 'X' && fetchingTweetData}
                            className="w-full px-2 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitContent}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 font-medium"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Content
                </button>
                <button
                  onClick={cancelAddContent}
                  className="px-4 py-2 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
function StatCard({ label, value, delay }) {
  return (
    <div
      className="card-editorial p-5 hover:scale-105 transition-transform duration-300"
      style={{ animation: `fadeInUp 0.6s ease-out ${delay} both` }}
    >
      <div className="metric-label mb-2">{label}</div>
      <div className="text-mono text-4xl font-bold text-[var(--color-text-primary)]">{value}</div>
    </div>
  );
}

export default ContentRequestsEditorial;
