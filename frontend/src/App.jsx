import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import DatasetOverview from './pages/admin/DatasetOverview';
import ETLPage from './pages/admin/ETLPage';
import OLAPPage from './pages/admin/OLAPPage';
import ClusteringPage from './pages/admin/ClusteringPage';
import VisualizationPage from './pages/admin/VisualizationPage';
import MoviesPage from './pages/admin/MoviesPage';
import RatingsPage from './pages/admin/RatingsPage';
import TagsPage from './pages/admin/TagsPage';
import SystemPage from './pages/admin/SystemPage';

// User pages
import UserDashboard from './pages/user/UserDashboard';
import DiscoverPage from './pages/user/DiscoverPage';
import RecommendationsPage from './pages/user/RecommendationsPage';
import MyRatingsPage from './pages/user/MyRatingsPage';
import ProfilePage from './pages/user/ProfilePage';
import MovieDetailPage from './pages/user/MovieDetailPage';

// Mock components for pages to avoid errors if they don't exist yet
const Placeholder = ({ name }) => <div className="p-8"><h1>{name} Page (Coming Soon)</h1></div>;

const AuthRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/user'} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      
      {/* Protected Routes inside Layout */}
      <Route path="/admin/*" element={<AuthRoute><Layout><Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/dataset" element={<DatasetOverview />} />
        <Route path="/etl" element={<ETLPage />} />
        <Route path="/olap" element={<OLAPPage />} />
        <Route path="/clustering" element={<ClusteringPage />} />
        <Route path="/visualization" element={<VisualizationPage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/ratings" element={<RatingsPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/system" element={<SystemPage />} />
      </Routes></Layout></AuthRoute>} />

      <Route path="/user/*" element={<AuthRoute><Layout><Routes>
        <Route path="/" element={<UserDashboard />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/my-ratings" element={<MyRatingsPage />} />
        <Route path="/ratings" element={<Navigate to="/user/my-ratings" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
      </Routes></Layout></AuthRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

