/** Bindings and secrets (wrangler.toml / `wrangler secret put`). Nothing here is ever sent to the app. */
export interface Env {
  /** Anthropic API key — a Worker secret */
  ANTHROPIC_API_KEY?: string;
  /** shared code the app must send for AI requests, so nobody else can spend the credit — a Worker secret */
  ACCESS_CODE?: string;
  /** comma-separated origins allowed to call the API (CORS) */
  ALLOWED_ORIGINS: string;
  /** AI calls allowed per day across all users (cost cap); default 200 */
  DAILY_AI_LIMIT?: string;
  DB: D1Database;
}
