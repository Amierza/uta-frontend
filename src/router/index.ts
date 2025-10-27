import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../pages/LoginPage.vue";
import DashboardPage from "../pages/DashboardPage.vue";
import SessionsPage from "../pages/SessionsPage.vue";
import WaitingRoomPage from "../pages/WaitingRoomPage.vue";
import ChatSessionPage from "../pages/ChatSessionPage.vue";
import NotificationsPage from "../pages/NotificationPage.vue";
import SessionSummaryPage from "../pages/SessionSummaryPage.vue";
import SchedulesPage from "../pages/SchedulesPage.vue";
import ProfilePage from "../pages/ProfilePage.vue";

const routes = [
  { path: "/", name: "Login", component: LoginPage },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/sessions",
    name: "Sessions",
    component: SessionsPage,
    meta: {
      requiresAuth: true,
      title: "Semua Sesi Bimbingan",
    },
  },
  {
    path: "/waiting-room/:session_id",
    name: "WaitingRoom",
    component: WaitingRoomPage,
    meta: {
      requiresAuth: true,
      title: "Ruang Tunggu",
    },
  },
  {
    path: "/session/:session_id",
    name: "ChattingSession",
    component: ChatSessionPage,
    meta: {
      requiresAuth: true,
      title: "Halaman Chatting",
    },
  },
  {
    path: "/notifications",
    name: "Notifications",
    component: NotificationsPage,
    meta: {
      requiresAuth: true,
      title: "Semua Notification",
    },
  },
  {
    path: "/session/:session_id/summary",
    name: "SessionSummary",
    component: SessionSummaryPage,
    meta: {
      requiresAuth: true,
      title: "Halaman Summary",
    },
  },
  {
    path: "/schedules",
    name: "Schedules",
    component: SchedulesPage,
    meta: {
      requiresAuth: true,
      title: "Penjadwalan Bimbingan",
    },
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfilePage,
    meta: { requiresAuth: true, title: "Halaman Profile" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Middleware Authentication
router.beforeEach((to, _, next) => {
  const token = localStorage.getItem("access_token");

  // if route need login and empty token, next to login page
  if (to.meta.requiresAuth && !token) {
    return next("/");
  }

  // if already login, dont back to login page
  if (to.path === "/" && token) {
    return next("/dashboard");
  }

  next();
});

export default router;
