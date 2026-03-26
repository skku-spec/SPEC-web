# SPEC Log

Activity logging feature. Events (created by admin) → Logs (posted by learners) → Comments + Reactions.

## ROUTES
| Route | Component | Auth |
|-------|-----------|------|
| /spec-log | SpecLogListClient.tsx | Public read |
| /spec-log/[eventId] | EventFeedClient.tsx | Public read, learner+ write |

## DATA MODEL
```
spec_events (admin creates)
  └── spec_logs (learners post, batch-matched)
       ├── spec_log_images (multiple per log)
       ├── spec_log_comments (threaded, parent_id)
       └── spec_log_reactions (emoji toggle, unique per user)
```

## BATCH PERMISSION
Learners/preneurs can only post logs in events matching their batch.
- Learner batch: `members.learner_batch`
- Preneur batch: `members.preneur_batch`
- is_admin: bypasses batch check

## SERVER ACTIONS
All in `lib/actions/spec-log.ts`, `spec-log-comments.ts`, `spec-log-reactions.ts`.
- Events: getEventsByBatch, createEvent, updateEvent, deleteEvent (preneur/admin)
- Logs: getLogsByEvent, createLog, deleteLog (batch-gated)
- Comments: getCommentsByLog, addLogComment, deleteLogComment (SPEC_LOG_ENGAGE_ROLES)
- Reactions: toggleLogReaction, getLogReactions (SPEC_LOG_ENGAGE_ROLES)

## IMAGE UPLOAD
- Bucket: `spec-log-images`
- API: `app/api/upload/spec-log-image/route.ts`
- Client util: `uploadSpecLogImage()` from `lib/storage.ts`
- Max 10 images per log, 10MB each

## UI PATTERNS
- Feed: chronological, date separators, log cards with images/reactions/comments
- Gallery: 1 image=full, 2=2col, 3+=grid with first image larger
- Lightbox: keyboard navigation (Escape, Arrow keys)
- Composer: textarea + image upload, visible only for authorized users
