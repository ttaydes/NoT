import { createRouter, createWebHashHistory } from "vue-router"

const routes = [

    {
        path: '/',
        name: 'localhistory',
        component: () => import('@/views/LocalHistory.vue')
    }
]

export const router = createRouter({

    history: createWebHashHistory(),

    routes: routes

})

export default router
