import { onRequestDelete as __api_tasks__id__js_onRequestDelete } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\tasks\\[id].js"
import { onRequestGet as __api_tasks__id__js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\tasks\\[id].js"
import { onRequestPut as __api_tasks__id__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\tasks\\[id].js"
import { onRequestGet as __api_clients_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\clients.js"
import { onRequestGet as __api_meetings_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meetings.js"
import { onRequestGet as __api_people_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\people.js"
import { onRequestGet as __api_tasks_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\tasks.js"
import { onRequestPost as __api_tasks_js_onRequestPost } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\tasks.js"
import { onRequestGet as __api_workflows_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\workflows.js"
import { onRequest as ___middleware_js_onRequest } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/tasks/:id",
      mountPath: "/api/tasks",
      method: "DELETE",
      middlewares: [],
      modules: [__api_tasks__id__js_onRequestDelete],
    },
  {
      routePath: "/api/tasks/:id",
      mountPath: "/api/tasks",
      method: "GET",
      middlewares: [],
      modules: [__api_tasks__id__js_onRequestGet],
    },
  {
      routePath: "/api/tasks/:id",
      mountPath: "/api/tasks",
      method: "PUT",
      middlewares: [],
      modules: [__api_tasks__id__js_onRequestPut],
    },
  {
      routePath: "/api/clients",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_clients_js_onRequestGet],
    },
  {
      routePath: "/api/meetings",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_meetings_js_onRequestGet],
    },
  {
      routePath: "/api/people",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_people_js_onRequestGet],
    },
  {
      routePath: "/api/tasks",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_tasks_js_onRequestGet],
    },
  {
      routePath: "/api/tasks",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_tasks_js_onRequestPost],
    },
  {
      routePath: "/api/workflows",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_workflows_js_onRequestGet],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]