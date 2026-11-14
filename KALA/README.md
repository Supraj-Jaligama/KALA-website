# KALA

An editorial-style Indian art discovery storefront built with plain HTML, CSS and JavaScript.

## Run locally

Open a terminal in this folder and run `node server.js`, then open `http://127.0.0.1:3000`. Node.js 20 or newer is required; there are no third-party packages to install. The browser API does not work from a `file://` tab or Python's static server.

## Show KALA on another device on the same Wi-Fi

Stop the local server with Ctrl+C. In PowerShell, run `$env:HOST='0.0.0.0'; node server.js`. Find this computer's Wi-Fi IPv4 address with `ipconfig`, then have the other device open `http://<that-ip>:3000` while connected to the same Wi-Fi. If Windows Firewall asks, allow Node.js on Private networks. Stop the server with Ctrl+C when finished. The default remains bound to `127.0.0.1` for local-only use.

## Source code

The live page uses `index.html` for markup, `styles.css` for styling, and `app.js` for interactions. `server.js` provides the local REST API. `KALA-source-code.html` is a single-file front-end copy with the CSS and JavaScript embedded; API-backed actions require the server.

## What works in this version

- Responsive home page, artist highlights and art-form navigation
- Indian art collection with documented paintings, sculptures, and handicrafts; the Rooted in Place tradition links filter to each category
- Subtle repeating symmetrical Indian-inspired motif across the page
- KALA hero featuring the supplied Raja Ravi Varma painting
- Historic and contemporary Indian-art showpieces with image credits and source records
- Local copies of the openly reusable examples from the supplied visual guide
- Indian museum collection sculptures, including Chola Nataraja and Pala/Ikshvaku Buddhas
- Indicative sample reference prices on every documented collection painting and sculpture; historic works are clearly marked not for sale
- Artwork search, art-form filtering, sorting and progressive loading
- Artwork quick view with medium, date, image credit and source record
- Account sign-in and registration for art lovers and artists, with a clear message when the selected account type does not match the email
- Server-backed cart and liked-art collections, with guest browser storage
- Artist contact messages, artist inbox and replies
- Two-way message threads: art lovers see artist replies and can respond; artists see the full conversation in their inbox
- Artist Studio for saving store details, previewing and uploading up to six JPEG/PNG/WebP photos per artwork (up to 4 MB each), and publishing/removing listings
- Multi-angle artwork galleries in listing details, with thumbnails and previous/next controls
- Sample Indian artist profiles and clearly labeled painting, sculpture, and handmade craft listings to try cart and messaging flows
- Handicraft listings for Jaipur blue pottery, Channapatna toys, Bidriware, Kutch embroidery, Dhokra, Kashmiri woodcarving, and Assam bamboo craft, with category filters and image attribution links
- Newsletter sign-up demo interaction

Accounts, carts, liked works and messages are stored in the local `data/store.json` file created at first run. Passwords are hashed, and the server binds only to `127.0.0.1` for local development. Artist messages appear in the recipient's KALA inbox when an artist account has the matching name; otherwise they remain pending until the artist registers. This local prototype does not send email, process payments, or provide a production deployment, database service, password reset, or public internet hosting.

## API routes

- `POST /api/auth/register` and `POST /api/auth/login` accept `{ "name", "email", "password", "role" }` for registration (omit `name` for login; `role` is `user` or `artist`). Login explains when the email exists under the other account type. `POST /api/auth/logout` clears the session; `GET /api/me` returns the signed-in account.
- `GET /api/cart`, `POST /api/cart` with `{ "artworkId": 1 }`, and `DELETE /api/cart/:artworkId` manage the account cart.
- `GET /api/favorites`, `PUT /api/favorites/:artworkId`, and `DELETE /api/favorites/:artworkId` manage liked works.
- `GET /api/artists` and `GET /api/artworks` return public artist stores and listings, including labeled demo samples.
- Artists use `GET`/`PUT /api/artist/profile` to read or save store name, city, art forms, and bio. `GET`/`POST /api/artist/listings` manage their own listings (category: `Painting`, `Sculpture`, or `Handicraft`); `DELETE /api/artist/listings/:id` removes a listing. Listing image paths must point inside `assets/`.
- Artists can upload each image with `POST /api/artist/images` using `{ "dataUrl": "data:image/jpeg;base64,..." }`, then publish a listing with an `images` array of 1–6 returned asset paths. Uploads require an artist account and are limited to JPEG, PNG, or WebP files up to 4 MB each; images are stored in `assets/uploads/`.
- Art lovers use `POST /api/messages` with `{ "artistName", "artworkId", "artworkTitle", "message" }` to contact an artist, `GET /api/messages` to see conversations, and `POST /api/messages/:messageId/reply` with `{ "reply" }` to respond. Artists use `GET /api/artist/messages` and `POST /api/artist/messages/:messageId/reply` with `{ "reply" }`.

The eleven starter stores use fictional demo artist names and Indian-art or handicraft reference photos; each sample card states that the photo is not the sample item being offered. The craft examples include Jaipur blue pottery, Channapatna toys, Bidriware, Kutch embroidery, Dhokra, Kashmiri woodcarving, and Assam bamboo craft. Artists can create their own account, fill in store details, publish paintings, sculptures, and handicrafts, and receive messages from interested users. No payment is taken.

The hero and collection include the full painting supplied by the site owner. All images are served from local files; sources and reuse status are listed in [`assets/ART-CREDITS.md`](assets/ART-CREDITS.md).
