# Technical Specification

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Keep a concise, testable description of the experience currently being built.

## Working agreement

Developer: Begin with the running prototype, approve the intended behavior, test it directly, and update this file when the intended result changes.

Agent: Read `AGENTS.md`, `brief.md`, `research.md`, and this file, then inspect the project. Turn decisions into acceptance checks without inventing product choices or freezing details that still require testing.

Start a fresh chat with:

`Read the project documents, inspect the running prototype, and help me specify the next useful build checkpoint.`

## Current build contract

Define only enough to build and verify the current direction:

- the intended User experience and chosen scene, ambience, and story behavior
- the system structure, shared rules, and states that keep audiovisual behavior and interaction coordinated
- the assets and layout needed for that structure, linking to sources and credits in `research.md`
- acceptance checks for the chosen behavior and every requirement in `brief.md`, including accessibility and failure behavior

Reference the brief's fixed requirements rather than copying them. Specify your decisions precisely enough that the Developer and Agent can judge the same result. Leave untested details open until they are needed, and distinguish provisional ideas from approved behavior.

### Approved Phase 1 experience

*Once Upon a Midnight: The King of Shadows* is a lightweight HTML, CSS, and JavaScript experience presented as one fixed vertical paper-theater scene. A giant hollow tree and amber hanging lantern are the primary focal point. The composition also includes a crooked cottage, distant tower and moon, layered forest silhouettes, and foreground paper foliage.

The visual system uses original SVG and CSS shapes in charcoal, parchment, muted purple, and selective amber. Layering and theatrical backlighting should create depth without weakening readability on a narrow smartphone screen.

The start overlay resembles a closed storybook and includes an accessible Enter button. Before the User enters, the app detects `prefers-reduced-motion`. Audio, ambient motion, timers, hints, and story behavior will not begin until Enter is activated.

Checkpoint 2 adds three ambient visual systems after Enter: a gentle irregular lantern flicker, slight independent movement of the three branch assemblies, and a small number of drifting paper leaves. Reduced-motion mode removes branch rotation and leaf travel while retaining slow, low-contrast opacity changes.

Checkpoint 3 adds one quiet 36-second ambient loop made only from the active approved CC0 sources recorded in `research.md`. Wind is the foundation, brief electrical flickers occur occasionally, and the restrained spectral layer leaves headroom and musical space for the future Story 1 sequence. Audio begins only in direct response to Enter. The existing Play/Pause control pauses and resumes the same audio element at its current position alongside all visual ambience; it never creates overlapping players or resets the loop.

If the audio file is missing or browser playback is blocked, the visual experience continues. An assistive status message reports the unavailable audio without adding a disruptive visible error to the scene.

Checkpoint 4 adds the complete eight-second *The Crown in the Trees* sequence behind a temporary development-only Test Story 1 button. One Web Animations master timeline coordinates the existing hinged branch assemblies, scene darkening, lantern flare, branch crown, King silhouette, bow, glowing-leaf transformation, retreat, and complete visual reset. Ambient visual animations pause during the story so they cannot compete with the controlled puppet movement.

The story uses one eight-second WAV containing the approved CC0 tree creak and an original rising motif. Ambient audio continues underneath at a smoothly reduced volume. The master animation time controls ambient ducking, and Story 1 audio is aligned to the master time when playback begins or resumes. Shared Play/Pause freezes the story timeline, both audio elements, and all other animations; resuming continues from the paused position.

The reduced-motion story retains the same timing, lighting changes, crown, King, bow, leaves, and conclusion while limiting branch rotation, vertical travel, and leaf movement. Story artwork is hidden and all temporary animation effects are cancelled after completion, then the controller returns to `exploring` for replay.

The current Story 1 concept is *The Tree Remembers the King*. The tree is the main performer: its three existing branch assemblies fold inward while three compact upper-branch pieces form a face-width crown. The crown makes a short downward settling motion and its lower band overlaps the revealed forehead, creating one connected crowned-face silhouette rather than a floating branch object. A restrained royal face, eyes, and collar appear only within the existing hollow, supported by warm backlight. During the crowned hold, this presence makes one small rigid nod before fading back into the tree. The crown then becomes glowing leaves as the branches and lighting return to their ambient state.

Play/Pause is fixed to the safe-area top-right of the portrait stage. The Standard/Reduced Motion label remains independently centered and must not overlap the control.

One unobtrusive Play/Pause button controls the shared ambient playback state. Pausing freezes all current CSS animations together and prevents ambience from running independently. Resuming continues the same animations rather than reloading the page.

### Approved first story

*The Crown in the Trees*, revised as *The Tree Remembers the King*, lasts eight seconds and has a clear beginning, middle, and end:

1. From 0-2 seconds, the lantern flares, the scene darkens, the hinged branches stir, and warm backlight awakens the hollow.
2. From 2-3.5 seconds, an elegant, slightly mischievous royal face appears inside the hollow before the crown is readable.
3. From 3.5-5.5 seconds, three compact upper branch sections hinge inward and settle into a wearable crown whose band connects directly to the top of the face.
4. From 5.5-6.5 seconds, the crowned face holds as the key image and gives one small, rigid paper-puppet acknowledgment.
5. From 6.5-8 seconds, the crown becomes glowing paper leaves, the face and backlight fade, and the original exploratory scene returns smoothly.

The trigger is exactly three accepted taps, clicks, or keyboard activations on the entire hanging lantern, using a comfortably touch-sized hit area. Each activation provides different visual motion and one short original audio cue. Rapid input is ignored while a response is completing, and failure to play a cue does not stop the visual response.

The discovery sequence is *The King's Awakening*. One SVG King group contains separate silhouette, eye, and facial-detail elements. The first activation reveals and retains the actual Story 1 head silhouette with its eyes, facial details, and crown still hidden. The second retains that same silhouette and reveals its single amber eye path. The third briefly brightens those same eyes before the unchanged eight-second story begins.

At story start, the existing silhouette and eye elements remain visible without resetting. The story timeline gradually raises the silhouette to its full opacity, introduces the remaining brow, nose, mouth, and collar details, and forms the existing crown above the same head. No separate preview face or eyes exist, so the handoff cannot visibly double those features. The mouth has a slight downturn and understated angled brows for a mysterious, unsettling expression that remains age-appropriate.

While the app is actively exploring, one provisional hint appears after each inactivity threshold: at 12 seconds, “Something in the branches is still awake...”; at 24 seconds, “A warm light keeps watch over the hollow.”; and at 36 seconds, “Perhaps the lantern has more than one secret to tell.” Interaction restarts the inactivity clock. Pausing preserves elapsed hint time, and hints remain absent during Story 1.

After Story 1, the shared King silhouette, eyes, facial details, crown, and other temporary effects return to their hidden state, hints restart, and another three accepted lantern activations replay the story. Keyboard-triggered playback returns focus to the lantern; pointer-triggered playback does not force focus. The development-only story button is hidden in normal use and can appear only on localhost when `?storyTest=1` is present.

### Approved shared behavior for completed Phase 1

The eventual Phase 1 controller will use four coordinated states:

- `intro`: the start overlay is present; scene playback and interaction have not begun
- `exploring`: ambience, hints, and the lantern trigger are available
- `story`: the eight-second sequence is playing and other scene input is locked
- `paused`: all motion, sound, effects, timers, and scene interaction are suspended together

Pause must remember and resume the preceding state without restarting or skipping story progress. Progressive hints appear only after inactivity while exploring and become more specific without immediately stating the solution. Reduced-motion mode preserves meaning and atmosphere with restrained opacity and lighting changes instead of large continuous movement.

Interactive controls must work by touch, mouse, Enter, and Space; have visible focus; and use comfortable hit areas. Progress cannot rely on color alone. Text must remain legible with sufficient contrast.

### Phase 1 acceptance checks

- The scene fits common portrait smartphone viewports without page scrolling.
- The hollow tree and lantern remain the clearest focal point.
- The cottage, tower and moon, forest layers, and foreground foliage remain distinct.
- The start screen and Enter control work by pointer and keyboard.
- Reduced-motion preference is detected before entry.
- The complete ambient version has at least three coordinated effects and looping licensed audio.
- Each of the three lantern activations produces unique audiovisual feedback: persistent shared silhouette, persistent shared eyes, then a brighter awakening that continues through Story 1 without duplicate artwork.
- The first story lasts approximately eight seconds, has a readable beginning, middle, and end, and can replay without a page reload.
- During the story, other scene interactions cannot advance.
- One Play/Pause control suspends and resumes motion, sound, effects, timers, and scene interaction together.
- All external assets have recorded sources and usage terms.
- The Developer personally verifies the completed Phase 1 experience on a physical smartphone before the requirement is marked complete.

## Scope and revisions

Record excluded ideas, the next behavior that must work, and consequential requirement changes with their evidence.

### Current boundary

Checkpoint 5 adds the final three-step lantern trigger, persistent hollow awakening states, provisional progressive hints, original response cues, input locking, and automatic replay reset around the unchanged Checkpoint 4 story. Stories 2 and 3 remain excluded.

The later stories, *The Shadow That Escaped* and *The King's Midnight Invitation*, remain approved premises but are outside Phase 1 implementation. Their detailed triggers and timing remain open until the first story has been tested.

## Saving the transcript

When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
