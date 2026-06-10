import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useProject } from '../context/ProjectContext'
import Avatar from '../components/Avatar'
import { PriorityPill } from '../components/Pill'
import type { TaskWithMeta } from '../../shared/types'

// ── Local data shapes ───────────────────────────────────────────────────────
// These describe the page-specific DTOs returned by the review/email endpoints.
// They are intentionally permissive (most fields optional) since the API surface
// is hand-rolled and the page reads fields defensively.

type Rating = 'High' | 'Medium' | 'Low'
type ResolutionBucket = '<1h' | '1-4h' | '1d' | 'multi-day'

interface ReviewTask extends Partial<Omit<TaskWithMeta, 'project_slug'>> {
  id: number
  title: string
  source_type?: string | null
  source_email_id?: string | null
  source_excerpt?: string | null
  confidence?: number | null
  due_date?: string | null
  priority?: string | null
  assignee_id?: number | null
  assignee_name?: string | null
  unmatched_assignee_name?: string | null
  unmatched_assignee_email?: string | null
  claude_reasoning?: string | null
  project_slug?: string | null
  project_name?: string | null
  email_from_name?: string | null
  email_subject?: string | null
  email_received_at?: string | null
}

interface ReviewPerson {
  id: number
  name: string
  email?: string | null
  role?: string | null
  org_type?: string | null
  avatar_bg?: string | null
  avatar_fg?: string | null
  is_active?: number | null
  user_id?: string | null
  client_name?: string | null
}

interface ActionItem {
  text: string
  assignee_email?: string | null
}

interface Topic {
  area: string
  notes?: string[]
  action_items?: ActionItem[]
}

interface MeetingQueueEntry {
  id: number
  title: string
  meeting_date?: string | null
  duration_mins?: number | null
  summary?: string | null
  attendee_emails?: string | null
  topics_json?: string | null
  source_email_id?: string | null
}

interface ReviewProject {
  id: number
  name: string
  client_name?: string | null
  client_display_name?: string | null
}

interface EmailSender {
  from_name: string
  from_email: string
  email_count: number
}

interface PartialMatch {
  sender: EmailSender
  person: ReviewPerson
}

interface EmailSnapshot {
  message_id: string
  subject?: string | null
  from_name?: string | null
  from_email?: string | null
  body_preview?: string | null
  body_full?: string | null
  received_at?: string | null
  project_id?: number | null
  project_name?: string | null
  urgency?: Rating | null
  criticality?: Rating | null
  resolution_bucket?: ResolutionBucket | null
  assessment_status?: string | null
  solution_outline?: string | null
  suggest_block?: boolean | number | null
  block_reason?: string | null
}

interface EmailGroup {
  project_id: number
  project_name: string
  client_domain?: string | null
  emails: EmailSnapshot[]
}

interface EmailSnapshotsData {
  groups?: EmailGroup[]
  unmatched?: EmailSnapshot[]
}

interface AnalysisResult {
  error?: string
  tasks_added?: number
  tasks_for_review?: number
  completions_marked?: number
  meeting_title?: string
}

import { formatMonthDay as fmtDate } from '../lib/dateUtils'

// Local YYYY-MM-DD for a Date (used by the emails-tab day filter).
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// UTC ISO bounds [start, end) covering the given local day (YYYY-MM-DD).
function localDayBounds(dateStr: string): { since: string; until: string } {
  const start = new Date(`${dateStr}T00:00:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { since: start.toISOString(), until: end.toISOString() }
}

// Add `days` to a YYYY-MM-DD string, returning a new YYYY-MM-DD string.
function shiftDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return localDateStr(d)
}

// Rows shown for a collapsed client window in the emails tab.
const COLLAPSED_EMAIL_ROWS = 3

function ConfidenceBadge({ confidence }: { confidence?: number | null }) {
  if (confidence == null) return <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>no score</span>
  const pct = Math.round(confidence * 100)
  const color = confidence >= 0.85 ? '#16a34a' : confidence >= 0.6 ? '#d97706' : '#dc2626'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', borderRadius: 4, padding: '2px 6px' }}>
      {pct}% confidence
    </span>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>All caught up</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>No items need review right now.</div>
    </div>
  )
}

// ── Email assessment (urgency / criticality / resolution) ──────────────────────

const RATING_ORDINAL: Record<string, number> = { High: 3, Medium: 2, Low: 1 }
const BUCKET_ORDINAL: Record<string, number> = { '<1h': 1, '1-4h': 2, '1d': 3, 'multi-day': 4 }
const RATING_COLOR: Record<string, string> = { High: '#dc2626', Medium: '#d97706', Low: '#6b7280' }
const SORT_KEYS = [
  { key: 'urgency', label: 'Urgency' },
  { key: 'criticality', label: 'Criticality' },
  { key: 'resolution', label: 'Time to resolve' },
]

type SortDir = 'asc' | 'desc'

// Sort emails by the chosen assessment key/direction (client-side, for the
// per-client group view). Unrated emails sort to the bottom.
function sortEmails(list: EmailSnapshot[], sort: string, dir: SortDir): EmailSnapshot[] {
  const sign = dir === 'asc' ? 1 : -1
  const val = (e: EmailSnapshot) =>
    sort === 'criticality' ? (RATING_ORDINAL[e.criticality ?? ''] ?? 0)
    : sort === 'resolution' ? (BUCKET_ORDINAL[e.resolution_bucket ?? ''] ?? 0)
    : (RATING_ORDINAL[e.urgency ?? ''] ?? 0)
  return [...list].sort((a, b) => {
    const d = (val(a) - val(b)) * sign
    if (d !== 0) return d
    return new Date(b.received_at || 0).getTime() - new Date(a.received_at || 0).getTime()
  })
}

function ratingPill(label: string, value?: Rating | null) {
  if (!value) return null
  const color = RATING_COLOR[value] || '#9ca3af'
  return (
    <span title={label} style={{ fontSize: 10, fontWeight: 700, color, background: color + '18', borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap' }}>
      {label[0]}: {value}
    </span>
  )
}

function AssessmentBadges({ email }: { email: EmailSnapshot }) {
  if (!email.urgency && !email.criticality && !email.resolution_bucket) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
      {ratingPill('Urgency', email.urgency)}
      {ratingPill('Criticality', email.criticality)}
      {email.resolution_bucket && (
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap' }}>
          ⏱ {email.resolution_bucket}
        </span>
      )}
      {email.assessment_status === 'waiting_on_others' && (
        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontStyle: 'italic' }}>waiting on others</span>
      )}
    </span>
  )
}

interface SortControlsProps {
  sort: string
  dir: SortDir
  onSort: (sort: string) => void
  onDir: (dir: SortDir) => void
}

// Compact sort controls (key dropdown + direction toggle) reused in each box header.
function SortControls({ sort, dir, onSort, onDir }: SortControlsProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
      <select value={sort} onChange={e => onSort(e.target.value)}
        style={{ fontSize: 11, padding: '2px 6px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
        {SORT_KEYS.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
      </select>
      <button onClick={() => onDir(dir === 'asc' ? 'desc' : 'asc')} title={dir === 'asc' ? 'Least → most' : 'Most → least'}
        style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
        {dir === 'asc' ? '↑' : '↓'}
      </button>
    </span>
  )
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────

interface TabDef {
  key: string
  label: string
  count: number
}

interface TabBarProps {
  tabs: TabDef[]
  active: string
  onChange: (key: string) => void
}

function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: active === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1,
            color: active === tab.key ? 'var(--text)' : 'var(--text-dim)',
            fontWeight: active === tab.key ? 700 : 400,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'inherit',
          }}
        >
          {tab.label}
          {tab.count > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: active === tab.key ? 'var(--accent)' : 'var(--surface-2)',
              color: active === tab.key ? '#fff' : 'var(--text-dim)',
              border: '1px solid var(--border)',
              borderRadius: 99, padding: '1px 7px',
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Pending Fathom Meeting Card ───────────────────────────────────────────────

interface PendingMeetingCardProps {
  entry: MeetingQueueEntry
  projects: ReviewProject[]
  onApprove: (entry: MeetingQueueEntry, projectId: number) => Promise<void> | void
  onReject: (entry: MeetingQueueEntry) => Promise<void> | void
}

function PendingMeetingCard({ entry, projects, onApprove, onReject }: PendingMeetingCardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const attendeeEmails: string[] = (() => { try { return JSON.parse(entry.attendee_emails || '[]') } catch { return [] } })()
  const topics: Topic[]          = (() => { try { return JSON.parse(entry.topics_json     || '[]') } catch { return [] } })()

  const handleApprove = async () => {
    if (!selectedProjectId) return
    setSubmitting(true)
    await onApprove(entry, parseInt(selectedProjectId, 10))
    setSubmitting(false)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid #6366f130',
      borderLeft: '4px solid #6366f1',
      borderRadius: 10,
      padding: '16px 18px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🎙️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3, lineHeight: 1.3 }}>
            {entry.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{fmtDate(entry.meeting_date)}</span>
            {entry.duration_mins && (
              <span style={{ fontSize: 11, color: '#6366f1', background: '#6366f115', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
                {entry.duration_mins} min
              </span>
            )}
            <span style={{ fontSize: 11, color: '#d97706', background: '#fef3c7', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
              ⚠️ No client match
            </span>
          </div>
        </div>
      </div>

      {entry.summary && (
        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, marginBottom: 10 }}>{entry.summary}</div>
      )}

      {attendeeEmails.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>Attendees ({attendeeEmails.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {attendeeEmails.map((email, i) => (
              <span key={i} style={{ fontSize: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '2px 8px', color: 'var(--text-muted)' }}>
                {email}
              </span>
            ))}
          </div>
        </div>
      )}

      {topics.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setExpanded(v => !v)} style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: expanded ? 8 : 0 }}>
            {expanded ? '▾' : '▸'} {topics.length} topic{topics.length !== 1 ? 's' : ''} extracted
          </button>
          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topics.map((topic, ti) => (
                <div key={ti} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: '3px solid #6366f1', borderRadius: '0 6px 6px 0', padding: '8px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{topic.area}</div>
                  {(topic.notes || []).map((note, ni) => (
                    <div key={ni} style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 2 }}>• {note}</div>
                  ))}
                  {(topic.action_items || []).length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      {(topic.action_items || []).map((item, ai) => (
                        <div key={ai} style={{ fontSize: 11, color: '#d97706', background: '#fef3c720', borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginRight: 4, marginTop: 2 }}>
                          ↗ {item.text}{item.assignee_email && <span style={{ opacity: 0.7 }}> · {item.assignee_email}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 200px', minWidth: 160 }}>
          <option value="">— assign to project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.client_name ? `${p.client_name} · ` : ''}{p.name}</option>)}
        </select>
        <button onClick={handleApprove} disabled={!selectedProjectId || submitting}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: 'none', background: selectedProjectId ? '#6366f1' : '#e5e7eb', color: selectedProjectId ? '#fff' : '#9ca3af', cursor: selectedProjectId ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
          {submitting ? 'Creating…' : '✓ Create Meeting'}
        </button>
        <button onClick={() => onReject(entry)}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}>
          ✕ Dismiss
        </button>
        {entry.source_email_id && (
          <a href={`https://outlook.office.com/mail/deeplink?ItemID=${encodeURIComponent(entry.source_email_id)}`}
            target="_blank" rel="noreferrer"
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            📧 Open in Outlook
          </a>
        )}
      </div>
    </div>
  )
}

// ── Task Review Card ──────────────────────────────────────────────────────────

interface ReviewCardProps {
  task: ReviewTask
  people: ReviewPerson[]
  onConfirm: (task: ReviewTask) => void
  onDismiss: (task: ReviewTask) => void
  onReassign: (task: ReviewTask, person: ReviewPerson) => void
}

function ReviewCard({ task, people, onConfirm, onDismiss, onReassign }: ReviewCardProps) {
  const [reassigning, setReassigning] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState('')
  const sourceIcon = task.source_type === 'fathom' ? '🎙️' : '📧'
  const personAv = (name?: string | null) => {
    const p = people.find(p => p.name === name)
    return { bg: p?.avatar_bg || '#F3F4F6', fg: p?.avatar_fg || '#374151' }
  }

  const handleReassign = () => {
    if (!selectedPerson) return
    const person = people.find(p => p.name === selectedPerson)
    if (!person) return
    onReassign(task, person)
    setReassigning(false)
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{sourceIcon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3, lineHeight: 1.3 }}>{task.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ConfidenceBadge confidence={task.confidence} />
            {task.due_date && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Due {fmtDate(task.due_date)}</span>}
            <PriorityPill priority={task.priority} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        {task.assignee_id ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Avatar name={task.assignee_name ?? undefined} {...personAv(task.assignee_name)} size={20} />
            <span style={{ fontSize: 12, color: 'var(--text)' }}>{task.assignee_name}</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, padding: '4px 8px', background: '#fef3c7', borderRadius: 6, display: 'inline-block' }}>
            ⚠️ Unmatched assignee
            {task.unmatched_assignee_name && <span style={{ color: '#92400e', fontWeight: 600 }}> — {task.unmatched_assignee_name}</span>}
            {task.unmatched_assignee_email && <span style={{ color: '#92400e' }}> ({task.unmatched_assignee_email})</span>}
            <span style={{ color: '#78350f', marginLeft: 4 }}>· Person needs to be created in Admin → People</span>
          </div>
        )}
      </div>

      {task.email_from_name && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
          From <strong style={{ color: 'var(--text-muted)' }}>{task.email_from_name}</strong>
          {task.email_subject && <> · <em>{task.email_subject}</em></>}
          {task.email_received_at && <> · {new Date(task.email_received_at).toLocaleDateString()}</>}
        </div>
      )}

      {task.source_excerpt && (
        <div style={{ fontSize: 12, color: 'var(--text)', background: 'var(--surface-2)', borderLeft: '3px solid var(--accent)', padding: '8px 10px', borderRadius: '0 6px 6px 0', marginBottom: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
          "{task.source_excerpt}"
        </div>
      )}

      {task.claude_reasoning && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600 }}>Claude: </span>{task.claude_reasoning}
        </div>
      )}

      {reassigning ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select autoFocus value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: 1 }}>
            <option value="">— select assignee —</option>
            {people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <button onClick={handleReassign} disabled={!selectedPerson}
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>Assign</button>
          <button onClick={() => setReassigning(false)}
            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => onConfirm(task)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>✓ Confirm task</button>
          <button onClick={() => setReassigning(true)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer' }}>↩ Reassign</button>
          <button onClick={() => onDismiss(task)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}>✕ Dismiss</button>
          {task.source_email_id && (
            <a href={`https://outlook.office.com/mail/deeplink?ItemID=${encodeURIComponent(task.source_email_id)}`}
              target="_blank" rel="noreferrer"
              style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              📧 Open in Outlook
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Project Section ───────────────────────────────────────────────────────────

interface ProjectSectionProps {
  name: string
  tasks: ReviewTask[]
  people: ReviewPerson[]
  onConfirm: (task: ReviewTask) => void
  onDismiss: (task: ReviewTask) => void
  onReassign: (task: ReviewTask, person: ReviewPerson) => void
}

function ProjectSection({ name, tasks, people, onConfirm, onDismiss, onReassign }: ProjectSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '12px 16px', background: 'var(--surface-2)',
          border: 'none', borderBottom: collapsed ? 'none' : '1px solid var(--border)',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{name}</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: '#fef3c7', color: '#d97706' }}>
          {tasks.length} item{tasks.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{collapsed ? '▶' : '▼'}</span>
      </button>

      {!collapsed && (
        <div style={{ padding: '12px 16px' }}>
          {tasks.map(task => (
            <ReviewCard key={task.id} task={task} people={people} onConfirm={onConfirm} onDismiss={onDismiss} onReassign={onReassign} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Partial Match Card ────────────────────────────────────────────────────────

interface PartialMatchCardProps {
  match: PartialMatch
  onUpdate: (person: ReviewPerson, sender: EmailSender) => Promise<void> | void
  onDismiss: (personId: number) => void
}

function PartialMatchCard({ match, onUpdate, onDismiss }: PartialMatchCardProps) {
  const { sender, person } = match
  const [submitting, setSubmitting] = useState(false)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '4px solid #f59e0b',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, background: '#6366f108', border: '1px solid #6366f120', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>From email</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sender.from_name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{sender.from_email}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{sender.email_count} email{sender.email_count !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-dim)', fontSize: 18 }}>→</div>
        <div style={{ flex: 1, background: '#16a34a08', border: '1px solid #16a34a20', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>In people table</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{person.name}</div>
          <div style={{ fontSize: 11, color: person.email ? 'var(--text-dim)' : '#d97706', marginTop: 1 }}>
            {person.email || '⚠️ no email'}
          </div>
          {person.client_name && (
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', marginTop: 3 }}>{person.client_name}</div>
          )}
          {person.role && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{person.role}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={async () => { setSubmitting(true); await onUpdate(person, sender); setSubmitting(false) }}
          disabled={submitting}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
        >
          {submitting ? 'Updating…' : '✓ Update record'}
        </button>
        <button
          onClick={() => onDismiss(person.id)}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          Not the same person
        </button>
      </div>
    </div>
  )
}

// ── New Person Card ───────────────────────────────────────────────────────────

interface NewPersonCardProps {
  sender: EmailSender
  projects: ReviewProject[]
  onAdd: (sender: EmailSender, projectId: string, role: string) => Promise<void> | void
  onSkip: (fromEmail: string) => void
}

function NewPersonCard({ sender, projects, onAdd, onSkip }: NewPersonCardProps) {
  const [selectedProject, setSelectedProject] = useState('')
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sender.from_name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
          {sender.from_email} · {sender.email_count} email{sender.email_count !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 180px', minWidth: 160 }}
        >
          <option value="">— assign to project —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.client_display_name ? `${p.client_display_name} · ` : ''}{p.name}
            </option>
          ))}
        </select>
        <input
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="Role (optional)"
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 140px', minWidth: 120 }}
        />
        <button
          onClick={async () => { setSubmitting(true); await onAdd(sender, selectedProject, role); setSubmitting(false) }}
          disabled={!selectedProject || submitting}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: 'none', background: selectedProject ? '#6366f1' : '#e5e7eb', color: selectedProject ? '#fff' : '#9ca3af', cursor: selectedProject ? 'pointer' : 'not-allowed', fontWeight: 600 }}
        >
          {submitting ? 'Adding…' : '+ Add person'}
        </button>
        <button
          onClick={() => onSkip(sender.from_email)}
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          Skip
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Review() {
  const { api, isAdmin, allProjects } = useProject()
  const navigate = useNavigate()

  const [activeTab, setActiveTab]                 = useState('tasks')
  const [tasks, setTasks]                         = useState<ReviewTask[]>([])
  const [peopleBySlug, setPeopleBySlug]           = useState<Record<string, ReviewPerson[]>>({})
  const [pendingMeetings, setPendingMeetings]     = useState<MeetingQueueEntry[]>([])
  const [projects, setProjects]                   = useState<ReviewProject[]>([])
  const [partialMatches, setPartialMatches]       = useState<PartialMatch[]>([])
  const [newPeople, setNewPeople]                 = useState<EmailSender[]>([])
  const [candidateProjects, setCandidateProjects] = useState<ReviewProject[]>([])
  const [loading, setLoading]                     = useState(true)

  // Emails tab — lazy loaded on first visit
  const [emailSnapshots, setEmailSnapshots]           = useState<EmailSnapshotsData | null>(null)
  const [analyzingGroup, setAnalyzingGroup]           = useState<string | null>(null)
  const [emailAnalysisResult, setEmailAnalysisResult] = useState<Record<string, AnalysisResult | null>>({})
  const [emailSearch, setEmailSearch]                 = useState('')
  const [expandedEmailIds, setExpandedEmailIds]       = useState<Set<string>>(new Set())
  const [selectedUnmatchedIds, setSelectedUnmatchedIds] = useState<Set<string>>(new Set())
  const [unmatchedBulkProjectId, setUnmatchedBulkProjectId] = useState('')
  // Emails tab: selected day (local) — defaults to today; only one client window
  // expands at a time (others collapse to a few rows so the page stays short).
  const [emailDate, setEmailDate]             = useState<string>(() => localDateStr(new Date()))
  const [expandedClientKey, setExpandedClientKey] = useState<string | null>(null)
  // Emails tab: assessment sort (shared by every group box + the Needs Attention box).
  const [emailSort, setEmailSort]             = useState('urgency')
  const [emailSortDir, setEmailSortDir]       = useState<SortDir>('desc')
  // Cross-client "Needs Attention" list (last 3 days, non-task, unresolved).
  const [attentionEmails, setAttentionEmails] = useState<EmailSnapshot[] | null>(null)
  const [resolvedIds, setResolvedIds]         = useState<Set<string>>(new Set())

  // Manual tab
  const [manualTaskText, setManualTaskText]           = useState('')
  const [manualTaskProjectId, setManualTaskProjectId] = useState('')
  const [manualTaskSubmitting, setManualTaskSubmitting] = useState(false)
  const [manualTaskResult, setManualTaskResult]       = useState<AnalysisResult | null>(null)
  const [manualMeetingText, setManualMeetingText]         = useState('')
  const [manualMeetingProjectId, setManualMeetingProjectId] = useState('')
  const [manualMeetingSubmitting, setManualMeetingSubmitting] = useState(false)
  const [manualMeetingResult, setManualMeetingResult]     = useState<AnalysisResult | null>(null)

  useEffect(() => {
    // Review is an all-clients admin view; non-admins go home.
    if (!isAdmin) navigate('/', { replace: true })
  }, [isAdmin, navigate])

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)

    Promise.all([
      api.get<ReviewTask[]>('/api/tasks?review=1&all=1').catch(() => [] as ReviewTask[]),
      api.get<{ entries?: MeetingQueueEntry[]; projects?: ReviewProject[] }>('/api/admin/fathom-meeting-queue').catch(() => ({ entries: [], projects: [] })),
      api.get<{ partialMatches?: PartialMatch[]; newPeople?: EmailSender[]; projects?: ReviewProject[] }>('/api/people-candidates').catch(() => ({ partialMatches: [], newPeople: [], projects: [] })),
      ...allProjects.map(p => api.get<ReviewPerson[]>(`/api/people?slug=${p.slug}`).catch(() => [] as ReviewPerson[])),
    ]).then((results) => {
      const [t, q, candidates, ...peopleSets] = results as [
        ReviewTask[],
        { entries?: MeetingQueueEntry[]; projects?: ReviewProject[] },
        { partialMatches?: PartialMatch[]; newPeople?: EmailSender[]; projects?: ReviewProject[] },
        ...ReviewPerson[][],
      ]
      setTasks(Array.isArray(t) ? t : [])
      setPendingMeetings(q.entries || [])
      setProjects(q.projects || [])
      setPartialMatches(candidates.partialMatches || [])
      setNewPeople(candidates.newPeople || [])
      setCandidateProjects(candidates.projects || [])
      const bySlug: Record<string, ReviewPerson[]> = {}
      allProjects.forEach((p, i) => { bySlug[p.slug] = peopleSets[i] || [] })
      setPeopleBySlug(bySlug)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [api, isAdmin])

  // Load email snapshots for the selected day when the emails tab is active.
  // Refetches whenever the day changes so the date filter can reach past days
  // beyond the 300-row cap.
  useEffect(() => {
    if (activeTab !== 'emails' || !isAdmin) return
    setEmailSnapshots(null)
    setExpandedClientKey(null)
    const { since, until } = localDayBounds(emailDate)
    const qs = `since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`
    api.get<EmailSnapshotsData>(`/api/admin/email-snapshots?${qs}`)
      .then(data => setEmailSnapshots(data))
      .catch(() => setEmailSnapshots({ groups: [], unmatched: [] }))
  }, [activeTab, emailDate, isAdmin, api])

  // Load the cross-client "Needs Attention" list (last 3 days, non-task, open).
  // Refetches when the sort key/direction changes so ordering is server-side.
  useEffect(() => {
    if (activeTab !== 'emails' || !isAdmin) return
    setAttentionEmails(null)
    const qs = `sort=${emailSort}&dir=${emailSortDir}`
    api.get<{ emails?: EmailSnapshot[] }>(`/api/admin/email-attention?${qs}`)
      .then(data => setAttentionEmails(data.emails || []))
      .catch(() => setAttentionEmails([]))
  }, [activeTab, emailSort, emailSortDir, isAdmin, api])

  // Mark an email's thread resolved — drops it from the Needs Attention view.
  const resolveEmail = async (messageId: string) => {
    setResolvedIds(prev => new Set(prev).add(messageId))
    setAttentionEmails(prev => (prev || []).filter(e => e.message_id !== messageId))
    await api.post('/api/admin/email-resolve', { message_id: messageId }).catch(() => null)
  }

  // Block a sender from future evaluation (adds to ignore_rules) and remove all
  // of their emails from the current views.
  const blockSender = async (fromEmail?: string | null, reason?: string | null) => {
    const sender = fromEmail?.trim().toLowerCase()
    if (!sender) return
    const drop = (e: EmailSnapshot) => e.from_email?.toLowerCase() !== sender
    setAttentionEmails(prev => (prev || []).filter(drop))
    setEmailSnapshots(prev => prev ? {
      groups: (prev.groups || []).map(g => ({ ...g, emails: g.emails.filter(drop) })),
      unmatched: (prev.unmatched || []).filter(drop),
    } : prev)
    await api.post('/api/admin/ignore-sender', { sender, reason: reason || undefined }).catch(() => null)
  }

  const removeTask    = (id: number) => setTasks(prev => prev.filter(t => t.id !== id))
  const removeMeeting = (id: number) => setPendingMeetings(prev => prev.filter(m => m.id !== id))

  const confirmTask = async (task: ReviewTask) => {
    await api.put(`/api/tasks/${task.id}`, { ...task, user_feedback: 'correct' }).catch(() => null)
    removeTask(task.id)
  }

  const dismissTask = async (task: ReviewTask) => {
    await api.put(`/api/tasks/${task.id}`, { ...task, is_archived: 1, user_feedback: 'not_a_task' }).catch(() => null)
    removeTask(task.id)
  }

  const reassignTask = async (task: ReviewTask, person: ReviewPerson) => {
    await api.put(`/api/tasks/${task.id}`, { ...task, assignee_id: person.id, assignee_name: person.name, user_feedback: 'correct' }).catch(() => null)
    removeTask(task.id)
  }

  const approveMeeting = async (entry: MeetingQueueEntry, project_id: number) => {
    try {
      await api.put(`/api/admin/fathom-meeting-queue/${entry.id}`, { project_id })
      removeMeeting(entry.id)
    } catch (err) {
      console.error('Failed to approve meeting:', err)
    }
  }

  const rejectMeeting = async (entry: MeetingQueueEntry) => {
    try {
      await api.del(`/api/admin/fathom-meeting-queue/${entry.id}`)
      removeMeeting(entry.id)
    } catch (err) {
      console.error('Failed to reject meeting:', err)
    }
  }

  const updatePersonFromEmail = async (person: ReviewPerson, sender: EmailSender) => {
    try {
      await api.put(`/api/people/${person.id}`, {
        name: sender.from_name,
        email: sender.from_email,
        role: person.role,
        org_type: person.org_type,
        avatar_bg: person.avatar_bg,
        avatar_fg: person.avatar_fg,
        is_active: person.is_active ?? 1,
        user_id: person.user_id || null,
      })
      setPartialMatches(prev => prev.filter(m => m.person.id !== person.id))
    } catch (err) {
      console.error('Failed to update person:', err)
    }
  }

  const dismissMatch = (personId: number) => {
    setPartialMatches(prev => prev.filter(m => m.person.id !== personId))
  }

  const addNewPerson = async (sender: EmailSender, projectId: string, role: string) => {
    try {
      await api.post('/api/people', {
        project_id: parseInt(projectId, 10),
        name: sender.from_name,
        email: sender.from_email,
        role: role || null,
      })
      setNewPeople(prev => prev.filter(s => s.from_email !== sender.from_email))
    } catch (err) {
      console.error('Failed to add person:', err)
    }
  }

  const skipNewPerson = (fromEmail: string) => {
    setNewPeople(prev => prev.filter(s => s.from_email !== fromEmail))
  }

  const analyzeEmailGroup = async (messageIds: string[], projectId: number | null, groupKey: string) => {
    setAnalyzingGroup(groupKey)
    setEmailAnalysisResult(prev => ({ ...prev, [groupKey]: null }))
    try {
      const result = await api.post<AnalysisResult>('/api/admin/analyze-snapshots', { message_ids: messageIds, project_id: projectId })
      setEmailAnalysisResult(prev => ({ ...prev, [groupKey]: result }))
    } catch (err) {
      console.error('Email analysis failed:', err)
      setEmailAnalysisResult(prev => ({ ...prev, [groupKey]: { error: (err as Error).message } }))
    }
    setAnalyzingGroup(null)
  }

  const submitManualTasks = async () => {
    if (!manualTaskText.trim() || !manualTaskProjectId) return
    setManualTaskSubmitting(true)
    setManualTaskResult(null)
    try {
      const result = await api.post<AnalysisResult>('/api/admin/analyze-text', { text: manualTaskText, project_id: parseInt(manualTaskProjectId, 10), type: 'tasks' })
      setManualTaskResult(result)
      setManualTaskText('')
    } catch (err) {
      setManualTaskResult({ error: (err as Error).message })
    }
    setManualTaskSubmitting(false)
  }

  const submitManualMeeting = async () => {
    if (!manualMeetingText.trim() || !manualMeetingProjectId) return
    setManualMeetingSubmitting(true)
    setManualMeetingResult(null)
    try {
      const result = await api.post<AnalysisResult>('/api/admin/analyze-text', { text: manualMeetingText, project_id: parseInt(manualMeetingProjectId, 10), type: 'meeting' })
      setManualMeetingResult(result)
      setManualMeetingText('')
    } catch (err) {
      setManualMeetingResult({ error: (err as Error).message })
    }
    setManualMeetingSubmitting(false)
  }

  interface ProjectGroup {
    project_name: string
    project_slug: string
    items: ReviewTask[]
  }

  const projectGroups: ProjectGroup[] = Object.values(
    tasks.reduce<Record<string, ProjectGroup>>((acc, task) => {
      const ps = task.project_slug || 'unknown'
      if (!acc[ps]) acc[ps] = { project_name: task.project_name || ps, project_slug: ps, items: [] }
      acc[ps].items.push(task)
      return acc
    }, {})
  )

  const tabs: TabDef[] = [
    { key: 'meetings', label: '🎙️ Meetings', count: pendingMeetings.length },
    { key: 'tasks',    label: '📋 Tasks',    count: tasks.length },
    { key: 'people',   label: '👥 People',   count: partialMatches.length + newPeople.length },
    { key: 'emails',   label: '📧 Emails',   count: 0 },
    { key: 'manual',   label: '✏️ Manual',   count: 0 },
  ]
  const totalItems = pendingMeetings.length + tasks.length + partialMatches.length + newPeople.length

  return (
    <Layout>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Needs Review</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              All clients — meetings, tasks, and people awaiting review
            </div>
          </div>
          {!loading && (
            <span style={{ fontSize: 13, fontWeight: 700, color: totalItems > 0 ? '#d97706' : '#16a34a' }}>
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>}

        {!loading && (
          <>
            <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {/* ── Meetings tab ─────────────────────────────────────────────── */}
            {activeTab === 'meetings' && (
              pendingMeetings.length === 0
                ? <EmptyState />
                : pendingMeetings.map(entry => (
                    <PendingMeetingCard key={entry.id} entry={entry} projects={projects} onApprove={approveMeeting} onReject={rejectMeeting} />
                  ))
            )}

            {/* ── Tasks tab ────────────────────────────────────────────────── */}
            {activeTab === 'tasks' && (
              tasks.length === 0
                ? <EmptyState />
                : projectGroups.map(({ project_name, project_slug, items }) => (
                    <ProjectSection
                      key={project_slug}
                      name={project_name}
                      tasks={items}
                      people={peopleBySlug[project_slug] || []}
                      onConfirm={confirmTask}
                      onDismiss={dismissTask}
                      onReassign={reassignTask}
                    />
                  ))
            )}

            {/* ── People tab ───────────────────────────────────────────────── */}
            {activeTab === 'people' && (
              partialMatches.length === 0 && newPeople.length === 0
                ? <EmptyState />
                : <>
                    {partialMatches.length > 0 && (
                      <div style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Possible Matches</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                              Email senders who may be existing people with incomplete records
                            </div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: '#fef3c7', borderRadius: 12, padding: '2px 10px' }}>
                            {partialMatches.length}
                          </span>
                        </div>
                        {partialMatches.map(match => (
                          <PartialMatchCard key={match.person.id} match={match} onUpdate={updatePersonFromEmail} onDismiss={dismissMatch} />
                        ))}
                      </div>
                    )}

                    {newPeople.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>New People</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                              Email senders not yet in your people directory
                            </div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: '#6366f115', borderRadius: 12, padding: '2px 10px' }}>
                            {newPeople.length}
                          </span>
                        </div>
                        {newPeople.map(sender => (
                          <NewPersonCard
                            key={sender.from_email}
                            sender={sender}
                            projects={candidateProjects}
                            onAdd={addNewPerson}
                            onSkip={skipNewPerson}
                          />
                        ))}
                      </div>
                    )}
                  </>
            )}

            {/* ── Emails tab ───────────────────────────────────────────────── */}
            {activeTab === 'emails' && (
              emailSnapshots === null
                ? <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>
                : (() => {
                    const { groups = [], unmatched = [] } = emailSnapshots

                    const q = emailSearch.toLowerCase().trim()
                    const matchesSearch = (e: EmailSnapshot) =>
                      !q ||
                      e.subject?.toLowerCase().includes(q) ||
                      e.from_email?.toLowerCase().includes(q) ||
                      e.from_name?.toLowerCase().includes(q) ||
                      e.body_preview?.toLowerCase().includes(q) ||
                      e.body_full?.toLowerCase().includes(q)

                    const filteredGroups = groups.map(g => ({ ...g, emails: g.emails.filter(matchesSearch) })).filter(g => g.emails.length > 0)
                    const filteredUnmatched = unmatched.filter(matchesSearch)

                    const toggleExpand = (id: string) => setExpandedEmailIds(prev => {
                      const next = new Set(prev)
                      next.has(id) ? next.delete(id) : next.add(id)
                      return next
                    })

                    interface EmailCardProps {
                      email: EmailSnapshot
                      projectId: number | null
                      groupKey: string
                      showCheckbox?: boolean
                      showClient?: boolean
                      onResolve?: ((messageId: string) => void) | null
                    }

                    const EmailCard = ({ email, projectId, groupKey, showCheckbox = false, showClient = false, onResolve = null }: EmailCardProps) => {
                      const expanded = expandedEmailIds.has(email.message_id)
                      const indivKey = `${groupKey}_${email.message_id}`
                      const isAnalyzing = analyzingGroup === indivKey
                      const result = emailAnalysisResult[indivKey]
                      return (
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 0' }}>
                            {showCheckbox && (
                              <input type="checkbox" checked={selectedUnmatchedIds.has(email.message_id)}
                                onChange={() => setSelectedUnmatchedIds(prev => {
                                  const next = new Set(prev)
                                  next.has(email.message_id) ? next.delete(email.message_id) : next.add(email.message_id)
                                  return next
                                })}
                                style={{ marginTop: 3, flexShrink: 0, cursor: 'pointer' }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <button onClick={() => toggleExpand(email.message_id)}
                                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'inherit', flex: 1, minWidth: 0 }}>
                                  <span style={{ marginRight: 4, color: 'var(--text-dim)' }}>{expanded ? '▾' : '▸'}</span>
                                  {email.subject || '(no subject)'}
                                </button>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>
                                {email.from_name && <span style={{ fontWeight: 600 }}>{email.from_name} </span>}
                                <span style={{ fontFamily: 'monospace' }}>&lt;{email.from_email}&gt;</span>
                                {email.received_at && <span> · {new Date(email.received_at).toLocaleDateString()}</span>}
                                {showClient && email.project_name && <span> · <span style={{ color: '#6366f1', fontWeight: 600 }}>{email.project_name}</span></span>}
                              </div>
                              <div style={{ marginBottom: expanded ? 4 : 2 }}><AssessmentBadges email={email} /></div>
                              {!expanded && email.body_preview && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.body_preview}</div>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                              {projectId && (
                                <button onClick={() => analyzeEmailGroup([email.message_id], projectId, indivKey)} disabled={isAnalyzing}
                                  style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: isAnalyzing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                                  {isAnalyzing ? '…' : 'Analyze'}
                                </button>
                              )}
                              {onResolve && (
                                <button onClick={() => onResolve(email.message_id)}
                                  style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: '#16a34a', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                                  ✓ Resolve
                                </button>
                              )}
                              {email.from_email && (
                                <button onClick={() => blockSender(email.from_email, email.block_reason)}
                                  title={`Block ${email.from_email} from future evaluation`}
                                  style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                                  🚫 Block
                                </button>
                              )}
                            </div>
                          </div>
                          {Boolean(email.suggest_block) && (
                            <div style={{ margin: '0 0 8px 16px', padding: '6px 10px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 11, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ flex: 1 }}>
                                <span style={{ fontWeight: 700 }}>🚫 Suggest blocking this sender</span>
                                {email.block_reason && <span> — {email.block_reason}</span>}
                              </span>
                              {email.from_email && (
                                <button onClick={() => blockSender(email.from_email, email.block_reason)}
                                  style={{ fontSize: 11, padding: '2px 9px', borderRadius: 5, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', flexShrink: 0 }}>
                                  Block sender
                                </button>
                              )}
                            </div>
                          )}
                          {email.solution_outline && (
                            <div style={{ margin: '0 0 8px 16px', padding: '6px 10px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text)' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>Possible solution: </span>{email.solution_outline}
                            </div>
                          )}
                          {expanded && (
                            <div style={{ margin: '0 0 10px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 12px', fontSize: 12, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
                              {email.body_full || email.body_preview || '(no body)'}
                            </div>
                          )}
                          {result && (
                            <div style={{ margin: '0 0 8px 16px', padding: '6px 10px', borderRadius: 6, background: result.error ? '#fef2f2' : '#f0fdf4', fontSize: 11 }}>
                              {result.error ? <span style={{ color: '#dc2626' }}>Error: {result.error}</span>
                                : <span style={{ color: '#16a34a' }}>✓ {result.tasks_added} added · {result.tasks_for_review} for review</span>}
                            </div>
                          )}
                        </div>
                      )
                    }

                    // Accordion window. Collapsed → a few rows; clicking the header
                    // (or "show more") expands it fully and collapses any other window.
                    // An active search forces full expansion so matches aren't hidden.
                    const GroupSection = ({ group }: { group: EmailGroup }) => {
                      const groupKey = String(group.project_id)
                      const open = expandedClientKey === groupKey || !!q
                      const groupResult = emailAnalysisResult[groupKey]
                      const isAnalyzingGroup = analyzingGroup === groupKey
                      const sorted = sortEmails(group.emails, emailSort, emailSortDir)
                      const visible = open ? sorted : sorted.slice(0, COLLAPSED_EMAIL_ROWS)
                      const hiddenCount = sorted.length - visible.length
                      const toggle = () => setExpandedClientKey(k => (k === groupKey ? null : groupKey))
                      return (
                        <div style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 14, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                            onClick={toggle}>
                            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{open ? '▾' : '▸'}</span>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{group.project_name}</span>
                              {group.client_domain && <span style={{ fontSize: 11, color: '#6366f1', marginLeft: 8 }}>@{group.client_domain}</span>}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', background: 'var(--surface)', borderRadius: 99, padding: '1px 8px' }}>{group.emails.length}</span>
                            <SortControls sort={emailSort} dir={emailSortDir} onSort={setEmailSort} onDir={setEmailSortDir} />
                            <button onClick={e => { e.stopPropagation(); analyzeEmailGroup(group.emails.map(e => e.message_id), group.project_id, groupKey) }}
                              disabled={isAnalyzingGroup}
                              style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: 'none', background: isAnalyzingGroup ? '#e5e7eb' : '#6366f1', color: isAnalyzingGroup ? '#9ca3af' : '#fff', cursor: isAnalyzingGroup ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'inherit', flexShrink: 0 }}>
                              {isAnalyzingGroup ? 'Analyzing…' : 'Analyze All'}
                            </button>
                          </div>
                          {groupResult && (
                            <div style={{ padding: '6px 14px', background: groupResult.error ? '#fef2f2' : '#f0fdf4', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                              {groupResult.error ? <span style={{ color: '#dc2626' }}>Error: {groupResult.error}</span>
                                : <span style={{ color: '#16a34a' }}>✓ {groupResult.tasks_added} added · {groupResult.tasks_for_review} for review · {groupResult.completions_marked} completions</span>}
                            </div>
                          )}
                          <div style={{ padding: '0 14px' }}>
                            {visible.map(email => <EmailCard key={email.message_id} email={email} projectId={group.project_id} groupKey={groupKey} />)}
                            {!open && hiddenCount > 0 && (
                              <button onClick={toggle}
                                style={{ width: '100%', textAlign: 'left', padding: '8px 0', fontSize: 11, fontWeight: 600, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                + {hiddenCount} more email{hiddenCount !== 1 ? 's' : ''} — show all
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    }

                    const allUnmatchedIds = filteredUnmatched.map(e => e.message_id)
                    const allUnmatchedSelected = allUnmatchedIds.length > 0 && allUnmatchedIds.every(id => selectedUnmatchedIds.has(id))
                    const unmatchedAnalyzeKey = 'unmatched_bulk'
                    const unmatchedResult = emailAnalysisResult[unmatchedAnalyzeKey]
                    const isAnalyzingUnmatched = analyzingGroup === unmatchedAnalyzeKey

                    const isToday = emailDate === localDateStr(new Date())
                    const dayLabel = (() => {
                      const today = localDateStr(new Date())
                      if (emailDate === today) return 'Today'
                      if (emailDate === shiftDateStr(today, -1)) return 'Yesterday'
                      return new Date(`${emailDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                    })()

                    return (
                      <div>
                        {/* Date filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                          <button onClick={() => setEmailDate(d => shiftDateStr(d, -1))}
                            style={{ fontSize: 13, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }} title="Previous day">‹</button>
                          <input type="date" value={emailDate} max={localDateStr(new Date())}
                            onChange={e => e.target.value && setEmailDate(e.target.value)}
                            style={{ fontSize: 13, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit' }} />
                          <button onClick={() => setEmailDate(d => shiftDateStr(d, 1))} disabled={isToday}
                            style={{ fontSize: 13, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: isToday ? 'var(--text-dim)' : 'var(--text)', cursor: isToday ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }} title="Next day">›</button>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{dayLabel}</span>
                          {!isToday && (
                            <button onClick={() => setEmailDate(localDateStr(new Date()))}
                              style={{ fontSize: 12, padding: '5px 10px', borderRadius: 7, border: 'none', background: 'var(--accent-dim)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Today</button>
                          )}
                        </div>

                        {/* Search */}
                        <input
                          value={emailSearch} onChange={e => setEmailSearch(e.target.value)}
                          placeholder="Search by subject, address, or body…"
                          style={{ width: '100%', fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }} />

                        {/* All Clients — Needs Attention (last 3 days, non-task, open) */}
                        {(() => {
                          const list = (attentionEmails || []).filter(e => !resolvedIds.has(e.message_id)).filter(matchesSearch)
                          const open = expandedClientKey === 'attention' || !!q
                          const visible = open ? list : list.slice(0, COLLAPSED_EMAIL_ROWS)
                          const hidden = list.length - visible.length
                          const toggle = () => setExpandedClientKey(k => (k === 'attention' ? null : 'attention'))
                          return (
                            <div style={{ border: '1px solid #6366f150', borderLeft: '4px solid #6366f1', borderRadius: 10, marginBottom: 18, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#6366f114', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={toggle}>
                                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{open ? '▾' : '▸'}</span>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>🔔 Needs Attention — All Clients</span>
                                  <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>last 3 days · open · non-task</span>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', background: 'var(--surface)', borderRadius: 99, padding: '1px 8px' }}>{attentionEmails === null ? '…' : list.length}</span>
                                <SortControls sort={emailSort} dir={emailSortDir} onSort={setEmailSort} onDir={setEmailSortDir} />
                              </div>
                              <div style={{ padding: '0 14px' }}>
                                {attentionEmails === null
                                  ? <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--text-dim)' }}>Loading…</div>
                                  : list.length === 0
                                    ? <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--text-dim)' }}>Nothing open needs attention. 🎉</div>
                                    : <>
                                        {visible.map(email => (
                                          <EmailCard key={email.message_id} email={email} projectId={email.project_id ?? null} groupKey="attention" showClient onResolve={resolveEmail} />
                                        ))}
                                        {!open && hidden > 0 && (
                                          <button onClick={toggle}
                                            style={{ width: '100%', textAlign: 'left', padding: '8px 0', fontSize: 11, fontWeight: 600, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                            + {hidden} more email{hidden !== 1 ? 's' : ''} — show all
                                          </button>
                                        )}
                                      </>}
                              </div>
                            </div>
                          )
                        })()}

                        {filteredGroups.map(group => <GroupSection key={group.project_id} group={group} />)}

                        {/* Unmatched */}
                        {filteredUnmatched.length > 0 && (
                          <div style={{ border: '1px solid #f59e0b50', borderLeft: '4px solid #f59e0b', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ padding: '11px 14px', background: '#fef3c730', borderBottom: '1px solid #f59e0b30' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1 }}>⚠️ Unmatched</span>
                                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{filteredUnmatched.length} email{filteredUnmatched.length !== 1 ? 's' : ''}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: 'var(--text-dim)', flexShrink: 0 }}>
                                  <input type="checkbox" checked={allUnmatchedSelected}
                                    onChange={() => setSelectedUnmatchedIds(allUnmatchedSelected ? new Set() : new Set(allUnmatchedIds))} />
                                  Select all
                                </label>
                                <select value={unmatchedBulkProjectId} onChange={e => setUnmatchedBulkProjectId(e.target.value)}
                                  style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 180px' }}>
                                  <option value="">— assign to client —</option>
                                  {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <button
                                  disabled={selectedUnmatchedIds.size === 0 || !unmatchedBulkProjectId || isAnalyzingUnmatched}
                                  onClick={() => analyzeEmailGroup([...selectedUnmatchedIds], parseInt(unmatchedBulkProjectId, 10), unmatchedAnalyzeKey)}
                                  style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: 'none', fontWeight: 600, fontFamily: 'inherit', cursor: selectedUnmatchedIds.size > 0 && unmatchedBulkProjectId ? 'pointer' : 'not-allowed', background: selectedUnmatchedIds.size > 0 && unmatchedBulkProjectId && !isAnalyzingUnmatched ? '#f59e0b' : '#e5e7eb', color: selectedUnmatchedIds.size > 0 && unmatchedBulkProjectId && !isAnalyzingUnmatched ? '#fff' : '#9ca3af', flexShrink: 0 }}>
                                  {isAnalyzingUnmatched ? 'Analyzing…' : `Analyze Selected (${selectedUnmatchedIds.size})`}
                                </button>
                              </div>
                              {unmatchedResult && (
                                <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: unmatchedResult.error ? '#fef2f2' : '#f0fdf4', fontSize: 11 }}>
                                  {unmatchedResult.error ? <span style={{ color: '#dc2626' }}>Error: {unmatchedResult.error}</span>
                                    : <span style={{ color: '#16a34a' }}>✓ {unmatchedResult.tasks_added} added · {unmatchedResult.tasks_for_review} for review</span>}
                                </div>
                              )}
                            </div>
                            <div style={{ padding: '0 14px', background: 'var(--surface)' }}>
                              {(() => {
                                const open = expandedClientKey === 'unmatched' || !!q
                                const visible = open ? filteredUnmatched : filteredUnmatched.slice(0, COLLAPSED_EMAIL_ROWS)
                                const hidden = filteredUnmatched.length - visible.length
                                return (
                                  <>
                                    {visible.map(email => (
                                      <EmailCard key={email.message_id} email={email} projectId={unmatchedBulkProjectId ? parseInt(unmatchedBulkProjectId, 10) : null} groupKey="unmatched" showCheckbox />
                                    ))}
                                    {!open && hidden > 0 && (
                                      <button onClick={() => setExpandedClientKey('unmatched')}
                                        style={{ width: '100%', textAlign: 'left', padding: '8px 0', fontSize: 11, fontWeight: 600, color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        + {hidden} more email{hidden !== 1 ? 's' : ''} — show all
                                      </button>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        )}

                        {filteredGroups.length === 0 && filteredUnmatched.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: 13 }}>
                            {q ? `No emails match "${emailSearch}"` : `No emails ingested for ${dayLabel.toLowerCase() === 'today' ? 'today' : dayLabel} yet.`}
                          </div>
                        )}
                      </div>
                    )
                  })()
            )}

            {/* ── Manual tab ───────────────────────────────────────────────── */}
            {activeTab === 'manual' && (
              <div>
                {/* Task extraction */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Extract Tasks from Text</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14 }}>Paste any email, message, or notes — Claude will extract all action items.</div>
                  <textarea
                    value={manualTaskText}
                    onChange={e => setManualTaskText(e.target.value)}
                    placeholder="Paste email content or notes here…"
                    rows={8}
                    style={{ width: '100%', fontSize: 12, padding: '10px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={manualTaskProjectId}
                      onChange={e => setManualTaskProjectId(e.target.value)}
                      style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 200px' }}
                    >
                      <option value="">— select client —</option>
                      {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button
                      onClick={submitManualTasks}
                      disabled={!manualTaskText.trim() || !manualTaskProjectId || manualTaskSubmitting}
                      style={{ fontSize: 12, padding: '6px 16px', borderRadius: 6, border: 'none', background: manualTaskText.trim() && manualTaskProjectId ? '#6366f1' : '#e5e7eb', color: manualTaskText.trim() && manualTaskProjectId ? '#fff' : '#9ca3af', cursor: manualTaskText.trim() && manualTaskProjectId ? 'pointer' : 'not-allowed', fontWeight: 600, fontFamily: 'inherit' }}
                    >
                      {manualTaskSubmitting ? 'Analyzing…' : 'Extract Tasks'}
                    </button>
                  </div>
                  {manualTaskResult && (
                    <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 7, background: manualTaskResult.error ? '#fef2f2' : '#f0fdf4', fontSize: 12 }}>
                      {manualTaskResult.error
                        ? <span style={{ color: '#dc2626' }}>Error: {manualTaskResult.error}</span>
                        : <span style={{ color: '#16a34a' }}>✓ {manualTaskResult.tasks_added} task{manualTaskResult.tasks_added !== 1 ? 's' : ''} added to board · {manualTaskResult.tasks_for_review} sent to review queue</span>
                      }
                    </div>
                  )}
                </div>

                {/* Meeting creation */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '4px solid #6366f1', borderRadius: 10, padding: '18px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Create Meeting from Text</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14 }}>Paste a Fathom email, meeting notes, or any meeting summary — Claude will create the meeting record and extract tasks.</div>
                  <textarea
                    value={manualMeetingText}
                    onChange={e => setManualMeetingText(e.target.value)}
                    placeholder="Paste Fathom email or meeting notes here…"
                    rows={10}
                    style={{ width: '100%', fontSize: 12, padding: '10px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={manualMeetingProjectId}
                      onChange={e => setManualMeetingProjectId(e.target.value)}
                      style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 200px' }}
                    >
                      <option value="">— select client —</option>
                      {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button
                      onClick={submitManualMeeting}
                      disabled={!manualMeetingText.trim() || !manualMeetingProjectId || manualMeetingSubmitting}
                      style={{ fontSize: 12, padding: '6px 16px', borderRadius: 6, border: 'none', background: manualMeetingText.trim() && manualMeetingProjectId ? '#6366f1' : '#e5e7eb', color: manualMeetingText.trim() && manualMeetingProjectId ? '#fff' : '#9ca3af', cursor: manualMeetingText.trim() && manualMeetingProjectId ? 'pointer' : 'not-allowed', fontWeight: 600, fontFamily: 'inherit' }}
                    >
                      {manualMeetingSubmitting ? 'Creating Meeting…' : 'Create Meeting'}
                    </button>
                  </div>
                  {manualMeetingResult && (
                    <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 7, background: manualMeetingResult.error ? '#fef2f2' : '#f0fdf4', fontSize: 12 }}>
                      {manualMeetingResult.error
                        ? <span style={{ color: '#dc2626' }}>Error: {manualMeetingResult.error}</span>
                        : <span style={{ color: '#16a34a' }}>✓ Meeting "{manualMeetingResult.meeting_title}" created · {manualMeetingResult.tasks_added} task{manualMeetingResult.tasks_added !== 1 ? 's' : ''} added · {manualMeetingResult.tasks_for_review} for review</span>
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
