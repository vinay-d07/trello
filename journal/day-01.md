| #   | Hop                                            | file:line | What happens here |
| --- | ---------------------------------------------- | --------- | ----------------- |
| 1   | Status `<Select>` change handler               |     task-panel:52      |    there is a select tag which triggers updatetask(taskid) [exported from api]               |
| 2   | React Query mutation                           |     task-panel:27      |            even though|
| 3   | Browser fetch wrapper                          |     lib/api.ts      |  exports a wrapper where we can pass the URL to promote code reusbility                 |
| 4   | Next.js proxy to the API                       |           |                   |
| 5   | Global Express middleware (list them in order) |           |                   |
| 6   | Rate limiter                                   |     api/middleware/rate-limiter.ts      |       creates a ratelimit instance with a redis-store            |
| 7   | Auth check                                     |           |                   |
| 8   | Router that matches `PATCH …/tasks/:taskId`    |           |                   |
| 9   | Input validation                               |    auth-routes.ts : 22       |           checks the req.body against the schema        |
| 10  | Service: authorisation                         |           |                   |
| 11  | Service: the write and the concurrency check   |           |                   |
| 12  | Realtime publish                               |           |                   |
| 13  | Socket server delivering to the right clients  |           |                   |
| 14  | Client listener that reacts to the event       |           |                   |
| 15  | What actually re-renders Alice's board         |           |                   |


redis adapter is used to propagate events from client A in server1 to client B in server 2