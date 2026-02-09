import { useState, useMemo, useRef } from "react";
import { Eye, DollarSign, Upload, X, FileText, Image, Film } from "lucide-react";
import { uploadCampaignMedia } from "../services/campaignsServiceSupabase";

export default function ContentRequestModal({ creators, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brief, setBrief] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]); // { file, previewUrl, uploading, uploadedUrl }
  const [selectedCreatorIds, setSelectedCreatorIds] = useState([creators?.[0]?.id].filter(Boolean));
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFiles = (files) => {
    const newEntries = files.map(file => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      uploading: false,
      uploadedUrl: null,
    }));
    setMediaFiles(prev => [...prev, ...newEntries]);
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => {
      const entry = prev[index];
      if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

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
      console.log('Processing creator in modal:', creator.name, 'costPerPost:', creator.costPerPost);
      const posts = creator.posts || [];

      // Parse cost per post (regardless of post count)
      let costPerPost = 0;
      if (creator.costPerPost) {
        const cost = Number(creator.costPerPost);
        console.log(`Parsed cost for ${creator.name}:`, cost);
        if (!isNaN(cost)) {
          costPerPost = cost;
        }
      }

      // Calculate average impressions only if posts exist
      let avgImpressions = 0;
      if (posts.length > 0) {
        const totalImpressions = posts.reduce((sum, post) => {
          if (post.impressions) {
            const impressions = Number(post.impressions);
            if (!isNaN(impressions)) {
              return sum + impressions;
            }
          }
          return sum;
        }, 0);
        avgImpressions = Math.round(totalImpressions / posts.length);
      }

      return {
        id: creator.id,
        avgImpressions,
        costPerPost
      };
    });
  }, [creators]);

  // Calculate estimated total impressions for selected creators
  const estimatedImpressions = useMemo(() => {
    console.log('Calculating estimated impressions for selectedCreatorIds:', selectedCreatorIds);
    console.log('Available creatorStats:', creatorStats.map(s => ({ id: s.id, avgImpressions: s.avgImpressions })));
    const total = selectedCreatorIds.reduce((total, creatorId) => {
      const stats = creatorStats.find(s => s.id === creatorId);
      console.log(`Creator ${creatorId}: found stats =`, stats);
      return total + (stats?.avgImpressions || 0);
    }, 0);
    console.log('Total estimated impressions:', total);
    return total;
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
      <div className="card-polygon w-full max-w-lg rounded-polygon shadow flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-polygon-text-primary">New Content Request</h3>
          <button className="text-polygon-text-secondary hover:text-gray-700 dark:hover:text-gray-300" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-6 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input
              className="mt-1 w-full rounded-md border border-white/[0.12] p-2 bg-white dark:bg-gray-900 text-polygon-text-primary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border border-white/[0.12] p-2 bg-white dark:bg-gray-900 text-polygon-text-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Content Brief */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Content Brief
              </div>
            </label>
            <textarea
              className="mt-1 w-full rounded-md border border-white/[0.12] p-2 bg-white dark:bg-gray-900 text-polygon-text-primary"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              placeholder="Detailed instructions for creators — talking points, tone, do's and don'ts..."
            />
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-1.5">
                <Image className="h-4 w-4" />
                Brief Media
              </div>
            </label>

            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
            >
              <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
              <p className="text-sm text-polygon-text-secondary">
                Click or drag files to upload images/videos
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Media previews */}
            {mediaFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {mediaFiles.map((entry, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    {entry.previewUrl ? (
                      <img src={entry.previewUrl} alt="" className="w-full h-20 object-cover" />
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <Film className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-[10px] text-polygon-text-secondary truncate px-1 py-0.5">
                      {entry.file.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Creators ({selectedCreatorIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-white/[0.12] rounded-md p-3 bg-white dark:bg-gray-900 space-y-2">
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
                        className="h-4 w-4 text-indigo-600 focus:ring-polygon-primary border-gray-300 rounded"
                      />
                      <span className="text-sm text-polygon-text-primary">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {costPerPost > 0 && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {costPerPost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      )}
                      {avgImpressions > 0 && (
                        <span className="text-xs text-polygon-text-secondary flex items-center gap-1">
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
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-polygon p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Campaign Cost</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-polygon-text-secondary mt-2">
                  Total cost for {selectedCreatorIds.length} creator{selectedCreatorIds.length !== 1 ? 's' : ''} (1 post each)
                </p>
              </div>
            )}

            {/* Estimated Impressions */}
            {selectedCreatorIds.length > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-polygon p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Impressions</span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {estimatedImpressions > 0 ? estimatedImpressions.toLocaleString() : 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-polygon-text-secondary mt-2">
                  {estimatedImpressions > 0
                    ? 'Based on average impressions per creator'
                    : 'No post history available for selected creators'}
                </p>
              </div>
            )}

            {/* Estimated CPM */}
            {estimatedCPM > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-polygon p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-polygon-text-secondary">Estimated CPM</span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    ${estimatedCPM.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-white/[0.12] p-2 bg-white dark:bg-gray-900 text-polygon-text-primary focus:ring-2 focus:ring-polygon-primary focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
          <button className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md btn-polygon-primary disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={async () => {
              const selectedCreators = creators.filter(c => selectedCreatorIds.includes(c.id));

              // Upload media files first — we need a temporary campaign ID
              // Media will be uploaded after campaign creation via the onSubmit callback
              const submitData = {
                title,
                description,
                brief: brief || '',
                mediaFiles: mediaFiles.map(e => e.file), // raw File objects for caller to upload
                creators: selectedCreators.map(c => ({
                  id: c.id,
                  name: c.name
                })),
                startDate: startDate ? new Date(startDate).toISOString() : null,
                status: "pending",
                estimatedCost: estimatedCost,
                estimatedImpressions: estimatedImpressions
              };
              onSubmit(submitData);
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
