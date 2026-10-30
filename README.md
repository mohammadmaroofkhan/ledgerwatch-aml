# Ledgerwatch AML

Interactive front-end prototype of the AML transaction monitoring and SMR reporting platform described in `CLAUDE.md`.

- `index.html` is the complete single-file site (open it in a browser).
- `src/` holds the pieces it was assembled from: `p1_head.html` (styles and shell), then `p2_data.js`, `p3_logic.js`, `p4_views.js`, `p5_app.js`.
- Rebuild: `{ cat src/p1_head.html; echo '<script>'; cat src/p2_data.js src/p3_logic.js src/p4_views.js src/p5_app.js; echo '</script>'; } > index.html`

All customers, accounts and transactions are synthetic. Agent steps and SMR narratives are scripted; nothing is sent to a regulator.
