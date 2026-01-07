import { useState, useMemo } from "react";
import { Eye, DollarSign, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ContentRequestModal({ creators, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCreatorIds, setSelectedCreatorIds] = useState([creators?.[0]?.id].filter(Boolean));
  const [dueDate, setDueDate] = useState(new Date());

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
      if (posts.length === 0) return { id: creator.id, avgImpressions: 0, costPerPost: 0 };

      const totalImpressions = posts.reduce((sum, post) => {
        if (post.impressions) {
          const impressions = parseFloat(post.impressions.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(impressions)) {
            return sum + impressions;
          }
        }
        return sum;
      }, 0);

      // Parse cost per post
      let costPerPost = 0;
      if (creator.costPerPost) {
        const cost = parseFloat(creator.costPerPost.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(cost)) {
          costPerPost = cost;
        }
      }

      return {
        id: creator.id,
        avgImpressions: posts.length > 0 ? Math.round(totalImpressions / posts.length) : 0,
        costPerPost
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

  // Calculate estimated total cost for selected creators
  const estimatedCost = useMemo(() => {
    return selectedCreatorIds.reduce((total, creatorId) => {
      const stats = creatorStats.find(s => s.id === creatorId);
      return total + (stats?.costPerPost || 0);
    }, 0);
  }, [selectedCreatorIds, creatorStats]);

  // Calculate estimated CPM
  const estimatedCPM = useMemo(() => {
    if (estimatedImpressions > 0 && estimatedCost > 0) {
      return (estimatedCost / estimatedImpressions) * 1000;
    }
    return 0;
  }, [estimatedImpressions, estimatedCost]);

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">New Content Request</h3>
          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-6 flex-1">
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
                const costPerPost = stats?.costPerPost || 0;
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
                    <div className="flex items-center gap-3">
                      {costPerPost > 0 && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {costPerPost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      )}
                      {avgImpressions > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {avgImpressions.toLocaleString()} avg
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Campaign Estimates */}
          <div className="grid grid-cols-1 gap-3">
            {/* Estimated Cost */}
            {estimatedCost > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Campaign Cost</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Total cost for {selectedCreatorIds.length} creator{selectedCreatorIds.length !== 1 ? 's' : ''} (1 post each)
                </p>
              </div>
            )}

            {/* Estimated Impressions */}
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
                  Based on average impressions per creator
                </p>
              </div>
            )}

            {/* Estimated CPM */}
            {estimatedCPM > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Estimated CPM</span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    ${estimatedCPM.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due date</label>
            <div className="relative">
              <DatePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                dateFormat="MMMM d, yyyy"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 pr-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                minDate={new Date()}
                showPopperArrow={false}
                wrapperClassName="w-full"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
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
                startDate: new Date().toISOString(),
                dueDate: dueDate.toISOString(),
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
