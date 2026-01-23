/**
 * Campaigns Service - Isolated Version
 * This version uses localStorage instead of Supabase
 * For friend's isolated copy only
 */

import {
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
  bulkImportCampaigns
} from './localStorageService';

export {
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
  bulkImportCampaigns
};

export default {
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
  bulkImportCampaigns
};
