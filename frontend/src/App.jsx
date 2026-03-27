import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ConfigEditorPage from './pages/ConfigEditorPage';
import ReportPage from './pages/ReportPage';
import SwaggerPage from './pages/SwaggerPage';
import PostmanPage from './pages/PostmanPage';
import FlowDesignerPage from './pages/FlowDesignerPage';
import ExecutionResults from './pages/ExecutionResults';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
          },
          success: { iconTheme: { primary: 'var(--green-500)', secondary: '#fff' } },
          error:   { iconTheme: { primary: 'var(--red-500)',   secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="config/:id" element={<ConfigEditorPage />} />
          <Route path="report/:id" element={<ReportPage />} />
          <Route path="swagger" element={<SwaggerPage />} />
          <Route path="postman" element={<PostmanPage />} />
          <Route path="flows" element={<FlowDesignerPage />} />
          <Route path="flows/:id" element={<FlowDesignerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/execution" element={<ExecutionResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
