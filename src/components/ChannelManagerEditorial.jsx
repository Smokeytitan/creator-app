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

      setChannels(response.data.channels || []);
      setAllowAll(response.data.allowAll);

      // Set initially selected channels
      const allowed = new Set();
      if (response.data.channels) {
        response.data.channels.forEach(ch => {
          if (ch.isAllowed) allowed.add(ch.channelId);
        });
      }
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
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--color-accent-primary)] border-r-transparent"></div>
          <p className="mt-4 text-[var(--color-text-secondary)] text-mono font-medium">Loading channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="border-b border-[var(--color-border)] pb-8" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-5xl mb-3 text-[var(--color-text-primary)]">
              Channel Manager
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg">
              Configure which Telegram channels the bot monitors for content
            </p>
          </div>
          <button
            onClick={fetchChannels}
            disabled={loading}
            className="px-6 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)] transition-all duration-200 font-semibold flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 flex items-start gap-3 rounded-lg border ${
            message.type === 'error'
              ? 'border-red-500/50 bg-red-500/5'
              : 'border-[var(--color-accent-primary)]/50 bg-[var(--color-accent-primary)]/5'
          }`}
          style={{ animation: 'fadeInUp 0.4s ease-out' }}
        >
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${message.type === 'error' ? 'text-red-400' : 'text-[var(--color-accent-primary)]'}`} />
          <p className="text-sm text-[var(--color-text-primary)]">{message.text}</p>
        </div>
      )}

      {/* Allow All Toggle */}
      <div
        className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 hover:border-[var(--color-border-hover)] transition-all"
        style={{ animation: 'fadeInUp 0.4s ease-out 0.1s both' }}
      >
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            id="allowAll"
            checked={allowAll}
            onChange={toggleAllowAll}
            className="mt-1 h-5 w-5 rounded border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-accent-primary)] focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-0"
          />
          <div className="flex-1">
            <label htmlFor="allowAll" className="text-lg font-semibold text-[var(--color-text-primary)] cursor-pointer">
              Monitor All Channels
            </label>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              When enabled, the bot will monitor all Telegram channels it has access to. Disable to select specific channels below.
            </p>
          </div>
        </div>
      </div>

      {/* Channels List */}
      {channels.length === 0 ? (
        <div
          className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-12 text-center"
          style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}
        >
          <Radio className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No Channels Found</h3>
          <p className="text-[var(--color-text-secondary)]">
            The bot hasn't detected any channels yet. Add the bot to a Telegram channel and share an X post to get started.
          </p>
        </div>
      ) : (
        <div
          className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg overflow-hidden"
          style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}
        >
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Channels ({channels.length})
            </h3>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {channels.map((channel, index) => (
              <div
                key={channel.id}
                className={`px-6 py-4 flex items-center gap-4 transition-colors ${
                  allowAll ? 'opacity-60 pointer-events-none' : 'hover:bg-[var(--color-bg-tertiary)]'
                }`}
                style={{ animation: `slideInRight 0.3s ease-out ${index * 0.05}s both` }}
              >
                <input
                  type="checkbox"
                  id={`channel-${channel.id}`}
                  checked={allowAll || selectedChannels.has(channel.channelId)}
                  onChange={() => toggleChannel(channel.channelId)}
                  disabled={allowAll}
                  className="h-5 w-5 rounded border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-accent-primary)] focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-0 disabled:opacity-50"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`channel-${channel.id}`}
                    className="text-base font-medium text-[var(--color-text-primary)] cursor-pointer block truncate"
                  >
                    {channel.name}
                  </label>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 text-mono">
                    Channel ID: {channel.channelId} • {channel.postsCount} posts tracked
                  </p>
                </div>
                {(allowAll || selectedChannels.has(channel.channelId)) && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div
        className="flex justify-end gap-3"
        style={{ animation: 'fadeInUp 0.4s ease-out 0.3s both' }}
      >
        <button
          onClick={handleSave}
          disabled={saving || channels.length === 0}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white font-semibold flex items-center gap-2 min-w-[140px] justify-center hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
