import { createRouter, createWebHistory } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/auth/LoginView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/cadastro",
    name: "register",
    component: () => import("@/views/auth/RegisterView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/",
    component: () => import("@/layouts/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "home",
        redirect: { name: "participant-dashboard" },
      },
      {
        path: "participante",
        name: "participant-dashboard",
        component: () => import("@/views/participant/ParticipantDashboardView.vue"),
        meta: { roles: ["participante"] },
      },
      {
        path: "servidor",
        name: "server-dashboard",
        component: () => import("@/views/server/ServerDashboardView.vue"),
        meta: { roles: ["servidor"] },
      },
      {
        path: "gestor",
        name: "manager-dashboard",
        component: () => import("@/views/manager/ManagerDashboardView.vue"),
        meta: { roles: ["gestor"] },
      },
      {
        path: "programas/novo",
        name: "create-program",
        component: () => import("@/views/manager/CreateProgramView.vue"),
        meta: { roles: ["gestor"] },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function resolveHomeByRole(role) {
  if (role === "gestor") {
    return { name: "manager-dashboard" };
  }

  if (role === "servidor") {
    return { name: "server-dashboard" };
  }

  return { name: "participant-dashboard" };
}

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login" };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return resolveHomeByRole(authStore.userRole);
  }

  if (to.meta.roles && !to.meta.roles.includes(authStore.userRole)) {
    return resolveHomeByRole(authStore.userRole);
  }

  return true;
});

export default router;
