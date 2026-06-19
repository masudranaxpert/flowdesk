import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import { Spinner } from './components/UI';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const BookmarksPage = lazy(() => import('./pages/Bookmarks'));
const NotebooksPage = lazy(() => import('./pages/Notebooks'));
const CodeBookPage = lazy(() => import('./pages/CodeBook'));
const QuestionsPage = lazy(() => import('./pages/Questions'));
const QuestionEditorPage = lazy(() => import('./pages/QuestionEditor'));
const CategoriesPage = lazy(() => import('./pages/Categories'));
const NoteEditorPage = lazy(() => import('./pages/NoteEditor'));
const SharePage = lazy(() => import('./pages/Share'));
const ChatbotPage = lazy(() => import('./pages/Chatbot'));
const RoutinePage = lazy(() => import('./pages/Routine'));
const FileSharePage = lazy(() => import('./pages/FileShare'));
const HisabPage = lazy(() => import('./pages/Hisab'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

function PageFallback() {
  return <Spinner />;
}

function ProtectedApp() {
  if (!localStorage.getItem('auth-token')) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
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
          <Route path="/files" element={<FileSharePage />} />
          <Route path="/hisab" element={<HisabPage />} />
        </Routes>
      </Suspense>
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
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/share/:type/:id" element={<SharePage />} />
            <Route path="/share/:shareCode" element={<SharePage />} />
            <Route path="/notebooks/new" element={<ProtectedApp />} />
            <Route path="/notebooks/:id/edit" element={<ProtectedApp />} />
            <Route path="/questions/new" element={<ProtectedApp />} />
            <Route path="/questions/:id/edit" element={<ProtectedApp />} />
            <Route path="/notebooks/:shareCode" element={<SharePage />} />
            <Route path="/codes/:shareCode" element={<SharePage />} />
            <Route path="/questions/:shareCode" element={<SharePage />} />
            <Route path="/bookmarks/:shareCode" element={<SharePage />} />
            <Route path="*" element={<ProtectedApp />} />
          </Routes>
        </Suspense>
    </BrowserRouter>
  );
}
