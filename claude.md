# CLAUDE.md

## Purpose

This repository contains a game built with **Angular** and **HTML Canvas**.

The game displays a **planet** that the player can interact with. The player can:

- see a planet rendered on a canvas
- rotate the planet
- zoom in and zoom out
- select a country / frontier region on the planet
- travel to another planet

This file tells Claude how to work in this codebase: what matters, how to structure changes, what to avoid, and what good implementation looks like.

---

## Product vision

Build a clean, responsive planetary interaction game with these core behaviors:

1. A planet is rendered in a canvas-based scene.
2. The planet contains visible country/frontier regions.
3. The player can rotate the planet smoothly.
4. The player can zoom in and out.
5. The player can click/tap a visible country to select it.
6. The player can travel from the current planet to another planet.

The overall feel should be readable, smooth, and easy to expand.

---

## Technical constraints

- Use **Angular** as the application framework.
- Use **TypeScript**.
- Use **HTML Canvas 2D** as the rendering layer unless explicitly told otherwise.
- Prefer Angular-native architecture and browser APIs.
- Keep dependencies light.

Do **not** introduce these without explicit approval:

- Phaser
- Three.js
- Babylon.js
- PixiJS
- full game engines
- large state libraries unless clearly justified

WebGL is not the default path for this project.

---

## Core gameplay entities

### Planet
A planet is the main object shown to the player.

Typical properties:

```ts
interface Planet {
  id: string;
  name: string;
  radius: number;
  rotationX: number;
  rotationY: number;
  zoom: number;
  countries: Country[];
  connections: string[];
  theme?: PlanetTheme;
}
```

### Country
A country is a selectable region on the planet surface.

Typical properties:

```ts
interface Country {
  id: string;
  name: string;
  polygons: GeoPolygon[];
  style?: CountryStyle;
  metadata?: Record<string, unknown>;
}
```

### Geometry
Use geographic-style coordinates for source data.

```ts
interface GeoPoint {
  lat: number;
  lon: number;
}

interface GeoPolygon {
  points: GeoPoint[];
}
```

Keep raw geometry separate from rendering state.

---

## Player interactions

### Rotation
The player must be able to rotate the planet.

Required behavior:

- mouse drag rotates the planet
- touch drag rotates the planet
- movement is smooth
- horizontal rotation is required
- optional vertical tilt is acceptable if controlled and useful

### Zoom
The player must be able to zoom in and zoom out.

Required behavior:

- mouse wheel zoom
- touch pinch zoom when supported
- min/max zoom limits
- smooth scaling behavior
- selection remains accurate while zoomed

### Country selection
The player must be able to select a visible country.

Required behavior:

- only visible/front-facing regions should be interactable
- selected country should be visually distinct
- hit detection should be reliable
- selection state should be stored in game state, not inferred from drawing alone

### Travel
The player must be able to move to another planet.

Required behavior:

- another planet can be selected from UI or navigation state
- a transition occurs from current planet to destination planet
- state updates are intentional and predictable
- selected country is reset or migrated in a clearly defined way

---

## Architecture rules

Keep the code split into clear layers.

### 1. Domain layer
Contains plain models and game concepts.

Examples:

- `Planet`
- `Country`
- `GeoPoint`
- `TravelRoute`

This layer should stay framework-light.

### 2. State layer
Stores current app/game state.

Examples:

- current planet
- selected country
- zoom level
- rotation angles
- hover state
- travel target

Use Angular services, signals, or RxJS depending on local project style. Prefer the simplest consistent approach.

### 3. Rendering layer
Responsible only for drawing.

Examples:

- planet renderer
- country renderer
- shading/highlight renderer
- projection helpers

The renderer should consume state and data, not own business rules.

### 4. Input layer
Responsible for converting pointer/touch input into actions.

Examples:

- drag to rotate
- wheel to zoom
- click/tap to select

Do not scatter input behavior across unrelated components.

### 5. UI layer
Responsible for Angular templates and controls.

Examples:

- selected country panel
- current planet label
- travel menu
- zoom buttons

Keep Angular templates focused on UI, not canvas math.

---

## Recommended project structure

```text
src/
  app/
    core/
      models/
      services/
      utils/
    features/
      game/
        components/
        canvas/
        state/
        data/
        input/
        render/
    shared/
```

Suggested file responsibilities:

- `canvas/` -> canvas host component and lifecycle hooks
- `render/` -> draw logic and projection helpers
- `input/` -> drag, zoom, pointer mapping, hit testing
- `state/` -> selected planet/country/zoom/rotation state
- `data/` -> planet definitions and country boundary data

---

## Rendering guidance

### General rules
- Use `requestAnimationFrame` for animation.
- Minimize work done per frame.
- Avoid expensive allocations in the render loop.
- Cache derived geometry when possible.
- Re-render based on state changes or animation needs.
- Keep rendering code independent from Angular change detection as much as possible.

### Angular rules for rendering
- Prefer `ChangeDetectionStrategy.OnPush` for relevant components.
- Avoid binding rapidly changing frame data into templates.
- Run high-frequency rendering work outside Angular when useful.

### Planet rendering approach
Default to a pragmatic pseudo-3D globe rendered in 2D canvas.

Good baseline approach:

- render a circular globe
- apply simple lighting/shading
- project country polygons from lat/lon to globe coordinates
- draw only visible/front-side regions
- support rotation by changing longitude/rotation offsets

Do not overcomplicate the first implementation.

### Country borders
Country/frontier rendering must be readable.

Requirements:

- border lines remain visible at normal zoom
- hover state is subtle but visible
- selected state is obvious
- colors/styles should be easy to theme later

### Hit detection
Preferred order of solutions:

1. geometry-based hit testing against projected visible polygons
2. offscreen picking canvas with stable region IDs

Choose the simplest reliable implementation for the current architecture.

---

## Input guidance

### Mouse
- drag -> rotate
- wheel -> zoom
- click -> select country

### Touch
- single-finger drag -> rotate
- pinch -> zoom
- tap -> select country

### Input quality bar
- controls should feel responsive
- no sudden jumps on first drag frame
- zoom should be clamped safely
- coordinate conversion must respect canvas scale and device pixel ratio

---

## Travel system guidance

Travel is a gameplay action, not just a visual switch.

At minimum:

- the player chooses a destination planet
- the game updates current planet state
- the renderer redraws the new planet
- relevant UI updates

Optional but desirable later:

- transition animation
- travel restrictions
- route map
- travel cost/time

Use Angular routing only if it genuinely improves state organization. Do not force route changes for every internal game interaction.

---

## Performance expectations

Optimize for smooth interaction on modern desktop browsers first.

Important rules:

- avoid repeated projection recalculation when nothing changed
- cache transformed data when practical
- debounce resize handling
- keep pointer math lightweight
- avoid unnecessary array/object creation inside animation loops

When performance and code simplicity conflict, choose the simplest approach first unless the performance issue is measurable and user-visible.

---

## Editing rules for Claude

When making changes in this repository:

- make incremental, working changes
- preserve existing architecture when possible
- improve architecture only when there is a clear payoff
- keep changes local and understandable
- do not rewrite unrelated files
- do not rename large areas of the project without strong reason
- avoid introducing speculative abstractions

If a feature touches multiple layers:

1. update the domain model if needed
2. update state handling
3. update rendering
4. update input handling
5. update UI affordances

Do not patch only the visible symptom if the state model is wrong.

---

## Coding standards

### TypeScript
- prefer strong typing
- prefer small focused functions
- avoid giant classes/components
- avoid `any` unless unavoidable
- move math-heavy helpers into dedicated utility files

### Angular
- prefer standalone components if the codebase already uses them
- keep components thin
- place game logic in services/helpers rather than templates
- keep template expressions simple

### Canvas code
- separate scene math from draw commands
- keep world-to-screen transforms explicit
- avoid magic numbers; name constants
- comment only where the intent is not obvious

---

## Good implementation order

When building from scratch or extending major features, use this order:

1. create or stabilize the game state model
2. create the canvas host component
3. implement the render loop
4. render the base planet
5. add rotation controls
6. add zoom controls
7. render countries/frontiers
8. implement country selection
9. add planet-to-planet travel
10. polish transitions and UI feedback

This order matters because accurate selection depends on stable rendering and coordinate systems.

---

## Definition of done for major features

### Planet rendering is done when
- a planet is visible
- it scales correctly with canvas size
- it can be redrawn predictably

### Rotation is done when
- drag updates planet orientation smoothly
- rotation state persists correctly
- rendering reflects the new orientation without visual glitches

### Zoom is done when
- wheel/pinch changes scale smoothly
- zoom is clamped
- zoom does not break selection or rendering

### Country selection is done when
- clicking/tapping a visible country selects it
- selected state is stored centrally
- selected country gets clear visual feedback

### Travel is done when
- the user can choose another planet
- current planet state changes correctly
- the next planet is rendered and interactive

---

## Things Claude should avoid

- Do not replace Angular.
- Do not migrate rendering to WebGL unless explicitly requested.
- Do not add heavy graphics/game libraries by default.
- Do not make selection depend on HTML overlays placed over the canvas.
- Do not tightly couple rendering logic to Angular templates.
- Do not spread pointer handling across many components.
- Do not mix planet data storage with frame-by-frame renderer internals.

---

## Preferred style of solutions

When there are multiple valid approaches, prefer the one that is:

- simple
- maintainable
- easy to debug
- compatible with Angular + Canvas
- sufficient for smooth gameplay

Start with a minimal reliable implementation, then polish.

---

## Future extensions to keep possible

Design the code so these can be added later without a rewrite:

- multiple solar systems
- more planets
- procedural planet generation
- richer country metadata
- diplomacy/ownership systems
- fog of war
- travel routes and costs
- save/load system
- improved shading or visual effects

---

## What Claude should pay attention to during reviews

When reviewing or editing code in this repo, check especially for:

- broken coordinate transforms
- inaccurate hit detection
- input jitter on drag/zoom
- state stored in the wrong layer
- render loop doing too much work
- Angular change detection being triggered too often
- hidden coupling between selection, rendering, and travel

---

## Default implementation mindset

Favor a clean playable result over an overengineered one.

The first version should be:

- interactive
- understandable
- stable
- modular enough to extend

Then improve visuals and depth incrementally.

