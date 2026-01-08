import { useState, useEffect } from 'react';
import { Radio, RefreshCw, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function ChannelManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState([]);
  const [allowAll, setAllowAll] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState(new Set());
  const [message, setMessage] = useState(null);

  const apiKey = 'dev_secret_key_change_in_production';

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.get('/api/admin/channels', {
        headers: { 'X-API-Key': apiKey },
      });

      setChannels(response.data.channels);
      setAllowAll(response.data.allowAll);

      // Set initially selected channels
      const allowed = new Set();
      response.data.channels.forEach(ch => {
        if (ch.isAllowed) allowed.add(ch.channelId);
      });
      setSelectedChannels(allowed);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load channels. Make sure the bot is running.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await axios.post(
        '/api/admin/channels/allowed',
        {
          channelIds: Array.from(selectedChannels),
          allowAll,
        },
        {
          headers: { 'X-API-Key': apiKey },
        }
      );

      setMessage({
        type: 'success',
        text: response.data.message,
      });

      // Refresh channels to show updated state
      await fetchChannels();
    } catch (error) {
      console.error('Failed to update channels:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update channels',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (channelId) => {
    const newSelected = new Set(selectedChannels);
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId);
    } else {
      newSelected.add(channelId);
    }
    setSelectedChannels(newSelected);
  };

  const toggleAllowAll = () => {
    const newAllowAll = !allowAll;
    setAllowAll(newAllowAll);

    // If switching to allow all, select all channels
    if (newAllowAll) {
      setSelectedChannels(new Set(channels.map(ch => ch.channelId)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-polygon-primary border-r-transparent"></div>
          <p className="mt-4 text-polygon-text-secondary font-medium">Loading channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-polygon-text-primary">Channel Manager</h2>
          <p className="text-polygon-text-secondary mt-1">
            Configure which Telegram channels the bot monitors
          </p>
        </div>
        <button
          onClick={fetchChannels}
          disabled={loading}
          className="btn-polygon-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`card-polygon p-4 flex items-start gap-3 ${
            message.type === 'error' ? 'border-red-500/50 bg-red-500/5' : 'border-green-500/50 bg-green-500/5'
          }`}
        >
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`} />
          <p className="text-sm text-polygon-text-primary">{message.text}</p>
        </div>
      )}

      {/* Allow All Toggle */}
      <div className="card-polygon p-6">
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            id="allowAll"
            checked={allowAll}
            onChange={toggleAllowAll}
            className="mt-1 h-5 w-5 rounded border-white/20 bg-white/5 text-polygon-primary focus:ring-2 focus:ring-polygon-primary focus:ring-offset-0"
          />
          <div className="flex-1">
            <label htmlFor="allowAll" className="text-lg font-semibold text-polygon-text-primary cursor-pointer">
              Monitor All Channels
            </label>
            <p className="text-sm text-polygon-text-secondary mt-1">
              When enabled, the bot will monitor all Telegram channels it has access to. Disable to select specific channels below.
            </p>
          </div>
        </div>
      </div>

      {/* Channels List */}
      {channels.length === 0 ? (
        <div className="card-polygon p-12 text-center">
          <Radio className="w-12 h-12 text-polygon-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-polygon-text-primary mb-2">No Channels Found</h3>
          <p className="text-polygon-text-secondary">
            The bot hasn't detected any channels yet. Add the bot to a Telegram channel and share an X post to get started.
          </p>
        </div>
      ) : (
        <div className="card-polygon overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.08]">
            <h3 className="text-lg font-semibold text-polygon-text-primary">
              Channels ({channels.length})
            </h3>
          </div>
          <div className="divide-y divide-white/[0.08]">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className={`px-6 py-4 flex items-center gap-4 transition-colors ${
                  allowAll ? 'opacity-60 pointer-events-none' : 'hover:bg-white/[0.02]'
                }`}
              >
                <input
                  type="checkbox"
                  id={`channel-${channel.id}`}
                  checked={allowAll || selectedChannels.has(channel.channelId)}
                  onChange={() => toggleChannel(channel.channelId)}
                  disabled={allowAll}
                  className="h-5 w-5 rounded border-white/20 bg-white/5 text-polygon-primary focus:ring-2 focus:ring-polygon-primary focus:ring-offset-0 disabled:opacity-50"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`channel-${channel.id}`}
                    className="text-base font-medium text-polygon-text-primary cursor-pointer block truncate"
                  >
                    {channel.name}
                  </label>
                  <p className="text-sm text-polygon-text-secondary mt-0.5">
                    Channel ID: {channel.channelId} • {channel.postsCount} posts tracked
                  </p>
                </div>
                {(allowAll || selectedChannels.has(channel.channelId)) && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving || channels.length === 0}
          className="btn-polygon-primary flex items-center gap-2 min-w-[140px] justify-center"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
