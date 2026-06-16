import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BookmarksPage from './pages/Bookmarks';
import NotebooksPage from './pages/Notebooks';
import CodeBookPage from './pages/CodeBook';
import QuestionsPage from './pages/Questions';
import QuestionEditorPage from './pages/QuestionEditor';
import CategoriesPage from './pages/Categories';
import NoteEditorPage from './pages/NoteEditor';
import SharePage from './pages/Share';
import ChatbotPage from './pages/Chatbot';
import RoutinePage from './pages/Routine';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

function ProtectedApp() {
  if (!localStorage.getItem('auth-token')) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/notebooks" element={<NotebooksPage />} />
        <Route path="/notebooks/new" element={<NoteEditorPage />} />
        <Route path="/notebooks/:id/edit" element={<NoteEditorPage />} />
        <Route path="/codes" element={<CodeBookPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/questions/new" element={<QuestionEditorPage />} />
        <Route path="/questions/:id/edit" element={<QuestionEditorPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/routine" element={<RoutinePage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', localStorage.getItem('theme') !== 'light');
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'toast',
          duration: 3000,
        }}
      />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/share/:type/:id" element={<SharePage />} />
          <Route path="*" element={<ProtectedApp />} />
        </Routes>
    </BrowserRouter>
  );
}
