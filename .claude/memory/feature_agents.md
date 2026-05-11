---
name: Feature - Agents and Groups
description: Travel-agent CRUD with right-side drawer for editing; ir-agents
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/Agent_Listing_And_Details.PNG`
**Top-level component:** `src/components/ir-agents/ir-agents.tsx` — tag `ir-agents`
**Host page:** `src/pages/index-agents.html`

### Layout (from screenshot)
- The page is embedded inside the **PMS shell** (`pms-header` family is visible at top — hamburger menu, property switcher dropdown "Les Palmiers Boutique Beach Hot...", Booking#/guest search with Ctrl+K hint, overdue-balance alert).
- **Page body — "Agents and Groups":** instructional text explaining the two ways (manual booking creation vs online bookings with Code/Affiliation). Then a small table: Active checkbox / Agent-Group / Rate restriction (e.g., "Code: MIKI007") / row edit + delete / "+" add button.
- **Right-side drawer — "Edit Agent/Group":** Active toggle; required fields marked with `*` (Agent/Group, Country, Payment method); other fields: Tax number, City, Address, Contact name, Phone (with dial-code), Email, Rate restriction method radio (Code / Affiliation Y/N), Send guest confirmation email checkbox, Notes textarea, Save button.

### Architecture
- Services: `AgentsService` (in `src/services/agents/`), `BookingService`, `PropertyService`, plus `Token`.
- `AgentSetupEntries` type (in `./types.ts`) holds the dropdown lookup data (countries, payment methods, etc.) fetched at init time.
- `selectedAgent: Agent | null`, `isDrawerOpen`, `isDeleteDialogOpen` are the three pieces of UI state that drive the drawer + confirmation dialog.
- Emits `@Event() toast` for user-visible feedback (success/error toasts via `<ir-toast>`).

### Child component map
- `ir-agents-table` — the main grid
- `ir-agent-editor-drawer` — the right-side drawer container
- `ir-agent-editor-form` — the form fields inside the drawer
- `ir-agent-profile` — agent identity sub-section (likely tab)
- `ir-agent-contract` — contract terms sub-section

**How to apply:** When adding a field to the agent form, update `ir-agent-editor-form` and the `Agent` type in `src/services/agents/type.ts`. Make sure `AgentSetupEntries` provides any new lookup data. The drawer pattern (selected entity → drawer state → form → save → refresh table) is reused across agents, housekeeping users, and unassigned-units — model new CRUD pages on it.
