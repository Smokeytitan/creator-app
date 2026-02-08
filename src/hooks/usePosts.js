import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

const EMPTY_POST_FORM = { description: '', date: '', cost: 0, link: '', impressions: 0 };

/**
 * Post CRUD state and actions (Roster-only feature).
 *
 * @param {object} options
 * @param {Array}    options.creators    - Current creators list
 * @param {Function} options.setCreators - State setter
 */
export default function usePosts({ creators, setCreators }) {
  const [viewingPostsId, setViewingPostsId] = useState(null);
  const [addingPostId, setAddingPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postForm, setPostForm] = useState(EMPTY_POST_FORM);
  const toast = useToast();

  const toggleViewPosts = useCallback((creatorId, e) => {
    if (e) e.stopPropagation();
    setViewingPostsId((prev) => (prev === creatorId ? null : creatorId));
    setAddingPostId(null);
  }, []);

  const startAddPost = useCallback((creatorId, e) => {
    if (e) e.stopPropagation();
    const creator = creators.find((c) => c.id === creatorId);
    setAddingPostId(creatorId);
    setPostForm({
      description: '',
      date: new Date().toISOString().split('T')[0],
      cost: Number(creator?.costPerPost) || 0,
      link: '',
      impressions: 0,
    });
  }, [creators]);

  const cancelAddPost = useCallback((e) => {
    if (e) e.stopPropagation();
    setAddingPostId(null);
    setPostForm(EMPTY_POST_FORM);
  }, []);

  const savePost = useCallback((creatorId, e) => {
    if (e) e.stopPropagation();
    if (!postForm.description.trim()) {
      toast.warning('Description is required');
      return;
    }

    const newPost = {
      id: Date.now(),
      description: postForm.description,
      date: postForm.date || new Date().toISOString().split('T')[0],
      cost: Number(postForm.cost) || 0,
      link: postForm.link,
      impressions: Number(postForm.impressions) || 0,
    };

    setCreators(
      creators.map((c) => {
        if (c.id === creatorId) {
          return { ...c, posts: [...(c.posts || []), newPost] };
        }
        return c;
      })
    );

    setAddingPostId(null);
    setPostForm(EMPTY_POST_FORM);
  }, [creators, setCreators, postForm, toast]);

  const deletePost = useCallback((creatorId, postId, e) => {
    // Callers should use useConfirmDialog before calling this.
    if (e) e.stopPropagation();

    setCreators(
      creators.map((c) => {
        if (c.id === creatorId) {
          return { ...c, posts: (c.posts || []).filter((p) => p.id !== postId) };
        }
        return c;
      })
    );
  }, [creators, setCreators]);

  const startEditPost = useCallback((post, e) => {
    if (e) e.stopPropagation();
    setEditingPostId(post.id);
    setAddingPostId(null);
    setPostForm({
      description: post.description,
      date: post.date,
      cost: Number(post.cost) || 0,
      link: post.link || '',
      impressions: Number(post.impressions) || 0,
    });
  }, []);

  const cancelEditPost = useCallback((e) => {
    if (e) e.stopPropagation();
    setEditingPostId(null);
    setPostForm(EMPTY_POST_FORM);
  }, []);

  const saveEditPost = useCallback((creatorId, postId, e) => {
    if (e) e.stopPropagation();
    if (!postForm.description.trim()) {
      toast.warning('Description is required');
      return;
    }

    setCreators(
      creators.map((c) => {
        if (c.id === creatorId) {
          return {
            ...c,
            posts: (c.posts || []).map((p) => {
              if (p.id === postId) {
                return {
                  ...p,
                  description: postForm.description,
                  date: postForm.date,
                  cost: Number(postForm.cost) || 0,
                  link: postForm.link,
                  impressions: Number(postForm.impressions) || 0,
                };
              }
              return p;
            }),
          };
        }
        return c;
      })
    );

    setEditingPostId(null);
    setPostForm(EMPTY_POST_FORM);
  }, [creators, setCreators, postForm, toast]);

  return {
    viewingPostsId,
    addingPostId,
    editingPostId,
    postForm,
    setPostForm,
    toggleViewPosts,
    startAddPost,
    cancelAddPost,
    savePost,
    deletePost,
    startEditPost,
    cancelEditPost,
    saveEditPost,
  };
}
