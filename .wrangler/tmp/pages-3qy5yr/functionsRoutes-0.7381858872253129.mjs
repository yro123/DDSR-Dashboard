import { onRequestPut as __api_clients__id__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\clients\\[id].js"
import { onRequestDelete as __api_documents__id__js_onRequestDelete } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\documents\\[id].js"
import { onRequestPut as __api_documents__id__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\documents\\[id].js"
import { onRequestGet as __api_email_snapshots__messageId__js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\email-snapshots\\[messageId].js"
import { onRequestDelete as __api_meeting_action_items__id__js_onRequestDelete } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meeting-action-items\\[id].js"
import { onRequestPut as __api_meeting_action_items__id__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meeting-action-items\\[id].js"
import { onRequestDelete as __api_meeting_notes__id__js_onRequestDelete } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meeting-notes\\[id].js"
import { onRequestPut as __api_meeting_notes__id__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meeting-notes\\[id].js"
import { onRequestDelete as __api_meeting_topics__id__js_onRequestDelete } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meeting-topics\\[id].js"
import { onRequestPut as __api_meeting_topics__id__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meeting-topics\\[id].js"
import { onRequestDelete as __api_meetings__id__js_onRequestDelete } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meetings\\[id].js"
import { onRequestPut as __api_meetings__id__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meetings\\[id].js"
import { onRequestPut as __api_people__id__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\people\\[id].js"
import { onRequestGet as __api_projects__slug__js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\projects\\[slug].js"
import { onRequestPut as __api_projects__slug__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\projects\\[slug].js"
import { onRequestDelete as __api_tasks__id__js_onRequestDelete } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\tasks\\[id].js"
import { onRequestGet as __api_tasks__id__js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\tasks\\[id].js"
import { onRequestPut as __api_tasks__id__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\tasks\\[id].js"
import { onRequestPut as __api_workflow_steps__id__js_onRequestPut } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\workflow-steps\\[id].js"
import { onRequestGet as __api_clients_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\clients.js"
import { onRequestPost as __api_clients_js_onRequestPost } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\clients.js"
import { onRequestGet as __api_documents_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\documents.js"
import { onRequestPost as __api_documents_js_onRequestPost } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\documents.js"
import { onRequestPost as __api_meeting_action_items_js_onRequestPost } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meeting-action-items.js"
import { onRequestPost as __api_meeting_notes_js_onRequestPost } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meeting-notes.js"
import { onRequestPost as __api_meeting_topics_js_onRequestPost } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meeting-topics.js"
import { onRequestGet as __api_meetings_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meetings.js"
import { onRequestPost as __api_meetings_index_js_onRequestPost } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\meetings\\index.js"
import { onRequestGet as __api_people_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\people.js"
import { onRequestPost as __api_people_js_onRequestPost } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\people.js"
import { onRequestPost as __api_projects_js_onRequestPost } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\projects.js"
import { onRequestGet as __api_tasks_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\tasks.js"
import { onRequestPost as __api_tasks_js_onRequestPost } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\tasks.js"
import { onRequestGet as __api_workflows_js_onRequestGet } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\api\\workflows.js"
import { onRequest as ___middleware_js_onRequest } from "C:\\Users\\allen\\Projects\\DDSR\\DDSR-Dashboard\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/clients/:id",
      mountPath: "/api/clients",
      method: "PUT",
      middlewares: [],
      modules: [__api_clients__id__js_onRequestPut],
    },
  {
      routePath: "/api/documents/:id",
      mountPath: "/api/documents",
      method: "DELETE",
      middlewares: [],
      modules: [__api_documents__id__js_onRequestDelete],
    },
  {
      routePath: "/api/documents/:id",
      mountPath: "/api/documents",
      method: "PUT",
      middlewares: [],
      modules: [__api_documents__id__js_onRequestPut],
    },
  {
      routePath: "/api/email-snapshots/:messageId",
      mountPath: "/api/email-snapshots",
      method: "GET",
      middlewares: [],
      modules: [__api_email_snapshots__messageId__js_onRequestGet],
    },
  {
      routePath: "/api/meeting-action-items/:id",
      mountPath: "/api/meeting-action-items",
      method: "DELETE",
      middlewares: [],
      modules: [__api_meeting_action_items__id__js_onRequestDelete],
    },
  {
      routePath: "/api/meeting-action-items/:id",
      mountPath: "/api/meeting-action-items",
      method: "PUT",
      middlewares: [],
      modules: [__api_meeting_action_items__id__js_onRequestPut],
    },
  {
      routePath: "/api/meeting-notes/:id",
      mountPath: "/api/meeting-notes",
      method: "DELETE",
      middlewares: [],
      modules: [__api_meeting_notes__id__js_onRequestDelete],
    },
  {
      routePath: "/api/meeting-notes/:id",
      mountPath: "/api/meeting-notes",
      method: "PUT",
      middlewares: [],
      modules: [__api_meeting_notes__id__js_onRequestPut],
    },
  {
      routePath: "/api/meeting-topics/:id",
      mountPath: "/api/meeting-topics",
      method: "DELETE",
      middlewares: [],
      modules: [__api_meeting_topics__id__js_onRequestDelete],
    },
  {
      routePath: "/api/meeting-topics/:id",
      mountPath: "/api/meeting-topics",
      method: "PUT",
      middlewares: [],
      modules: [__api_meeting_topics__id__js_onRequestPut],
    },
  {
      routePath: "/api/meetings/:id",
      mountPath: "/api/meetings",
      method: "DELETE",
      middlewares: [],
      modules: [__api_meetings__id__js_onRequestDelete],
    },
  {
      routePath: "/api/meetings/:id",
      mountPath: "/api/meetings",
      method: "PUT",
      middlewares: [],
      modules: [__api_meetings__id__js_onRequestPut],
    },
  {
      routePath: "/api/people/:id",
      mountPath: "/api/people",
      method: "PUT",
      middlewares: [],
      modules: [__api_people__id__js_onRequestPut],
    },
  {
      routePath: "/api/projects/:slug",
      mountPath: "/api/projects",
      method: "GET",
      middlewares: [],
      modules: [__api_projects__slug__js_onRequestGet],
    },
  {
      routePath: "/api/projects/:slug",
      mountPath: "/api/projects",
      method: "PUT",
      middlewares: [],
      modules: [__api_projects__slug__js_onRequestPut],
    },
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
      routePath: "/api/workflow-steps/:id",
      mountPath: "/api/workflow-steps",
      method: "PUT",
      middlewares: [],
      modules: [__api_workflow_steps__id__js_onRequestPut],
    },
  {
      routePath: "/api/clients",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_clients_js_onRequestGet],
    },
  {
      routePath: "/api/clients",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_clients_js_onRequestPost],
    },
  {
      routePath: "/api/documents",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_documents_js_onRequestGet],
    },
  {
      routePath: "/api/documents",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_documents_js_onRequestPost],
    },
  {
      routePath: "/api/meeting-action-items",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_meeting_action_items_js_onRequestPost],
    },
  {
      routePath: "/api/meeting-notes",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_meeting_notes_js_onRequestPost],
    },
  {
      routePath: "/api/meeting-topics",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_meeting_topics_js_onRequestPost],
    },
  {
      routePath: "/api/meetings",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_meetings_js_onRequestGet],
    },
  {
      routePath: "/api/meetings",
      mountPath: "/api/meetings",
      method: "POST",
      middlewares: [],
      modules: [__api_meetings_index_js_onRequestPost],
    },
  {
      routePath: "/api/people",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_people_js_onRequestGet],
    },
  {
      routePath: "/api/people",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_people_js_onRequestPost],
    },
  {
      routePath: "/api/projects",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_projects_js_onRequestPost],
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