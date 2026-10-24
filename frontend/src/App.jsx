import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AtsPage from "./pages/AtsPage";
import JobsPage from "./pages/JobsPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import CreateJobPage from "./pages/CreateJobPage";
import MyJobsPage from "./pages/MyJobsPage";
import ApplicantsPage from "./pages/ApplicantsPage";
import MyAssessmentsPage from "./pages/MyAssessmentsPage";
import AssessmentEditorPage from "./pages/AssessmentEditorPage";
import AvailableAssessmentsPage from "./pages/AvailableAssessmentsPage";
import TakeAssessmentPage from "./pages/TakeAssessmentPage";
import AssessmentResultsPage from "./pages/AssessmentResultsPage";
import AttemptDetailPage from "./pages/AttemptDetailPage";
import InterviewsPage from "./pages/InterviewsPage";
import InterviewSessionPage from "./pages/InterviewSessionPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminJobsPage from "./pages/AdminJobsPage";
import ScheduleInterviewPage from "./pages/ScheduleInterviewPage";
import RecruiterInterviewsPage from "./pages/RecruiterInterviewsPage";
import InterviewRoomPage from "./pages/InterviewRoomPage";
import MyScheduledInterviewsPage from "./pages/MyScheduledInterviewsPage";
import { NotificationProvider } from "./context/NotificationContext";
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          {/* Candidate */}
          <Route path="/ats" element={<ProtectedRoute roles={["candidate"]}><AtsPage /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute roles={["candidate"]}><JobsPage /></ProtectedRoute>} />
          <Route path="/my-applications" element={<ProtectedRoute roles={["candidate"]}><MyApplicationsPage /></ProtectedRoute>} />
          <Route path="/tests" element={<ProtectedRoute roles={["candidate"]}><AvailableAssessmentsPage /></ProtectedRoute>} />
          <Route path="/attempts/:id" element={<ProtectedRoute roles={["candidate"]}><TakeAssessmentPage /></ProtectedRoute>} />
          <Route path="/interviews" element={<ProtectedRoute roles={["candidate"]}><InterviewsPage /></ProtectedRoute>} />
          <Route path="/interviews/:id" element={<ProtectedRoute roles={["candidate"]}><InterviewSessionPage /></ProtectedRoute>} />
          <Route path="/my-interviews" element={<ProtectedRoute roles={["candidate"]}><MyScheduledInterviewsPage /></ProtectedRoute>} />
          {/* Recruiter */}
          <Route path="/my-jobs" element={<ProtectedRoute roles={["recruiter"]}><MyJobsPage /></ProtectedRoute>} />
          <Route path="/jobs/new" element={<ProtectedRoute roles={["recruiter"]}><CreateJobPage /></ProtectedRoute>} />
          <Route path="/jobs/:jobId/applicants" element={<ProtectedRoute roles={["recruiter"]}><ApplicantsPage /></ProtectedRoute>} />
          <Route path="/assessments" element={<ProtectedRoute roles={["recruiter"]}><MyAssessmentsPage /></ProtectedRoute>} />
          <Route path="/assessments/:id" element={<ProtectedRoute roles={["recruiter"]}><AssessmentEditorPage /></ProtectedRoute>} />
          <Route path="/assessments/:id/results" element={<ProtectedRoute roles={["recruiter"]}><AssessmentResultsPage /></ProtectedRoute>} />
          <Route path="/assessments/:id/results/:attemptId" element={<ProtectedRoute roles={["recruiter"]}><AttemptDetailPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/recruiter/interviews" element={<ProtectedRoute roles={["recruiter"]}><RecruiterInterviewsPage /></ProtectedRoute>} />
          <Route path="/recruiter/interviews/new/:applicationId" element={<ProtectedRoute roles={["recruiter"]}><ScheduleInterviewPage /></ProtectedRoute>} />
          <Route path="/recruiter/interviews/:id" element={<ProtectedRoute roles={["recruiter"]}><InterviewRoomPage /></ProtectedRoute>} />
          {/* admin */}
          <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute roles={["admin"]}><AdminJobsPage /></ProtectedRoute>} />
        </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}