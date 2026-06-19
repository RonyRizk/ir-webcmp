# Building Components in ir-webcmp

Practical guide for creating pages, components, and services in this Stencil.js library. Everything here is derived from real patterns in the codebase — follow these exactly.

---

## Table of Contents

1. [Project Conventions](#project-conventions)
2. [Creating a Page (Root Component)](#creating-a-page-root-component)
3. [Creating Sub-components](#creating-sub-components)
4. [Writing Services](#writing-services)
5. [State Management](#state-management)
6. [Event System](#event-system)
7. [UI Component Reference](#ui-component-reference)
8. [Web Awesome Direct Usage](#web-awesome-direct-usage)
9. [Adding a New Web Awesome Component](#adding-a-new-web-awesome-component)
10. [Generating a Component Scaffold](#generating-a-component-scaffold)
11. [Anti-patterns — What Not To Do](#anti-patterns--what-not-to-do)

---

## Project Conventions

- **Prefixes**: `ir-*` for UI/feature components, `igl-*` for calendar-related, `ac-*` for account/settings.
- **Scoping**: Use `scoped: true` for all feature components. Use `shadow: true` only for pure UI primitives in `src/components/ui/` that need full encapsulation.
- **Strict TS**: `noUnusedLocals` and `noUnusedParameters` are on. Every variable and param must be used.
- **Formatting**: Single quotes, 2-space indent, 180-char print width, trailing commas. Run `npm run build` before committing — CI enforces Prettier.
- **Imports**: Use `@/` for `src/` (e.g., `@/models/Token`). Use `@components/` for `src/components/`.

---

## Creating a Page (Root Component)

A "page" is a root-level component that takes `ticket`, `baseurl`, `propertyid` as props, authenticates on mount, fetches initial data, and renders the full feature.

### File location

```
src/components/ir-my-feature/
  ir-my-feature.tsx
  ir-my-feature.css
```

### Skeleton

```tsx
import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';
import Token from '@/models/Token';
import { PropertyService } from '@/services/property.service';
import calendar_data from '@/stores/calendar-data';

@Component({
  tag: 'ir-my-feature',
  styleUrl: 'ir-my-feature.css',
  scoped: true,
})
export class IrMyFeature {
  @Element() el: HTMLElement;

  // ── Public props — set by the host app ──────────────────────────────────
  @Prop() ticket: string;
  @Prop() baseurl: string;
  @Prop() language: string = 'en';
  @Prop() propertyid: number;

  // ── UI state ────────────────────────────────────────────────────────────
  @State() isLoading: boolean = false;
  @State() data: SomeType[] = [];

  // ── Private services — instantiated as class fields ─────────────────────
  private tokenService = new Token();
  private propertyService = new PropertyService();

  componentWillLoad() {
    if (this.ticket) {
      if (this.baseurl) this.tokenService.setBaseUrl(this.baseurl);
      this.tokenService.setToken(this.ticket);
      this.init();
    }
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue === oldValue) return;
    if (this.baseurl) this.tokenService.setBaseUrl(this.baseurl);
    this.tokenService.setToken(this.ticket);
    this.init();
  }

  private async init() {
    try {
      this.isLoading = true;
      await this.propertyService.getExposedProperty({ id: this.propertyid, language: this.language });
      // fetch your feature data here
    } catch (error) {
      console.error('Failed to initialize ir-my-feature', error);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }

    return (
      <Host>
        <ir-page label="My Feature">{/* content here */}</ir-page>
      </Host>
    );
  }
}
```

### Key rules for root components

- Always guard `componentWillLoad` with `if (this.ticket)` — the prop may arrive late.
- Mirror `ticket` with a `@Watch` that re-runs `init()` when the value changes.
- Wrap all async work in `try/catch/finally` and reset `isLoading` in `finally`.
- Use `<ir-loading-screen>` as the full-page loading state — return it from `render()` before the real content.
- Wrap the entire render output in `<ir-page label="...">` — it adds the page header, `ir-interceptor`, and `ir-toast`.

---

## Creating Sub-components

Sub-components live inside the root component's directory and are responsible for one slice of UI. They receive data as `@Prop()` and communicate upward via `@Event()`.

### File location

```
src/components/ir-my-feature/
  ir-my-feature-filters/
    ir-my-feature-filters.tsx
    ir-my-feature-filters.css
  ir-my-feature-table/
    ir-my-feature-table.tsx
    ir-my-feature-table.css
```

### Skeleton

```tsx
import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'ir-my-feature-filters',
  styleUrl: 'ir-my-feature-filters.css',
  scoped: true,
})
export class IrMyFeatureFilters {
  // ── What the parent passes in ────────────────────────────────────────────
  @Prop() isLoading: boolean = false;

  // ── Local UI state ───────────────────────────────────────────────────────
  @State() searchQuery: string = '';

  // ── What this component emits upward ────────────────────────────────────
  @Event() filtersChange: EventEmitter<MyFilters>;

  private emitFilters() {
    this.filtersChange.emit({ search: this.searchQuery });
  }

  render() {
    return <Host>{/* filters UI */}</Host>;
  }
}
```

### Key rules for sub-components

- Keep `@Prop()` for data flowing **in**, `@Event()` for data flowing **out**. Never mutate props.
- `@Event()` names are **camelCase** (e.g., `filtersChange`). The JSX listener is `on` + PascalCase (e.g., `onFiltersChange`).
- Emit in `componentDidLoad()` if the parent needs initial values on mount.
- For complex data returned from a table or form, define a typed interface in a co-located `types.ts` file in the parent directory (e.g., `ir-my-feature-folio/types.ts`).
- Use `@Method()` for imperative actions the parent needs to trigger (e.g., `refresh()`, `openModal()`). Hold a `ref` to call them: `ref={el => (this.tableRef = el)}`.

### Exposing a method

```tsx
import { Method } from '@stencil/core';

@Method()
async refresh() {
  await this.fetchData();
}
```

Parent calls it:

```tsx
private tableRef: HTMLIrMyFeatureTableElement;

// in render:
<ir-my-feature-table ref={el => (this.tableRef = el)} />

// in a handler:
await this.tableRef?.refresh();
```

---

## Writing Services

Services live in `src/services/`. Each service is a plain class with async methods that call the API via axios.

### File location

For a new feature, create a directory:

```
src/services/my-feature/
  index.ts      ← the service class + re-exports types
  types.ts      ← Zod schemas and inferred TypeScript types
```

### types.ts pattern

Use Zod to define both the schema (for runtime validation) and the TypeScript type (inferred):

```ts
import * as z from 'zod';

export const MyItemSchema = z.object({
  ID: z.number(),
  NAME: z.string(),
  AMOUNT: z.number().nullable().optional(),
});
export type MyItem = z.infer<typeof MyItemSchema>;

export const FetchMyItemsParamsSchema = z.object({
  property_id: z.number(),
  from_date: z.string(),
  to_date: z.string(),
});
export type FetchMyItemsParams = z.infer<typeof FetchMyItemsParamsSchema>;
```

### index.ts (service class) pattern

```ts
import axios from 'axios';
import { FetchMyItemsParamsSchema, type FetchMyItemsParams, type MyItem } from './types';

export * from './types';

export class MyFeatureService {
  public async fetchMyItems(params: FetchMyItemsParams): Promise<MyItem[]> {
    const payload = FetchMyItemsParamsSchema.parse(params); // validates + strips unknown keys
    const { data } = await axios.post('/Fetch_My_Items', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }
}
```

### Rules

- Always call `SomeSchema.parse(params)` before posting — this validates input and strips unknown keys.
- Always check `data.ExceptionMsg !== ''` and throw — this is how backend errors surface.
- Return `data.My_Result` (or a sub-key like `data.My_Result?.My_Rows`).
- Instantiate services as **class fields** on the component, not in lifecycle hooks:
  ```ts
  private myFeatureService = new MyFeatureService();
  ```
- Never use dependency injection — just `new`.

---

## State Management

### Local state (`@State()`)

Use for anything that affects only one component: loading flags, modal visibility, form values, fetched data.

```ts
@State() isLoading: boolean = false;
@State() items: MyItem[] = [];
```

### Global state (`@stencil/store`)

Use for data shared across multiple components. Existing stores in `src/stores/`:

| Store file                 | What it holds                                                          |
| -------------------------- | ---------------------------------------------------------------------- |
| `calendar-data.ts`         | Property config, currency, room types — populated by `PropertyService` |
| `booking_listing.store.ts` | Booking list filters, pagination, selection                            |
| `locales.store.ts`         | i18n strings — all user-facing labels                                  |

Read from a store directly in render:

```ts
import calendar_data from '@/stores/calendar-data';

// in render:
<span>{calendar_data.currency?.symbol}</span>
```

Do not create new stores unless data truly needs to be shared across unrelated components.

---

## Event System

### Child → Parent (up the tree)

```tsx
// child declares
@Event() itemSelected: EventEmitter<MyItem>;

// child fires
this.itemSelected.emit(item);

// parent listens in JSX
<ir-my-feature-table onItemSelected={e => (this.selectedItem = e.detail)} />
```

### Sibling / distant communication

Use a `@Listen()` decorator in a common ancestor, or pass a callback prop down.

### `wa-dropdown` actions

**Always** attach `onwa-select` to the `<wa-dropdown>` parent element. Do not attach `onClick` to individual `<wa-dropdown-item>` elements.

```tsx
<wa-dropdown
  onwa-select={e => {
    const value = e.detail.item.value;
    this.handleAction(value, row);
  }}
>
  <wa-button slot="trigger" appearance="text">
    <wa-icon name="ellipsis-vertical"></wa-icon>
  </wa-button>
  <wa-dropdown-item value="edit">Edit</wa-dropdown-item>
  <wa-dropdown-item value="delete">Delete</wa-dropdown-item>
</wa-dropdown>
```

### Tab switching

Use `wa-tab-group` with `activation="manual"` and `onwa-tab-show`:

```tsx
<wa-tab-group
  activation="manual"
  active={this.currentTab}
  onwa-tab-show={e => {
    this.currentTab = e.detail.name as MyTab;
  }}
>
  <wa-tab panel="tab-a">Tab A</wa-tab>
  <wa-tab panel="tab-b">Tab B</wa-tab>

  <wa-tab-panel name="tab-a">{this.currentTab === 'tab-a' && <ir-tab-a-content />}</wa-tab-panel>
  <wa-tab-panel name="tab-b">{this.currentTab === 'tab-b' && <ir-tab-b-content />}</wa-tab-panel>
</wa-tab-group>
```

The `{this.currentTab === '...'}` guard lazy-mounts panels so they only render when active.

---

## UI Component Reference

These are the `ir-*` components from `src/components/ui/`. Use them instead of bare HTML or Web Awesome directly.

### Layout & Page Shell

| Component                                 | When to use                                                                                                                                                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<ir-page label="..." description="...">` | Wrap every root component's render output. Adds page header, toast, interceptor. Use `slot="page-header"` for controls in the header row, `slot="page-description"` for extra text next to the description. |
| `<ir-loading-screen>`                     | Full-page loading state — return from `render()` when `isLoading` is true.                                                                                                                                  |
| `<ir-empty-state message="...">`          | Empty content area with an icon and message. Use `slot="icon"` to replace the default icon.                                                                                                                 |

### Inputs & Forms

| Component                                        | When to use                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `<ir-input>`                                     | Single-line text input. Prefer over bare `<wa-input>`.                                                                                      |
| `<wa-textarea>`                                  | Multi-line text.                                                                                                                            |
| `<wa-select>`                                    | Dropdown select for form fields.                                                                                                            |
| `<ir-date-range-filter>`                         | Combined from/to date picker with a clear button — used in filter bars. Emits `onDatesChanged` with `{ from, to }` strings in `YYYY-MM-DD`. |
| `<ir-date-picker>`                               | Single date picker.                                                                                                                         |
| `<ir-autocomplete>` + `<ir-autocomplete-option>` | Search-as-you-type selector. Emits `onText-change` (search string) and `onCombobox-change` (selected value).                                |
| `<wa-checkbox>`                                  | Single checkbox.                                                                                                                            |
| `<wa-switch>`                                    | Toggle switch.                                                                                                                              |

### Dialogs & Overlays

| Component                 | When to use                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `<ir-dialog label="...">` | Modal dialog. Call `.openModal()` / `.closeModal()` via `@Method()`. Use `slot="footer"` for action buttons. Wraps `wa-dialog`. |
| `<ir-sidebar>`            | Side drawer/panel. Use for detail views or forms that slide in.                                                                 |

### Data Display

| Component                                                    | When to use                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `<ir-stats-card cardTitle="..." value="..." subtitle="...">` | Metric card in a stats bar (e.g., Balance, Charges). Use `icon` prop for the icon. |
| `<ir-pagination>`                                            | Pagination controls. Emits `onPaginationChange` with `{ pageIndex, pageSize }`.    |
| `<ir-booking-status-tag>`                                    | Status badge styled for booking states.                                            |
| `<ir-cl-status-tag>`                                         | Status badge for city ledger transaction states.                                   |
| `<ir-empty-state>`                                           | See above.                                                                         |

### Feedback & Navigation

| Component          | When to use                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `<ir-button>`      | Primary action button. Use `<wa-button>` only for appearance variants not covered.                           |
| `<ir-spinner>`     | Inline loading spinner.                                                                                      |
| `<ir-tooltip>`     | Hover tooltip. Wraps `wa-tooltip`.                                                                           |
| `<ir-toast>`       | Toast notification (already included via `ir-page`). Trigger by calling `toast.fire()` from the toast store. |
| `<ir-interceptor>` | Global axios error interceptor (already included via `ir-page`). Do not add manually.                        |

### Icons

Use `<ir-icons name="...">` for the custom icon set, or `<wa-icon name="...">` for Web Awesome icons directly.

```tsx
// Custom icon set
<ir-icons name="pencil" />

// Web Awesome icon (for icons not in the custom set)
<wa-icon name="building"></wa-icon>
```

---

## Web Awesome Direct Usage

Use a `wa-*` element directly when:

1. No `ir-*` wrapper exists for it (e.g., `wa-tab-group`, `wa-dropdown`, `wa-badge`, `wa-callout`, `wa-tag`).
2. You need a prop or variant that the `ir-*` wrapper doesn't expose.
3. You are building a new `ir-*` wrapper component — then you use `wa-*` inside that wrapper.

### Common direct usages and their event names

| Component        | Event to listen to                                             |
| ---------------- | -------------------------------------------------------------- |
| `<wa-tab-group>` | `onwa-tab-show`                                                |
| `<wa-dropdown>`  | `onwa-select` (on the parent element, not items)               |
| `<wa-select>`    | `onchange` — cast `e.target` to `WaSelect` for `.value`        |
| `<wa-input>`     | `oninput` or `onchange`                                        |
| `<wa-dialog>`    | `onwa-hide`, `onwa-show`, `onwa-after-hide`, `onwa-after-show` |
| `<wa-drawer>`    | `onwa-hide`, `onwa-show`                                       |
| `<wa-switch>`    | `onchange`                                                     |
| `<wa-checkbox>`  | `onchange`                                                     |

### Typing `wa-*` events

Import the element class when you need to access typed properties:

```ts
import WaSelect from '@awesome.me/webawesome/dist/components/select/select';

// in handler:
onchange={e => {
  this.myValue = (e.target as WaSelect).value?.toString();
}}
```

---

## Adding a New Web Awesome Component

If you use a `wa-*` component that is not yet registered, you **must** add it to `src/global/app.ts`.

Open `src/global/app.ts` and add the import:

```ts
import '@awesome.me/webawesome/dist/components/progress-ring/progress-ring.js';
```

Do not import the full bundle. Only import components you actually use.

---

## Generating a Component Scaffold

```bash
npm run generate
```

This creates the `.tsx`, `.css`, and spec files for a new component. After generating, move the directory into the right parent folder if it's a sub-component.

---

## Putting It All Together — Checklist for a New Feature

1. **Generate** the root component with `npm run generate`.
2. **Create sub-component directories** inside the root component's folder.
3. **Write types** in co-located `types.ts` files for shared interfaces.
4. **Create the service** in `src/services/my-feature/` with `types.ts` (Zod) and `index.ts` (class).
5. **Root component**: add `ticket`/`baseurl`/`propertyid` props, `componentWillLoad` + `@Watch('ticket')`, async `init()`, and return `<ir-loading-screen>` while loading.
6. **Wrap render in `<ir-page>`**.
7. **Wire events**: sub-components emit with camelCase `@Event()` names; parent listens with `on` + PascalCase in JSX.
8. **Register any new `wa-*` components** in `src/global/app.ts`.
9. **Run `npm start`** and test in `http://localhost:7594` before marking done.

---

## Anti-patterns — What Not To Do

Each item below has been observed in real features in this codebase and breaks the patterns above. Treat them as hard rules, not suggestions.

---

### Root Components

**Do not skip `baseurl` or `propertyid` props.**
Every root component must declare all three standard props: `ticket`, `baseurl`, and `propertyid`. Omitting `baseurl` means the component cannot be pointed at a non-default gateway; omitting `propertyid` means services cannot scope requests to the correct property.

```tsx
// Wrong — missing baseurl and propertyid
@Prop() ticket: string;

// Correct
@Prop() ticket: string;
@Prop() baseurl: string;
@Prop() propertyid: number;
```

---

**Do not call `init()` outside the `if (this.ticket)` guard.**
`init()` must only run when there is a valid token. Calling it unconditionally causes unauthenticated API requests on mount.

```tsx
// Wrong — init() fires even when ticket is absent
async componentWillLoad() {
  if (this.ticket) {
    this.tokenService.setToken(this.ticket);
  }
  await this.init(); // ← always runs
}

// Correct
componentWillLoad() {
  if (this.ticket) {
    if (this.baseurl) this.tokenService.setBaseUrl(this.baseurl);
    this.tokenService.setToken(this.ticket);
    this.init();
  }
}
```

---

**Do not forget `@Watch('ticket')`.**
In production the `ticket` prop often arrives after `componentWillLoad`. Without a `@Watch`, the component never initialises for late-arriving tokens.

```tsx
@Watch('ticket')
handleTicketChange(newValue: string, oldValue: string) {
  if (newValue === oldValue) return;
  if (this.baseurl) this.tokenService.setBaseUrl(this.baseurl);
  this.tokenService.setToken(this.ticket);
  this.init();
}
```

---

**Do not skip `<ir-page>` or add `<ir-toast>` / `<ir-interceptor>` manually.**
`<ir-page>` includes both. Adding them manually is redundant, and omitting `<ir-page>` means the page has no header, no toast system, and no global error interceptor.

```tsx
// Wrong
render() {
  return (
    <Host>
      <ir-toast></ir-toast>
      <ir-interceptor></ir-interceptor>
      <section>...</section>
    </Host>
  );
}

// Correct
render() {
  return (
    <Host>
      <ir-page label="My Feature">...</ir-page>
    </Host>
  );
}
```

---

**Do not use `alert()` for errors or confirmations.**
Use the toast system (`toast.fire(...)` from the toast store) or an `<ir-dialog>` for confirmations. Native `alert()` blocks the thread and cannot be styled.

---

**Do not build a monolithic root component.**
If the render method has three or more visually distinct regions (e.g., filter sidebar, data table, selection panel), each region must be a dedicated sub-component. A single 400-line component is a maintenance liability and cannot be independently tested.

---

### Sub-components

**Do not read from a global store inside a sub-component.**
Sub-components must be pure: they receive data through `@Prop()` and communicate upward through `@Event()`. Direct store access in a sub-component creates hidden coupling, prevents reuse, and makes the data flow invisible in JSX.

```tsx
// Wrong — sub-component reaches into global store
render() {
  const list = mealReportStore.guestList; // hidden dependency
  ...
}

// Correct — parent passes data down
@Prop() guestList: MealGuestEntry[];
```

---

**Do not declare `@Prop()` fields that are never read.**
Stencil's `noUnusedLocals` does not catch unused props, but dead props mislead readers and inflate the component's public API. Only declare props that the component actually uses.

---

### Services

**Do not hardcode an absolute base URL in a service.**
The `Token` model configures axios's base URL globally. A service that sets its own URL bypasses that and breaks environment switching.

```ts
// Wrong
private baseUrl = 'https://gateway.igloorooms.com/IR';
const response = await axios.post(`${this.baseUrl}/Get_Foo`, ...);

// Correct
const { data } = await axios.post('/Get_Foo', payload);
```

---

**Do not manually attach auth headers inside a service.**
The Token model installs an axios interceptor that adds `Authorization` headers automatically. Constructing them by hand in each method duplicates the header and bypasses future interceptor changes.

```ts
// Wrong
headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

// Correct — no headers needed; the interceptor handles it
const { data } = await axios.post('/Get_Foo', payload);
```

---

**Do not instantiate `Token` inside a service.**
Services rely on the globally configured axios instance. Only the root component should call `tokenService.setToken()` and `tokenService.setBaseUrl()`.

---

**Do not skip the `ExceptionMsg` check.**
The backend signals errors through `data.ExceptionMsg`. Without this check, API errors silently return as successful responses.

```ts
// Wrong — error goes undetected
return response.data.My_Result || [];

// Correct
if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
return data.My_Result;
```

---

**Do not skip Zod schema validation on request params.**
Call `SomeSchema.parse(params)` before every POST. It validates inputs at runtime and strips unknown keys that could cause server errors.

---

**Do not put types in the service file.**
Types and Zod schemas belong in a co-located `types.ts`. The service file imports them. This is what allows `export * from './types'` to work on the service barrel.

---

**Do not put data-transformation utilities in a service class.**
A service class is for API calls only. Pure transformation helpers (grouping, sorting, mapping) belong in a `utils.ts` or inline in the component.

---

**Do not use `try/catch` inside service methods.**
Let errors propagate. The calling component's `try/catch/finally` is the right place to handle errors and reset loading state.

---

### State Management

**Do not create a global store for data used by only one feature.**
`@stencil/store` is for state shared across unrelated components. If a root component and its direct children are the only consumers, use `@State()` on the root and pass data down as props.

---

**Do not use `Object.assign` to update a Stencil store.**
Stencil's store uses a proxy to detect changes. `Object.assign` writes multiple keys in one call and may not trigger re-renders on each field. Always assign fields individually.

```ts
// Wrong
Object.assign(myStore, { from: '2026-01-01', to: '2026-01-31' });

// Correct
myStore.from = '2026-01-01';
myStore.to = '2026-01-31';
```

---

**Do not duplicate filter state between the component and the store.**
Pick one source of truth. Either store filters in `@State()` on the component (and pass them to the service on fetch), or store them in the global store — never both.

---

### General

**Do not leave `console.log` in component or service code.**
Debug logs left in `init()`, event handlers, or render methods become permanent noise in production. Remove them before committing.

---

**Do not use defensive runtime key-lookup to paper over unknown API shapes.**
Code like `obj.Key || obj.key || obj.KEY` at runtime signals that the TypeScript types are wrong. Fix the type definitions to match the actual API response instead.

---

**Do not return `Promise<any>` from a service method.**
Every service method must have a concrete return type. Use the types defined in the co-located `types.ts`.

```ts
// Wrong
public async getMealReport(props: ParamsGetMealReport): Promise<any>

// Correct
public async getMealReport(props: ParamsGetMealReport): Promise<GetMealReportResult>
```
