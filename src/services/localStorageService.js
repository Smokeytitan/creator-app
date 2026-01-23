/**
 * Local Storage Service - Isolated Version
 * Uses browser localStorage instead of Supabase
 * This version is completely disconnected from any backend
 */

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  CREATORS: 'influencer_tool_creators',
  CAMPAIGNS: 'influencer_tool_campaigns',
  POSTS: 'influencer_tool_posts'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error);
    return [];
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error);
    return false;
  }
};

// ============================================================================
// CREATORS OPERATIONS
// ============================================================================

export const getCreators = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const creators = getFromStorage(STORAGE_KEYS.CREATORS);
      const posts = getFromStorage(STORAGE_KEYS.POSTS);

      // Attach posts to each creator
      const creatorsWithPosts = creators.map(creator => ({
        ...creator,
        posts: posts.filter(post => post.creator_id === creator.id)
      }));

      resolve(creatorsWithPosts);
    }, 100); // Simulate async delay
  });
};

export const getCreatorById = async (creatorId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const creators = getFromStorage(STORAGE_KEYS.CREATORS);
      const creator = creators.find(c => c.id === creatorId);

      if (creator) {
        const posts = getFromStorage(STORAGE_KEYS.POSTS);
        resolve({
          ...creator,
          posts: posts.filter(post => post.creator_id === creatorId)
        });
      } else {
        resolve(null);
      }
    }, 100);
  });
};

export const createCreator = async (creatorData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const creators = getFromStorage(STORAGE_KEYS.CREATORS);
      const newCreator = {
        id: Date.now(),
        name: creatorData.name,
        handle: creatorData.handle,
        notes: creatorData.notes || '',
        cost_per_post: creatorData.costPerPost || '',
        platforms: creatorData.platforms || [],
        active: creatorData.active !== false,
        posts: []
      };

      creators.push(newCreator);
      saveToStorage(STORAGE_KEYS.CREATORS, creators);
      resolve(newCreator);
    }, 100);
  });
};

export const updateCreator = async (creatorId, updates) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const creators = getFromStorage(STORAGE_KEYS.CREATORS);
      const index = creators.findIndex(c => c.id === creatorId);

      if (index !== -1) {
        creators[index] = {
          ...creators[index],
          name: updates.name !== undefined ? updates.name : creators[index].name,
          handle: updates.handle !== undefined ? updates.handle : creators[index].handle,
          notes: updates.notes !== undefined ? updates.notes : creators[index].notes,
          cost_per_post: updates.costPerPost !== undefined ? updates.costPerPost : creators[index].cost_per_post,
          platforms: updates.platforms !== undefined ? updates.platforms : creators[index].platforms,
          active: updates.active !== undefined ? updates.active : creators[index].active
        };

        saveToStorage(STORAGE_KEYS.CREATORS, creators);

        // Return creator with posts
        const posts = getFromStorage(STORAGE_KEYS.POSTS);
        resolve({
          ...creators[index],
          posts: posts.filter(post => post.creator_id === creatorId)
        });
      } else {
        resolve(null);
      }
    }, 100);
  });
};

export const deleteCreator = async (creatorId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const creators = getFromStorage(STORAGE_KEYS.CREATORS);
      const filtered = creators.filter(c => c.id !== creatorId);

      if (filtered.length < creators.length) {
        saveToStorage(STORAGE_KEYS.CREATORS, filtered);

        // Also delete associated posts
        const posts = getFromStorage(STORAGE_KEYS.POSTS);
        const filteredPosts = posts.filter(p => p.creator_id !== creatorId);
        saveToStorage(STORAGE_KEYS.POSTS, filteredPosts);

        resolve(true);
      } else {
        resolve(false);
      }
    }, 100);
  });
};

export const toggleCreatorActive = async (creatorId) => {
  const creator = await getCreatorById(creatorId);
  if (!creator) return null;
  return updateCreator(creatorId, { active: !creator.active });
};

// ============================================================================
// POSTS OPERATIONS
// ============================================================================

export const addPost = async (creatorId, postData, requestId = null) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const posts = getFromStorage(STORAGE_KEYS.POSTS);
      const newPost = {
        id: Date.now() + Math.random(),
        creator_id: creatorId,
        campaign_id: requestId,
        description: postData.description || '',
        platform: postData.platform || 'X',
        date: postData.date || null,
        cost: postData.cost || '',
        link: postData.link || '',
        impressions: postData.impressions || '',
        likes: postData.likes || '',
        comments: postData.comments || '',
        retweets: postData.retweets || '',
        quotes: postData.quotes || '',
        bookmarks: postData.bookmarks || '',
        tweet_id: postData.tweetId || null,
        last_scanned: postData.lastScanned || null,
        needs_rescan: false
      };

      posts.push(newPost);
      saveToStorage(STORAGE_KEYS.POSTS, posts);

      // Return updated creator
      getCreatorById(creatorId).then(resolve);
    }, 100);
  });
};

export const updatePost = async (postId, updates) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const posts = getFromStorage(STORAGE_KEYS.POSTS);
      const index = posts.findIndex(p => p.id === postId);

      if (index !== -1) {
        posts[index] = {
          ...posts[index],
          ...updates
        };
        saveToStorage(STORAGE_KEYS.POSTS, posts);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 100);
  });
};

export const deletePost = async (postId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const posts = getFromStorage(STORAGE_KEYS.POSTS);
      const filtered = posts.filter(p => p.id !== postId);

      if (filtered.length < posts.length) {
        saveToStorage(STORAGE_KEYS.POSTS, filtered);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 100);
  });
};

// ============================================================================
// CAMPAIGNS OPERATIONS
// ============================================================================

export const getCampaigns = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const campaigns = getFromStorage(STORAGE_KEYS.CAMPAIGNS);
      const creators = getFromStorage(STORAGE_KEYS.CREATORS);
      const posts = getFromStorage(STORAGE_KEYS.POSTS);

      // Transform to app format with calculated metrics
      const campaignsWithData = campaigns.map(campaign => {
        const campaignPosts = posts.filter(p => p.campaign_id === campaign.id);
        const campaignCreators = creators.filter(c =>
          campaign.creator_ids && campaign.creator_ids.includes(c.id)
        );

        // Calculate actual metrics from posts
        const actualImpressions = campaignPosts.reduce((sum, post) =>
          sum + parseInt(post.impressions || 0), 0
        );

        // Calculate cost by grouping posts by creator and date (packages)
        const packageMap = new Map();
        campaignPosts.forEach(post => {
          const packageKey = `${post.creator_id}-${post.date}`;
          if (!packageMap.has(packageKey)) {
            packageMap.set(packageKey, parseFloat(post.cost || 0));
          }
        });
        const actualCost = Array.from(packageMap.values()).reduce((sum, cost) => sum + cost, 0);

        return {
          id: campaign.id,
          title: campaign.title,
          description: campaign.description || '',
          status: campaign.status,
          startDate: campaign.start_date || null,
          estimatedCost: campaign.estimated_cost || 0,
          estimatedImpressions: campaign.estimated_impressions || 0,
          actualCost: actualCost || 0,
          actualImpressions: actualImpressions || 0,
          createdAt: campaign.created_at,
          posts: campaignPosts.map(post => ({
            id: post.id,
            link: post.link,
            impressions: post.impressions,
            cost: post.cost,
            platform: post.platform,
            date: post.date,
            creatorId: post.creator_id
          })),
          creators: campaignCreators.map(c => ({
            id: c.id,
            name: c.name,
            handle: c.handle,
            costPerPost: c.cost_per_post || '',
            platforms: c.platforms || []
          }))
        };
      });

      resolve(campaignsWithData);
    }, 100);
  });
};

export const getCampaignById = async (campaignId) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const campaigns = await getCampaigns();
      const campaign = campaigns.find(c => c.id === campaignId);
      resolve(campaign || null);
    }, 100);
  });
};

export const createCampaign = async (campaignData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const campaigns = getFromStorage(STORAGE_KEYS.CAMPAIGNS);
      const newCampaign = {
        id: Date.now(),
        title: campaignData.title,
        description: campaignData.description || '',
        status: campaignData.status || 'pending',
        start_date: campaignData.startDate || null,
        estimated_cost: campaignData.estimatedCost || 0,
        estimated_impressions: campaignData.estimatedImpressions || 0,
        creator_ids: campaignData.creators || [],
        created_at: new Date().toISOString()
      };

      campaigns.push(newCampaign);
      saveToStorage(STORAGE_KEYS.CAMPAIGNS, campaigns);

      // Return with full data
      getCampaignById(newCampaign.id).then(resolve);
    }, 100);
  });
};

export const updateCampaign = async (campaignId, updates) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const campaigns = getFromStorage(STORAGE_KEYS.CAMPAIGNS);
      const index = campaigns.findIndex(c => c.id === campaignId);

      if (index !== -1) {
        campaigns[index] = {
          ...campaigns[index],
          title: updates.title !== undefined ? updates.title : campaigns[index].title,
          description: updates.description !== undefined ? updates.description : campaigns[index].description,
          status: updates.status !== undefined ? updates.status : campaigns[index].status,
          start_date: updates.startDate !== undefined ? updates.startDate : campaigns[index].start_date,
          estimated_cost: updates.estimatedCost !== undefined ? updates.estimatedCost : campaigns[index].estimated_cost,
          estimated_impressions: updates.estimatedImpressions !== undefined ? updates.estimatedImpressions : campaigns[index].estimated_impressions,
          creator_ids: updates.creators !== undefined ? updates.creators : campaigns[index].creator_ids
        };

        saveToStorage(STORAGE_KEYS.CAMPAIGNS, campaigns);
        getCampaignById(campaignId).then(resolve);
      } else {
        resolve(null);
      }
    }, 100);
  });
};

export const updateCampaignStatus = async (campaignId, status) => {
  return updateCampaign(campaignId, { status });
};

export const deleteCampaign = async (campaignId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const campaigns = getFromStorage(STORAGE_KEYS.CAMPAIGNS);
      const filtered = campaigns.filter(c => c.id !== campaignId);

      if (filtered.length < campaigns.length) {
        saveToStorage(STORAGE_KEYS.CAMPAIGNS, filtered);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 100);
  });
};

export const getCampaignsByStatus = async (status) => {
  const campaigns = await getCampaigns();
  return campaigns.filter(c => c.status === status);
};

export const getCampaignsByCreator = async (creatorId) => {
  const campaigns = await getCampaigns();
  return campaigns.filter(c =>
    c.creators && c.creators.some(creator => creator.id === creatorId)
  );
};

export const getCampaignMetrics = async (status = null) => {
  const campaigns = status
    ? await getCampaignsByStatus(status)
    : await getCampaigns();

  return {
    totalRequests: campaigns.length,
    totalCost: campaigns.reduce((sum, r) => sum + Number(r.estimatedCost || 0), 0),
    totalImpressions: campaigns.reduce((sum, r) => sum + Number(r.estimatedImpressions || 0), 0),
    byStatus: {
      pending: campaigns.filter(r => r.status === 'pending').length,
      'in-progress': campaigns.filter(r => r.status === 'in-progress').length,
      completed: campaigns.filter(r => r.status === 'completed').length,
      cancelled: campaigns.filter(r => r.status === 'cancelled').length
    }
  };
};

export const bulkImportCreators = async (creators) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existing = getFromStorage(STORAGE_KEYS.CREATORS);
      const merged = [...existing];
      let count = 0;

      creators.forEach(creator => {
        const index = merged.findIndex(c => c.id === creator.id);
        if (index !== -1) {
          merged[index] = creator;
        } else {
          merged.push(creator);
        }
        count++;
      });

      saveToStorage(STORAGE_KEYS.CREATORS, merged);
      resolve(count);
    }, 100);
  });
};

export const bulkImportCampaigns = async (campaigns) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existing = getFromStorage(STORAGE_KEYS.CAMPAIGNS);
      const merged = [...existing];
      let count = 0;

      campaigns.forEach(campaign => {
        const index = merged.findIndex(c => c.id === campaign.id);
        if (index !== -1) {
          merged[index] = campaign;
        } else {
          merged.push(campaign);
        }
        count++;
      });

      saveToStorage(STORAGE_KEYS.CAMPAIGNS, merged);
      resolve(count);
    }, 100);
  });
};

// Legacy aliases
export const getRequests = getCampaigns;
export const getCampaignPosts = async (campaignId) => {
  const campaign = await getCampaignById(campaignId);
  return campaign ? campaign.posts : [];
};

export default {
  getCreators,
  getCreatorById,
  createCreator,
  updateCreator,
  deleteCreator,
  toggleCreatorActive,
  addPost,
  updatePost,
  deletePost,
  getRequests,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  deleteCampaign,
  getCampaignsByStatus,
  getCampaignsByCreator,
  getCampaignMetrics,
  getCampaignPosts,
  bulkImportCreators,
  bulkImportCampaigns
};
