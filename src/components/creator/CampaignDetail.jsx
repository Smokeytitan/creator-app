import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabaseClient';
import StatusBadge from './StatusBadge';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  BarChart3,
  FileText,
  Image,
  X as XIcon,
  Play,
  ShieldAlert,
} from 'lucide-react';

/**
 * CampaignDetail - Full campaign view for a creator.
 *
 * Verifies the current user is assigned to the campaign.
 * Displays title, description, brief, media gallery, and metadata.
 */
export default function CampaignDetail() {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded: isUserLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const fetchCampaign = useCallback(async () => {
    if (!user || !campaignId || !supabase) return;

    setLoading(true);
    setError(null);
    setAccessDenied(false);

    try {
      // Get creator_id for current user
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('creator_id')
        .eq('id', user.id)
        .single();

      if (userError || !userRow?.creator_id) {
        setAccessDenied(true);
        return;
      }

      // Verify assignment
      const { data: assignment, error: assignError } = await supabase
        .from('campaign_creators')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('creator_id', userRow.creator_id)
        .maybeSingle();

      if (assignError) throw assignError;

      if (!assignment) {
        setAccessDenied(true);
        return;
      }

      // Fetch the campaign
      const { data: campaignRow, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      setCampaign(campaignRow);
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError(err.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [user, campaignId]);

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchCampaign();
    }
  }, [isUserLoaded, user, fetchCampaign]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxUrl) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxUrl(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxUrl]);

  // ---- Helpers ----

  const isImageUrl = (url) => {
    if (!url) return false;
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext);
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'mov', 'ogg'].includes(ext);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '--';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ---- Render states ----

  if (!isUserLoaded || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--color-accent-primary)] border-r-transparent" />
          <p className="mt-4 text-[var(--color-text-secondary)] font-medium">
            Loading campaign...
          </p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            You are not assigned to this campaign.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-editorial-primary"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <p className="text-red-400 font-medium mb-2">Something went wrong</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  const mediaUrls = Array.isArray(campaign.media_urls) ? campaign.media_urls : [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to campaigns
      </button>

      {/* Title + Status */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] tracking-tight">
          {campaign.title || 'Untitled Campaign'}
        </h1>
        <StatusBadge status={campaign.status} size="lg" />
      </div>

      {/* Description */}
      {campaign.description && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
            {campaign.description}
          </p>
        </div>
      )}

      {/* Content Brief */}
      {campaign.brief && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[var(--color-accent-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Content Brief
            </h2>
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
            {campaign.brief}
          </div>
        </div>
      )}

      {/* Media Gallery */}
      {mediaUrls.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-[var(--color-accent-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Media ({mediaUrls.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mediaUrls.map((url, idx) => {
              if (isVideoUrl(url)) {
                return (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] aspect-video"
                  >
                    <video
                      src={url}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
                        <Play className="w-3 h-3" />
                        Video
                      </span>
                    </div>
                  </div>
                );
              }

              if (isImageUrl(url)) {
                return (
                  <button
                    key={idx}
                    onClick={() => setLightboxUrl(url)}
                    className="relative rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] aspect-square cursor-pointer group/img"
                  >
                    <img
                      src={url}
                      alt={`Campaign media ${idx + 1}`}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </button>
                );
              }

              // Fallback for unknown file types
              return (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-lg bg-[var(--color-bg-tertiary)] aspect-square text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  <FileText className="w-8 h-8" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <MetaCard
          icon={<Calendar className="w-4 h-4" />}
          label="Created"
          value={formatDate(campaign.created_at)}
        />
        <MetaCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Est. Cost"
          value={formatCurrency(campaign.estimated_cost)}
        />
        <MetaCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Est. Impressions"
          value={formatNumber(campaign.estimated_impressions)}
        />
        <MetaCard
          icon={<FileText className="w-4 h-4" />}
          label="Brief Sent"
          value={campaign.brief_sent_at ? formatDate(campaign.brief_sent_at) : '--'}
        />
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close lightbox"
          >
            <XIcon className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Enlarged media"
            className="max-w-full max-h-[85vh] rounded-lg object-contain animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Small metadata card used in the metadata grid.
 */
function MetaCard({ icon, label, value }) {
  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
      <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
