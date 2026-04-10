# Environment Variables

The application requires specific environment variables to function correctly in production. Please configure these securely in your production environment or secret manager (e.g., AWS Secrets Manager, GitHub Secrets):

| Variable             | Description                                                   | Example / Recommended Value                 |
| :------------------- | :------------------------------------------------------------ | :------------------------------------------ |
| `PORT`               | The port on which the API server runs.                        | `3000` (typically mapped via reverse proxy) |
| `MONGO_URI`          | Connection string for the production MongoDB instance.        | `mongodb+srv://<user>:<pwd>@cluster...`     |
| `JWT_SECRET`         | A strong, unpredictable secret for signing JSON Web Tokens.   | *Use a 256-bit cryptographically secure key*|
| `JWT_EXPIRES`        | Token expiration duration.                                    | `7d` or `1h` depending on security policies |
| `GEMINI_API_KEY`     | API key for accessing Google's Gemini models for AI features. | `AIzaSy...`                                 |
| `REQUEST_LIMIT`      | Global rate limiting for API requests (requests per window).  | `100` (Recommend adjusting based on usage)  |


