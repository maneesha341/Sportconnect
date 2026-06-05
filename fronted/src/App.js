import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/globals.css';

import Navbar           from './components/Navbar/Navbar';
import Home             from './pages/Home/Home';
import FindTrainers     from './pages/FindTrainers/FindTrainers';
import Login            from './pages/Login/Login';
import Register         from './pages/Register/Register';
import CollegeDashboard from './pages/CollegeDashboard/CollegeDashboard';
import TrainerDashboard from './pages/TrainerDashboard/TrainerDashboard';
import AdminDashboard   from './pages/AdminDashboard/AdminDashboard';
import TrainerProfile   from './pages/TrainerProfile/TrainerProfile';
import ManageSlots      from './pages/ManageSlots/ManageSlots';
import BookTrainer      from './pages/BookTrainer/BookTrainer';
import Messages         from './pages/Messages/Messages';
import AIRecommend      from './pages/AIRecommend/AIRecommend';
import Notifications    from './pages/Notifications/Notifications';
import BookingHistory   from './pages/BookingHistory/BookingHistory';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color:'#fff', padding:40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin')   return <AdminDashboard />;
  if (user?.role === 'trainer') return <TrainerDashboard />;
  return <CollegeDashboard />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"                     element={<Home />} />
        <Route path="/find-trainers"        element={<FindTrainers />} />
        <Route path="/login"                element={<Login />} />
        <Route path="/register"             element={<Register />} />
        <Route path="/book/:trainerId"      element={<BookTrainer />} />
        <Route path="/dashboard"            element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
        <Route path="/trainer-profile"      element={<PrivateRoute role="trainer"><TrainerProfile /></PrivateRoute>} />
        <Route path="/slots"                element={<PrivateRoute role="trainer"><ManageSlots /></PrivateRoute>} />
        <Route path="/messages"             element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/messages/:partnerId"  element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/ai-recommend"         element={<PrivateRoute role="college"><AIRecommend /></PrivateRoute>} />
        <Route path="/notifications"        element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/booking-history"      element={<PrivateRoute><BookingHistory /></PrivateRoute>} />
        <Route path="/admin"                element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}