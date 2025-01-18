import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
    {
        path: "/",
        name: "Home",
        component: () => import("@/App.vue"),
        meta: { title: "NoT——____————____" }
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// 全局路由守卫
router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = to.meta.title;
    }
    next();
});

export default router;