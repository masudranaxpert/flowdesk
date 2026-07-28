import { BrowserRouter, Navigate, Routes, Route, Outlet } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout, { PublicDocsShell } from './components/Layout';
import { useAuth } from './hooks/useAuth';
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
const PasswordsPage = lazy(() => import('./pages/Passwords'));
const DocsPage = lazy(() => import('./pages/Docs'));
const DocReaderPage = lazy(() => import('./pages/DocReader'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VideoPlayer = lazy(() => import('./pages/VideoPlayer'));
const SharedVideoPlayer = lazy(() => import('./pages/SharedVideoPlayer'));

function PageFallback() {
  return <Spinner />;
}

function ProtectedApp() {
  if (!localStorage.getItem('auth-token')) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
}

/**
 * Docs are public: anyone can read. Logged-in visitors get the full app Layout
 * (with their notes/progress/search), logged-out visitors get the bare
 * PublicDocsShell. Auth state is reactive, so logging in/out swaps the shell
 * without a manual reload.
 */
function DocsLayout() {
  const isAuthed = useAuth();
  const Shell = isAuthed ? Layout : PublicDocsShell;
  return (
    <Shell>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </Shell>
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
            <Route path="/share/player/:shareCode" element={<SharedVideoPlayer />} />
            <Route path="/share/player/:type/:id" element={<SharedVideoPlayer />} />
            
            <Route element={<ProtectedApp />}>
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
              <Route path="/player/:fileId" element={<VideoPlayer />} />
              <Route path="/hisab" element={<HisabPage />} />
              <Route path="/passwords" element={<PasswordsPage />} />
            </Route>

            {/* Docs: public reading, full facilities when logged in */}
            <Route element={<DocsLayout />}>
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/docs/:categoryId" element={<DocsPage />} />
              <Route path="/docs/:categoryId/:chapterId" element={<DocReaderPage />} />
            </Route>

            <Route path="/notebooks/:shareCode" element={<SharePage />} />
            <Route path="/codes/:shareCode" element={<SharePage />} />
            <Route path="/questions/:shareCode" element={<SharePage />} />
            <Route path="/bookmarks/:shareCode" element={<SharePage />} />
            <Route path="/files/:shareCode" element={<SharePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
    </BrowserRouter>
  );
}
