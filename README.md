# Usage API Platform

A small full-stack platform that simulates a usage-based API service.

Users can:

- Create model deployments
- Watch deployments move from provisioning to ready
- Send mocked completion requests using an API key
- Track token usage and estimated cost
- Terminate deployments

---

## 1. Setup & Run Instructions

### Prerequisites

- Node.js 20+
- npm
- MongoDB Atlas or another MongoDB instance

### Environment Variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
```

### Install Dependencies

```bash
npm install
```

### Run the Application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend and backend both run from the same Next.js application.

### Run Tests

```bash
npm test
```

---

## 2. Data Model

The application uses MongoDB with Mongoose.

### Deployment

The deployment model contains:

```text
model
status
apiKey
endpointUrl
createdAt
updatedAt
terminatedAt
```

`status` can be:

```text
provisioning
ready
terminated
```

A deployment starts in the `provisioning` state. Once approximately 10 seconds have passed, it transitions to `ready`.

The API key is generated when the deployment is created, but it is only exposed to the client once the deployment becomes ready.

### UsageEvent

The usage event model contains:

```text
apiKey
deploymentId
model
inputTokens
outputTokens
timestamp
```

Each successful completion request creates one usage event.

The usage collection is intentionally append-only because usage records represent historical metering data and should not normally be modified.

Indexes are used on fields such as `apiKey`, `deploymentId`, and `timestamp` to support usage queries efficiently.

---

## 3. How the Frontend Gets Status Updates

The frontend polls the deployments API every 2 seconds.

I chose polling because the provisioning period is short and the application is intentionally small.

For this use case, polling is simpler to implement and operate than WebSockets or Server-Sent Events while still providing the required automatic `provisioning -> ready` transition in the UI.

In a larger system with many long-running deployments, I would consider Server-Sent Events or WebSockets to reduce repeated requests.

The backend does not rely on an in-memory timer to make a deployment ready.

Instead, readiness is derived from the deployment's `createdAt` timestamp. When a deployment is fetched, the server checks whether at least 10 seconds have elapsed and transitions it to `ready` when appropriate.

This avoids losing provisioning timers if the server restarts.

---

## 4. Loading, Error, and Empty States

The frontend handles loading, error, and empty states explicitly.

### Loading

Buttons display states such as:

```text
Creating...
Sending...
Loading...
```

and are disabled while requests are in progress.

### Errors

API errors are caught and rendered as readable messages instead of raw stack traces.

The completion API handles:

- `401` - Invalid API key
- `403` - API key does not belong to the deployment
- `409` - Deployment is not ready or has been terminated
- `429` - Rate limit exceeded

### Empty States

The UI displays appropriate messages when:

- No deployments exist
- No ready deployments are available
- No usage exists for the selected date range

---

## 5. How I Would Scale the Metering Pipeline to 10,000 Requests/Second

The current implementation writes usage events directly to MongoDB during the request path.

This is simple and appropriate for the scope of this screener, but I would not use synchronous database writes in the request path at 10,000 requests per second.

At higher scale, I would separate completion serving from metering.

The request flow could look like:

```text
Client
  |
  v
API Gateway / Load Balancer
  |
  v
Completion Service
  |
  v
Publish Usage Event
  |
  v
Message Queue / Event Stream
  |
  v
Metering Consumers
  |
  v
Usage Storage
```

Possible technologies for the event pipeline include Kafka, AWS Kinesis, Google Pub/Sub, or another managed message queue.

The completion service would publish a lightweight usage event and return the API response without waiting for the final billing aggregation.

Multiple metering consumers could process usage events in parallel.

At this scale, I would also:

- Partition events by API key or tenant
- Batch database writes
- Assign unique event IDs and make consumers idempotent to avoid double counting
- Store raw usage events separately from aggregated usage
- Generate hourly and daily rollups for billing queries
- Use Redis or another shared store for distributed rate limiting
- Monitor queue lag, throughput, and failed metering events
- Use dead-letter queues for events that cannot be processed successfully

For high-volume usage queries, pre-aggregated billing records would be more efficient than repeatedly scanning raw usage events.

---

## 6. What I Would Do Differently With More Time

With more time, I would:

- Add stronger request validation using a library such as Zod
- Add integration tests for the API routes
- Add dedicated tests for the `401`, `403`, `409`, and `429` cases
- Move rate limiting from application memory to Redis
- Add pagination for large deployment lists
- Improve accessibility and UI polish
- Mask API keys by default with explicit reveal/copy controls
- Introduce structured application logging
- Add additional service layers as the application grows
- Add Docker support for easier local setup

---

## 7. Trade-offs I Made and Why

### Polling Instead of WebSockets

The frontend polls every 2 seconds for deployment status updates.

Polling was chosen because provisioning only takes approximately 10 seconds and the application is intentionally small. WebSockets or Server-Sent Events would add unnecessary complexity for this use case.

### In-Memory Rate Limiting

The current rate limiter stores request counts in application memory.

This keeps the implementation small and easy to understand, but it would not work correctly across multiple application instances because each instance would maintain independent counters.

For a production distributed system, I would use Redis or another shared datastore.

### Lazy Provisioning Transition

The system does not run an in-memory timer or background job exactly 10 seconds after deployment creation.

Instead, deployment readiness is evaluated when deployments are requested.

This avoids requiring background-job infrastructure and does not lose timers when the application restarts. The trade-off is that a deployment technically changes to `ready` when it is next read after the provisioning period has elapsed.

### MongoDB

MongoDB was chosen because it provides a simple data model for deployments and append-only usage events. Its aggregation pipeline also works well for grouping usage by day or model.

### Single Next.js Application

The frontend and backend are kept in the same Next.js repository.

This makes setup fast and keeps the project easy to evaluate while still maintaining separation between UI components, API routes, database models, and shared business logic.

---

## 8. AI Assistance

I used AI assistance during development for:

- UI to style sections
- Discussing implementation approaches
- Reviewing architecture and trade-offs
- Suggesting test cases
- Reviewing README wording

I reviewed and understood the code included in the submission and can explain the implementation and design decisions.
