# Authorized transport boundary

Stream Studio backend authenticates the account, owns OAuth secrets and EventSub,
verifies provider signatures and event ownership, reconnects, retries and logs
delivery. It maps an authorized follower event to this visual payload:

```js
{type: 'follow', displayName: 'A viewer', id: 'stable-provider-event-id'}
```

An authorized host bridge must call `StreamAlert.play(payload)` in the correct
Browser Source context. This package supplies no bridge, socket, listener,
EventSub endpoint or account integration. Do not expose arbitrary postMessage
or HTTP ingress without origin, authorization and schema checks. Do not embed
secrets in HTML. Local visual history is bounded and resets on page reload;
backend delivery idempotency must be persistent and independent of it.

Handle accepted / invalid / duplicate / queue-full explicitly. Queue-full may be
retried under backend policy; it does not consume the ID. Avoid tight retry loops.
Replay is a local operator action intentionally bypassing dedupe. Cancel retains
history but clears queued work, so backend policy must not assume visual display
completion from accepted alone. getState is a local snapshot, not a delivery ACK.
