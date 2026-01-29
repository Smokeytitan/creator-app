import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabaseClient';

const PLATFORMS = [
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '𝕏',
    color: 'bg-black hover:bg-gray-800',
    available: true
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600',
    available: false // Coming soon
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👤',
    color: 'bg-blue-600 hover:bg-blue-700',
    available: false // Coming soon
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700 hover:bg-blue-800',
    available: false // Coming soon
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-gray-900 hover:bg-black',
    available: false // Coming soon
  }
];

export default function SocialConnections() {
  const { user } = useUser();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => {
    loadConnections();
  }, [user]);

  useEffect(() => {
    // Check for success/error messages in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('twitter_connected') === 'true') {
      // Give database a moment to sync, then reload
      setTimeout(() => {
        loadConnections();
      }, 500);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('twitter_error')) {
      const error = params.get('twitter_error');
      const details = params.get('details');
      alert(`Twitter connection failed: ${error}${details ? '\n' + details : ''}`);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading connections:', error);
      } else {
        console.log('Loaded connections:', data);
        setConnections(data || []);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platformId) => {
    if (!user) return;

    setConnecting(platformId);

    try {
      // Call the OAuth connect endpoint
      const response = await fetch(`/api/oauth/${platformId}/connect?userId=${user.id}`);
      const { authUrl, error } = await response.json();

      if (error) {
        console.error(`Failed to connect ${platformId}:`, error);
        alert(`Failed to connect ${platformId}. Please try again.`);
        setConnecting(null);
        return;
      }

      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error(`Error connecting ${platformId}:`, error);
      alert(`Error connecting ${platformId}. Please try again.`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformId) => {
    if (!confirm(`Are you sure you want to disconnect ${platformId}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', platformId);

      if (error) {
        console.error('Error disconnecting:', error);
        alert('Failed to disconnect. Please try again.');
      } else {
        loadConnections();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Error disconnecting. Please try again.');
    }
  };

  const isConnected = (platformId) => {
    return connections.some(conn => conn.platform === platformId);
  };

  const getConnectionInfo = (platformId) => {
    return connections.find(conn => conn.platform === platformId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-polygon-primary border-r-transparent"></div>
          <p className="mt-4 text-polygon-text-secondary">Loading connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Connected Accounts
        </h2>
        <p className="text-[var(--color-text-secondary)]">
          Connect your social media accounts to automatically fetch metrics when submitting content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map(platform => {
          const connected = isConnected(platform.id);
          const connectionInfo = getConnectionInfo(platform.id);
          const isConnecting = connecting === platform.id;

          return (
            <div
              key={platform.id}
              className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{platform.icon}</div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">
                      {platform.name}
                    </h3>
                    {connected && connectionInfo && (
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        @{connectionInfo.platform_username}
                      </p>
                    )}
                  </div>
                </div>

                {connected ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                    Connected
                  </span>
                ) : !platform.available ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-500/10 text-gray-500 border border-gray-500/20">
                    Coming Soon
                  </span>
                ) : null}
              </div>

              {platform.available && (
                <button
                  onClick={() => connected ? handleDisconnect(platform.id) : handleConnect(platform.id)}
                  disabled={isConnecting || !platform.available}
                  className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-all ${
                    connected
                      ? 'bg-red-600 hover:bg-red-700'
                      : isConnecting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : platform.color
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                      Connecting...
                    </span>
                  ) : connected ? (
                    'Disconnect'
                  ) : (
                    `Connect ${platform.name}`
                  )}
                </button>
              )}

              {!platform.available && (
                <button
                  disabled
                  className="w-full px-4 py-2 rounded-lg bg-gray-600/50 text-gray-400 font-medium cursor-not-allowed"
                >
                  Coming Soon
                </button>
              )}
            </div>
          );
        })}
      </div>

      {connections.length > 0 && (
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-[var(--color-text-secondary)]">
            💡 <strong>Tip:</strong> Connected accounts will be used to automatically fetch engagement metrics when you submit content to campaigns.
          </p>
        </div>
      )}
    </div>
  );
}
