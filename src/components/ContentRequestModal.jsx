import { useState, useMemo } from "react";
import { Eye } from "lucide-react";

export default function ContentRequestModal({ creators, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCreatorIds, setSelectedCreatorIds] = useState([creators?.[0]?.id].filter(Boolean));
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  const toggleCreator = (creatorId) => {
    setSelectedCreatorIds(prev =>
      prev.includes(creatorId)
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  // Calculate average impressions per creator
  const creatorStats = useMemo(() => {
    return creators.map(creator => {
      const posts = creator.posts || [];
      if (posts.length === 0) return { id: creator.id, avgImpressions: 0 };

      const totalImpressions = posts.reduce((sum, post) => {
        if (post.impressions) {
          const impressions = parseFloat(post.impressions.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(impressions)) {
            return sum + impressions;
          }
        }
        return sum;
      }, 0);

      return {
        id: creator.id,
        avgImpressions: posts.length > 0 ? Math.round(totalImpressions / posts.length) : 0
      };
    });
  }, [creators]);

  // Calculate estimated total impressions for selected creators
  const estimatedImpressions = useMemo(() => {
    return selectedCreatorIds.reduce((total, creatorId) => {
      const stats = creatorStats.find(s => s.id === creatorId);
      return total + (stats?.avgImpressions || 0);
    }, 0);
  }, [selectedCreatorIds, creatorStats]);

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">New Content Request</h3>
          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Creators ({selectedCreatorIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-900 space-y-2">
              {creators.map((c) => {
                const stats = creatorStats.find(s => s.id === c.id);
                const avgImpressions = stats?.avgImpressions || 0;
                return (
                  <label key={c.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCreatorIds.includes(c.id)}
                        onChange={() => toggleCreator(c.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-50">{c.name}</span>
                    </div>
                    {avgImpressions > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {avgImpressions.toLocaleString()} avg
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Estimated Impressions Display */}
          {estimatedImpressions > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Impressions</span>
                </div>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {estimatedImpressions.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Based on average impressions from {selectedCreatorIds.length} selected creator{selectedCreatorIds.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due date</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
            onClick={() => {
              const selectedCreators = creators.filter(c => selectedCreatorIds.includes(c.id));
              onSubmit({
                title,
                description,
                creators: selectedCreators.map(c => ({
                  id: c.id,
                  name: c.name
                })),
                dueDate: new Date(dueDate).toISOString(),
                status: "pending",
              });
            }}
            disabled={!title.trim() || selectedCreatorIds.length === 0}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
