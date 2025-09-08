import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../views/LoginPage.vue";
import DashboardPage from "../views/DashboardPage.vue";

const routes = [
  { path: "/", name: "Login", component: LoginPage },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardPage,
    meta: { requiresAuth: true },
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
