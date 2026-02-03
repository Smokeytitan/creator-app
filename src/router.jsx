import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import CreatorRosterEditorial from './components/CreatorRosterEditorial';
import CreatorProspectsEditorial from './components/CreatorProspectsEditorial';
import { Campaigns } from './components/Campaigns';
import Analytics from './components/Analytics';
import FlashCampaignManager from './components/FlashCampaignManager';
import BotAnalyticsEditorial from './components/BotAnalyticsEditorial';
import ChannelManagerEditorial from './components/ChannelManagerEditorial';
import SocialConnections from './components/SocialConnections';
import SignInPage from './components/auth/SignInPage';

/**
 * Application Router Configuration
 * Defines all routes for the application
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/roster" replace />
      },
      {
        path: 'roster',
        element: <CreatorRosterEditorial />
      },
      {
        path: 'prospects',
        element: <CreatorProspectsEditorial />
      },
      {
        path: 'campaigns',
        element: <Campaigns />
      },
      {
        path: 'campaigns/:id',
        element: <Campaigns /> // Campaign detail view (same component handles it)
      },
      {
        path: 'analytics',
        element: <Analytics />
      },
      {
        path: 'kaito',
        element: <FlashCampaignManager />
      },
      {
        path: 'bot-analytics',
        element: <BotAnalyticsEditorial />
      },
      {
        path: 'channels',
        element: <ChannelManagerEditorial />
      },
      {
        path: 'connections',
        element: <SocialConnections />
      }
    ]
  },
  {
    path: '/sign-in',
    element: <SignInPage />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;
