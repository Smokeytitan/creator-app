/**
 * Creators Service - Isolated Version
 * This version uses localStorage instead of Supabase
 * For friend's isolated copy only
 */

import {
  getCreators,
  getCreatorById,
  createCreator,
  updateCreator,
  deleteCreator,
  toggleCreatorActive,
  addPost,
  updatePost,
  deletePost,
  bulkImportCreators
} from './localStorageService';

export {
  getCreators,
  getCreatorById,
  createCreator,
  updateCreator,
  deleteCreator,
  toggleCreatorActive,
  addPost,
  updatePost,
  deletePost,
  bulkImportCreators
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
  bulkImportCreators
};
