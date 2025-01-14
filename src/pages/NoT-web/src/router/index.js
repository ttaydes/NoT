import { createRouter, createWebHashHistory } from "vue-router"

const routes = [

    {
        path: '/',
        name: 'Notpage',
        component: () => import('@/App.vue')
    }
]

export const router = createRouter({

    history: createWebHashHistory(),

    routes: routes

})

export default router
