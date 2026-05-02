import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Navbar           from './components/Navbar';
import ProtectedRoute   from './components/ProtectedRoute';
import HomePage         from './pages/HomePage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import FindRidePage     from './pages/FindRidePage';
import PostRidePage     from './pages/PostRidePage';
import ProfilePage      from './pages/ProfilePage';
import DriverProfilePage from './pages/DriverProfilePage';

export default function App() {
  const init = useAuthStore(s => s.init);
  useEffect(() => { init(); }, []);

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <Routes>
          <Route path="/"         element={<HomePage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/find"       element={<FindRidePage />} />
            <Route path="/post"       element={<PostRidePage />} />
            <Route path="/profile"    element={<ProfilePage />} />
            <Route path="/driver/:id" element={<DriverProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}
