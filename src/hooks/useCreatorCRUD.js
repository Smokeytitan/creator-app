import { useState, useCallback } from 'react';
import { createCreator, updateCreator as updateCreatorInDB, deleteCreator as deleteCreatorFromDB, toggleCreatorActive } from '../services/creatorsServiceSupabase';
import { useToast } from '../contexts/ToastContext';

const EMPTY_FORM = { name: '', handle: '', notes: '', costPerPost: '', platforms: [] };

/**
 * Shared CRUD logic for both Roster and Prospects.
 *
 * @param {object} options
 * @param {Array}    options.items        - Current list (creators or prospects)
 * @param {Function} options.setItems     - State setter for the list
 * @param {string}   [options.defaultStatus='active'] - Status when creating a new item
 * @param {string}   [options.itemLabel='creator']    - Label used in user-facing messages
 */
export default function useCreatorCRUD({ items, setItems, defaultStatus = 'active', itemLabel = 'creator' }) {
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const toast = useToast();

  const resetForm = useCallback(() => {
    setEditingId(null);
    setIsAdding(false);
    setEditForm(EMPTY_FORM);
  }, []);

  const startEdit = useCallback((item) => {
    setEditingId(item.id);
    setIsAdding(false);
    setEditForm({
      name: item.name,
      handle: item.handle,
      notes: item.notes || '',
      costPerPost: item.costPerPost || '',
      platforms: item.platforms || [],
    });
  }, []);

  const startAdd = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }, []);

  const cancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const togglePlatform = useCallback((platform) => {
    setEditForm((prev) => {
      const platforms = prev.platforms || [];
      if (platforms.includes(platform)) {
        return { ...prev, platforms: platforms.filter((p) => p !== platform) };
      }
      return { ...prev, platforms: [...platforms, platform] };
    });
  }, []);

  const saveEdit = useCallback(async (itemId) => {
    try {
      const updatedItem = await updateCreatorInDB(itemId, editForm);
      if (updatedItem) {
        setItems(items.map((c) => (c.id === itemId ? updatedItem : c)));
      } else {
        // Fallback: update local state if Supabase update fails
        console.warn('Supabase update failed, updating local state only');
        setItems(items.map((c) => (c.id === itemId ? { ...c, ...editForm } : c)));
      }
      resetForm();
    } catch (error) {
      console.error(`Error updating ${itemLabel}:`, error);
      // Fallback: update local state if error occurs
      console.warn('Error occurred, updating local state only');
      setItems(items.map((c) => (c.id === itemId ? { ...c, ...editForm } : c)));
      resetForm();
    }
  }, [items, setItems, editForm, itemLabel, resetForm]);

  const saveNew = useCallback(async () => {
    if (!editForm.name.trim()) {
      toast.warning('Name is required');
      return;
    }

    try {
      const newItem = await createCreator({
        name: editForm.name,
        handle: editForm.handle || '@' + editForm.name.toLowerCase().replace(/\s+/g, '_'),
        notes: editForm.notes,
        costPerPost: editForm.costPerPost,
        platforms: editForm.platforms || [],
        status: defaultStatus,
      });

      setItems([...items, newItem]);
      resetForm();
      toast.success(`${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} created successfully`);
    } catch (error) {
      console.error(`Failed to create ${itemLabel}:`, error);
      toast.error(`Failed to create ${itemLabel}: ${error.message}`);
    }
  }, [items, setItems, editForm, defaultStatus, itemLabel, resetForm, toast]);

  const toggleActive = useCallback(async (itemId) => {
    try {
      const updated = await toggleCreatorActive(itemId);
      if (updated) {
        setItems(items.map((c) => (c.id === itemId ? updated : c)));
        toast.success(updated.active ? `${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} reactivated` : `${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} deactivated`);
      } else {
        toast.error(`Failed to update ${itemLabel} status`);
      }
    } catch (error) {
      console.error(`Error toggling ${itemLabel} active:`, error);
      toast.error(`Failed to update ${itemLabel} status`);
    }
  }, [items, setItems, itemLabel, toast]);

  const deleteItem = useCallback(async (itemId, e) => {
    // Note: callers should use useConfirmDialog before calling this.
    // This function performs the actual deletion without its own confirm.
    if (e) e.stopPropagation();

    const success = await deleteCreatorFromDB(itemId);
    if (success) {
      setItems(items.filter((c) => c.id !== itemId));
      toast.success(`${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} deleted`);
    } else {
      toast.error(`Failed to delete ${itemLabel}`);
    }
  }, [items, setItems, itemLabel, toast]);

  return {
    editingId,
    isAdding,
    editForm,
    setEditForm,
    startEdit,
    startAdd,
    cancelEdit,
    togglePlatform,
    saveEdit,
    saveNew,
    deleteItem,
    toggleActive,
  };
}
