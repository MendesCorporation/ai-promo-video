# Capture and Recording Spec

The capture file is JSON. Paths are relative to the spec. Keep credentials in a gitignored `*.local.json` copy.

```json
{
  "baseUrl": "http://localhost:3000",
  "outputDir": "./captures",
  "viewport": { "width": 1600, "height": 1000 },
  "auth": {
    "path": "/login",
    "fields": [
      { "selector": "input[type=email]", "value": "local@example.test" },
      { "selector": "input[type=password]", "value": "local-only" }
    ],
    "submit": "button[type=submit]",
    "waitForUrl": "http://localhost:3000/"
  },
  "targets": [
    { "id": "dashboard", "path": "/", "waitFor": "main", "delayMs": 1000 }
  ],
  "recordings": [
    {
      "id": "dashboard-to-editor",
      "path": "/scenarios",
      "waitFor": "text=Scenarios",
      "settleMs": 800,
      "preRollMs": 400,
      "postRollMs": 700,
      "pointer": "hidden",
      "actions": [
        { "type": "hover", "selector": "text=Demo QANode", "delayMs": 250 },
        { "type": "click", "selector": "text=Demo QANode", "delayMs": 900 },
        { "type": "wait", "ms": 700 }
      ]
    }
  ]
}
```

A spec may contain screenshots, recordings, or both. Recording actions are `click`, `fill`, `press`, `hover`, `select`, `check`, `scroll`, `mouse`, `goto`, and `wait`.

Prefer stable selectors, deterministic data, fixed viewport, and product states with visible value. Keep the recorded pointer hidden unless the raw pointer is explicitly needed; a separate motion-design cursor is cleaner, controllable, and can respond visually to clicks. Preserve the clean recording as a reusable source clip.
