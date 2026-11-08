# Premium store

The store page loads the current Premku product list and stock, creates a QR
payment, checks payment status, submits the product order, and displays returned
accounts in the browser. The Node server proxies all Premku calls so API keys
are not sent to the browser.

## Run locally on Windows

1. Revoke the API key that was previously shared and create a replacement.
2. Install Node.js 18 or newer, or Deno.
3. Double-click `start-store.cmd` and enter both the active **API KEY** and
   **API SECRET** in the hidden prompts. The launcher starts the backend and opens `http://localhost:3000`.
   Do not open `index.html` directly; `file://` pages cannot reach the backend.
   If port 3000 is already in use, close the previous store-server window and
   run the launcher again so the newly entered API key is used.

Keep the `data` directory on persistent storage. This implementation expects a
single Node server process; do not run multiple instances against the same
store without adding a shared database and distributed locking. The server
binds to localhost by default; only expose it behind HTTPS and a private access
control layer. Set `HOST=0.0.0.0` only when your host requires it.

The API calls follow the Premku integration already present in the supplied
WhatsApp bot: `products`, `pay`, `pay_status`, `order`, and `status`. Both the
API key and secret are sent as `api_key` and `api_secret` from the server only.
The web checkout intentionally
does not send a WhatsApp number. If Premku requires
that field, the API will reject the order and the checkout will show an error;
confirm the current API requirements with Premku before accepting live
payments.
