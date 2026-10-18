# Implementation Plan

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Track the next useful build checkpoints, verification, and consequential revisions.

## Working agreement

Developer: Keep the browser preview running, choose priorities, test results directly, and plan only the next few checkpoints.

Agent: Read the project documents and inspect the files. Keep each checkpoint small enough to run and judge. Do not expand scope or mark Developer verification complete.

Start or continue a fresh chat with:

`Read the project documents, inspect the current build, and help me complete the next unchecked checkpoint.`

## Checkpoints

Create your own checklist for the next few results, using the workflow in `brief.md` and the current `spec.md`. Name the main risk, what each checkpoint should produce, and how you will verify it. Review and approve the approach before implementation.

Test each result before continuing, including related behavior that already works. Update priorities as evidence emerges and preserve meaningful working checkpoints in git. Before delivery, verify the deployed app against the brief and specification.

### [x] Checkpoint 1: Mobile paper-theater shell

**Main risk:** The layered composition may become cluttered or lose the tree and lantern focal point on narrow phone screens.

**Build:**

- Keep the existing outer Git repository and use its child `project-4-template/` directory as the application root; do not create another repository or remove supplied files.
- Add minimal `index.html`, `styles.css`, and `app.js` files beside the project documents.
- Build a responsive, non-scrolling portrait stage using original SVG and CSS artwork.
- Establish the hollow tree and hanging lantern as the focal point, supported by a crooked cottage, distant tower and moon, distant forest silhouettes, and foreground foliage.
- Add a closed-storybook-inspired start overlay with an accessible Enter button.
- Detect `prefers-reduced-motion` before entry.
- Reserve stable layer and layout positions for the future Play/Pause control, ambient effects, story animation, progressive hints, and a touch-friendly lantern target without presenting unfinished features as working controls.
- Do not implement ambient audio, ambient animation, lantern trigger behavior, hint timers, Play/Pause behavior, or the story sequence.

**Agent checks:**

- Confirm the JavaScript parses successfully.
- Serve the folder locally and confirm `index.html`, `styles.css`, and `app.js` return successful responses.
- Inspect the document for the expected scene layers, reduced-motion state, and accessible Enter control.
- Report only checks actually performed. Do not mark Developer verification complete.

**Developer verification:**

1. Launch the local preview and open it at a narrow and a tall portrait size.
2. Confirm the page never scrolls and the complete composition remains framed.
3. Confirm the hollow tree and amber lantern attract attention before the cottage or tower.
4. Confirm the forest layers and foreground foliage add depth without obscuring the lantern.
5. Activate Enter once with touch or mouse and once with the keyboard.
6. Enable the device or browser's reduced-motion preference, reload, and confirm the preference is recognized before Enter.
7. Confirm no ambient motion, sound, trigger behavior, hints, story sequence, or visible nonworking Play/Pause control is present yet.

Developer approved the static scene and directed work to proceed to Checkpoint 2.

### [x] Checkpoint 2: Ambient scene behavior and shared controls

**Main risk:** Independent CSS effects could begin before Enter or fall out of sync when the experience is paused.

**Build:**

- Preserve the approved paper-theater artwork and responsive composition.
- Begin ambience only after Enter.
- Add gentle lantern flicker, slight independent movement to the three branch assemblies, and sparse drifting paper leaves.
- In reduced-motion mode, remove branch rotation and leaf travel while retaining slow, restrained opacity changes.
- Add one accessible Play/Pause button that freezes and resumes all ambient animations as a shared state.
- Do not add audio, lantern trigger progress, hints, story input locking, or Story 1 animation.

**Agent checks:**

- Confirm JavaScript parses successfully.
- Confirm ambient selectors require the entered state.
- Confirm Play/Pause controls every current ambient animation and exposes an accessible label and pressed state.
- Confirm reduced-motion rules remove continuous translation and rotation.
- Confirm no Story 1 or final trigger behavior has entered the build.

**Developer verification:**

1. Confirm no ambient movement begins behind the start cover.
2. Enter and observe that the lantern, branches, and leaves move subtly without distracting from the focal point.
3. Pause and confirm every ambient effect freezes immediately; resume and confirm all continue.
4. Operate Play/Pause with touch, mouse, Enter, and Space and confirm focus remains visible.
5. Enable reduced motion, reload, enter, and confirm branches remain still, leaves do not travel, and only calm opacity ambience remains.
6. Recheck the four target viewport sizes and confirm the page remains non-scrolling.

Checkpoint 2 is complete following the Developer's deployed-site ambient-animation verification recorded below.

### [x] Checkpoint 3: Ambient audio

**Main risk:** Browser audio restrictions or repeated pause/resume actions could prevent playback, restart the loop, or create overlapping sound.

**Build:**

- Preserve the approved artwork, start flow, ambient animation, and shared control.
- Retain all three unchanged CC0 source WAV files and document their provenance in `research.md`.
- Build one seamless 36-second stereo loop with dominant wind, three subtle electrical-flicker moments, and a very quiet spectral layer.
- Start audio only from the Enter activation.
- Use the existing Play/Pause state to pause and resume the same audio element without resetting its position or creating duplicate playback.
- Allow the visual scene to continue if the audio file is missing or playback is blocked.
- Do not add Story 1, triggers, progress, or hints.

**Agent checks:**

- Rebuild the mixed WAV from the recorded source files and inspect its format, duration, peak, and loop-boundary sample continuity.
- Confirm JavaScript parses successfully.
- Confirm the document references only one looping audio element and the script never clones or replaces it.
- Confirm audio playback is requested only after Enter and shares the existing paused state.
- Confirm the generated audio path can be served with the existing app files.

**Developer verification:**

1. Load the page and wait on the start screen; confirm there is no sound before Enter.
2. Press Enter and listen through at least one complete 36-second loop. Confirm wind is the foundation, the electrical flickers are occasional and restrained, the spectral layer is very quiet, and the boundary has no obvious cut or volume jump.
3. Pause and resume several times. Confirm sound and visual ambience stop and continue together from the same place, with no overlap or restart.
4. Repeat Enter and Play/Pause with keyboard controls and confirm visible focus remains clear.
5. Enable reduced motion, reload, and confirm the calmer visual ambience still shares Play/Pause with audio.
6. Temporarily rename `ambient-midnight.wav`, reload, and confirm the visual scene remains usable; restore the filename afterward.
7. Repeat the listening and controls test on a smartphone.

Checkpoint 3 is complete following the Developer's personal verification of the revised audio mix and shared controls.

### [x] Checkpoint 4: Story 1 — The Crown in the Trees

**Main risk:** Independent animations, audio elements, and ambient behavior could drift apart or reset incorrectly when the story is paused, resumed, or replayed.

**Build:**

- Preserve the approved scene, start overlay, ambience, reduced-motion detection, and shared control.
- Add original SVG artwork for a subtle royal face inside the tree hollow, theatrical backlight, three hinged upper-branch crown sections, and glowing paper leaves.
- Use the existing left, top, and right branch hinge pivots in one coordinated eight-second Web Animations timeline.
- Add the approved CC0 tree creak and original rising motif as one premixed eight-second story WAV.
- Keep ambient audio playing beneath the story, smoothly ducking it to 58 percent and restoring full volume during the ending.
- Pause and resume the master timeline, story audio, ambient audio, and all other motion together without restarting.
- Lock other story input during playback, clean up every temporary effect, return to `exploring`, and support repeated replay.
- Provide a complete reduced-motion telling with smaller travel and rotation.
- Add only a temporary accessible Test Story 1 button; do not add the lantern trigger, crown progress, hints, or later stories.

**Agent checks:**

- Confirm the application and both audio-build scripts parse successfully.
- Rebuild and inspect the story WAV for the expected eight-second stereo format.
- Confirm the story is governed by one eight-second master animation rather than unpausable timeouts.
- Confirm pause/resume aligns story audio to master animation time and preserves ambient playback position.
- Confirm the story button is disabled outside `exploring`, temporary story artwork is hidden after completion, and replay creates no retained animation or audio instance.
- Serve the page and confirm the HTML, JavaScript, ambient WAV, and Story 1 WAV return successfully.

**Developer verification:**

1. Enter the scene and confirm the existing ambience still behaves as before.
2. Activate Test Story 1 and time the complete sequence; it should last approximately eight seconds with recognizable beginning, middle, and ending stages.
3. Confirm the lantern and hollow awaken first, the face is readable by about 3.5 seconds, and only then do the upper branch sections gather into a crown above it.
4. Confirm the crown never appears to drop onto or combine with the face; the crowned tree-face holds clearly from about 5.5-6.5 seconds and gives a small dignified acknowledgment.
5. Confirm the crown becomes glowing paper leaves and no story artwork lingers afterward.
6. Pause during the beginning, middle, and ending on separate replays. Wait, resume, and confirm visuals, story sound, ambient sound, and completion continue from the same point.
7. Replay several times and confirm there is no duplicated sound, animation jump, or accumulated artwork.
8. Enable reduced motion before loading, then confirm the full narrative remains clear with gentler travel and branch rotation.
9. Repeat the timing, pause/resume, reset, replay, and reduced-motion checks on a smartphone.

Checkpoint 4 is complete following the Developer's desktop and deployed physical-phone verification recorded below.

**Latest refinement evidence:** Following the Developer's review, the crown was narrowed to approximately the face width and lowered so its curved band overlaps the upper forehead. Its three original branch-shaped SVG sections retain separate hinge points while the complete assembly settles downward into one connected crowned-face silhouette from 3.5-5.5 seconds. The held pose and leaf transition retain the existing timing. The final Developer verification is recorded below.

### [x] Checkpoint 5: Discoverable lantern interaction

**Main risk:** Rapid input, pause/resume, hint timers, and story reset could disagree about progress or start duplicate audio and story instances.

**Build:**

- Use the complete lantern as one touch-sized SVG target supporting touch, mouse, Enter, and Space.
- Accept exactly three activations while exploring, rate-limit each response, and ignore scene input while paused or during Story 1.
- Give each step distinct paper-puppet motion and an original short audio cue from one reusable player.
- Communicate progress with one shared King group: retain its real head silhouette after step one, add its real eye path after step two, and continue both elements into Story 1 after step three while the remaining face and crown emerge.
- Show the approved provisional hints individually after 12, 24, and 36 seconds of inactivity; preserve elapsed hint time through Play/Pause and suppress hints during the story.
- Reset progress and hints after the unchanged eight-second story so three new activations replay it.
- Return keyboard focus to the lantern only after keyboard-triggered playback.
- Hide the development story button normally; expose it only on localhost with `?storyTest=1`.
- Preserve all approved artwork, ambience, audio, Story 1 choreography, reduced-motion behavior, and Play/Pause placement.

**Agent checks:**

- Parse the application and all audio-build scripts; rebuild and inspect the three original feedback WAV files.
- Confirm a single feedback audio element is reused, guarded activations cannot overlap, and exactly the third accepted response calls the existing story entry point.
- Confirm hint timing is paused and resumed by the shared controller and cannot display outside `exploring`.
- Confirm Story 1 completion resets progress for replay and public hostnames cannot reveal the development button.
- Serve the HTML, CSS, JavaScript, existing audio, and all three feedback cues successfully.

**Developer verification:**

1. Activate the complete lantern three times by touch or mouse; confirm the steps respectively retain the dark head silhouette, add amber eyes to that same silhouette, and continue both into Story 1.
2. Confirm rapid extra input cannot skip an awakening stage, overlap feedback, or start Story 1 more than once.
3. Confirm tap one shows no eyes or crown, tap two adds eyes without a second face, and tap three introduces no duplicate silhouette or eye artwork.
4. Verify the three hints at approximately 12, 24, and 36 seconds, one at a time; confirm interaction resets the sequence and no hint appears during Story 1.
5. Pause during a feedback response and during each hint interval; resume and confirm audio, motion, and elapsed time continue rather than restart or skip.
6. Confirm the silhouette and eyes never reset or overlap at story start; the remaining facial details should emerge around the already-visible elements while the crown forms on the same head.
7. Confirm the slight mouth downturn and angled brows feel more mysterious and unsettling than smiling while remaining age-appropriate.
8. Complete Story 1, confirm the hollow returns to normal, then trigger and replay it again with three new activations.
9. Repeat with Tab, Enter, and Space; confirm visible focus, descriptive announcements for all three stages, and appropriate post-story focus return.
10. Test reduced motion and confirm all three awakening stages, hints, story, and replay remain complete with restrained lighting and opacity.
11. Optional resilience exercise: temporarily make a feedback WAV unavailable and confirm visual progress and Story 1 still work. Record this separately; it is not required for Phase 1 completion.
12. Repeat interaction, pause, replay, keyboard, and reduced-motion checks on a smartphone.

Checkpoint 5 is complete following the Developer's desktop and deployed physical-phone verification recorded below. The optional missing-audio exercise remains separate and unperformed.

## Evidence and revisions

Record non-identifying playtest observations, separating what Users did or said from your interpretation. Use the findings to choose revision priorities and record what changed and how you verified the improvement.

Keep implementation progress and verification here. Update `research.md` when evidence changes a decision and `spec.md` when intended behavior changes; link to those updates rather than duplicating them. Record consequential changes, not every small adjustment.

### Checkpoint 1 implementation evidence

- Agent check: `node --check app.js` completed successfully.
- Agent check: source inspection confirmed the planned SVG scene layers, reserved future layers, accessible Enter button, early reduced-motion detection, and unchecked Checkpoint 1 heading are present.
- Agent check: searches found no audio APIs, animation keyframes, or timers in the Checkpoint 1 source.
- Verification limit: local HTTP preview attempts could not start because this environment has neither an available `py` launcher nor an accessible `python.exe`. Visual browser rendering has not been claimed as verified.
- Developer verification was pending at this stage and was supplied after the later visual refinements.

### Checkpoint 1 static-scene revision

Developer observation: the start screen, palette, and overall atmosphere work well, but the scene needs a more organic tree and stronger paper-theater depth before animation begins.

Changes made:

- Replaced the thick geometric canopy with an irregular curved trunk and separate left, top, and right branch assemblies. Each assembly has a defined CSS transform origin for later hinged movement, but no animation is implemented.
- Added tapered secondary twigs, sparse paper-leaf clusters, small cut-paper markings, and a more legible hollow with a quiet inner rim reserved for the future King silhouette.
- Added separate far, middle, and near cast-shadow treatments plus a restrained hand-cut edge displacement on the tree.
- Refined the cottage roofline, chimney, window, door, and paper seams while lowering its contrast.
- Refined the tower roof, flag, windows, and narrow body while keeping it distant and subdued.
- Enlarged and detailed the lantern slightly, strengthened its amber halo, and retained a future touch region larger than the visible lantern.
- Added a limited set of tiny stars, moon texture, distant ridge contours, leaf details, and paper-frame highlights.
- Shifted the moon into the shared safe area used by all four requested viewport proportions. Full-bleed cropping now affects only expendable outer foliage and roots.

Agent checks after revision:

- `node --check app.js` still passes.
- Source inspection confirms no audio, timers, animation keyframes, trigger logic, hints, story sequence, or working Play/Pause control was added.
- Responsive crop calculations were checked for 320x568, 343x581, 360x640, and 390x844. The moon, tower, cottage, hollow, and lantern remain inside the calculated visible SVG area at each size.
- Verification limit: two automated headless-browser attempts did not complete, so no rendered screenshot or visual-browser verification is claimed.
- Developer requested one additional paper-theater refinement before final approval.

### Checkpoint 1 paper-theater refinement

Developer direction: keep the approved composition, palette, atmosphere, and static scope while increasing the intricacy and layer readability of the shadow-puppet artwork.

Changes made:

- Added fine curved filigree and tapered twig forks within each separate branch assembly. Sparse leaf shapes terminate selected twigs so the silhouette remains readable rather than uniformly busy.
- Reworked the foreground into intentional fern shapes, mirrored curling vines, leaf ornaments, and small cut-paper apertures that frame the lower scene without covering the lantern or hollow.
- Added a distinct midground paper bank with its own edge highlight and cast shadow, strengthening the separation between the distant forest, cottage and tower plane, central tree, and near-black foreground.
- Made the tower slightly wider and clearer with a sharper roof, side turrets, cross-divided amber window, flag, doorway, and a faint winding approach. Its muted contrast keeps it secondary to the lantern.
- Added restrained proscenium curls at the upper corners to reinforce the physical paper-theater frame without covering the moon.
- Preserved all existing responsive framing, future animation groups and pivots, accessibility structure, and behavior.

Agent checks:

- JavaScript syntax remains valid and unchanged.
- Source inspection confirms no animation keyframes, audio, timers, trigger behavior, hints, story sequence, or Play/Pause behavior was added.
- Developer subsequently approved the static scene as strong enough to proceed. Checkpoint 1 is complete.

### Checkpoint 2 implementation evidence

- Added post-Enter lantern flicker, independent subtle movement for the three branch assemblies, and six sparse drifting paper leaves.
- Added reduced-motion behavior that stops branch rotation and leaf travel while retaining slow opacity-only lantern and leaf ambience.
- Added one touch-sized, keyboard-operable Play/Pause control with visible focus, changing accessible labels, `aria-pressed`, and a polite status announcement.
- The shared pause state applies both CSS `animation-play-state` and the Web Animations interface to every current ambient animation. No JavaScript timers are used in this checkpoint.
- The UI overlay ignores pointer input outside the Play/Pause button so it does not obstruct future scene targets.
- Agent check: `node --check app.js` completed successfully and the stylesheet brace balance is zero.
- Agent source check: all ambient animation assignments require `data-entered="true"`; no audio, trigger logic, hints, input locking, or Story 1 sequence was added.
- Developer verification: Play/Pause works and the scene does not scroll. The Developer reported that the lantern flicker was too subtle and branch sway was not visibly apparent.
- Revision: increased the lantern's opacity and halo-size contrast while retaining eased, non-flashing changes. Replaced percentage-based branch origins with explicit SVG pivot coordinates and increased the slow sway to a visible but restrained range.
- At this stage, Developer re-verification of the revised flicker and branch sway was pending. The final deployed-site report below records the ambient animation as passed, completing Checkpoint 2.

### Checkpoint 3 implementation evidence

- Added the three Developer-supplied original CC0 WAV files under `assets/audio/source/` and generated one `assets/audio/ambient-midnight.wav` playback asset with the documented build script.
- Added one preloaded, looping audio element. Enter starts it through the same user gesture that reveals the scene; the existing Play/Pause controller pauses and resumes that element without changing `currentTime`.
- Added graceful failure reporting for missing or blocked audio while leaving visual ambience active.
- No Story 1 animation, trigger behavior, crown progress, hints, or story audio was added.
- Developer revision: the original paper-rustle layer was replaced with three brief excerpts from mmaruska's CC0 “Lights Flicker On.wav.” The unchanged paper source remains archived but unused. The Developer had reported that the earlier version worked before requesting this sound change; the revised mix still requires personal listening verification.
- Developer verification: the revised electrical-flicker mix sounds great and the experience works well, including the existing shared behavior. Checkpoint 3 is complete.

### Checkpoints 4 and 5 Developer verification report — 2026-10-17

The following results are the Developer's direct testing report, not Agent implementation checks:

- [x] Story timing and audio synchronization — Passed.
- [x] Play/Pause during interactions and Story 1 — Passed.
- [x] Repeated story replay and reset — Passed.
- [x] Reduced-motion behavior — Passed.
- [x] Keyboard accessibility and progressive hints — Passed.
- [x] General physical-smartphone operation on the deployed HTTPS experience — Passed. The Developer reports that the public site works well on a physical smartphone.
- [x] Physical-smartphone story duration — Approximately seven seconds on iPhone 18 Pro / Chrome. This satisfies the brief's required 5–10-second range.
- [x] Physical-smartphone Story 1 audio synchronization — Passed.
- [x] Physical-smartphone Pause/Resume — Passed.
- [x] Physical-smartphone reduced-motion behavior — Passed.

Developer observations: none recorded during the desktop verification. The final physical-phone results were reported without additional observations. Checkpoints 4 and 5 are complete.

### Checkpoint 4 implementation evidence

- Added a single eight-second Web Animations timeline controlling scene lighting, lantern flare, the three existing hinged branches, branch crown, King reveal and bow, glowing leaves, retreat, and reset.
- Added a centralized `intro` / `exploring` / `story` / `paused` controller. The paused state remembers and resumes its preceding state.
- Added one story-audio element and timeline-based ambient-volume ducking. Resume realigns story audio to the master animation when drift exceeds 45 milliseconds.
- Added original King, crown, backlight, and leaf SVG artwork within the reserved story layer plus a clearly labeled development-only test button.
- Added a reduced-motion animation path with smaller branch angles, a six-pixel King reveal, restrained bow, and limited leaf travel while preserving the complete eight-second sequence.
- Agent check: `node --check` passed for `app.js`, `build-ambient-audio.mjs`, and `build-story-one-audio.mjs`.
- Agent check: the story-audio build completed successfully; the generated WAV is exactly eight seconds, stereo, 44.1 kHz, 16-bit, with a measured peak of 0.0878.
- Agent check: source inspection found no `setTimeout`, `setInterval`, lantern-trigger listener, progressive-hint behavior, or later-story implementation in `app.js`.
- Agent check: a local static server returned HTTP 200 for the page, stylesheet, application script, ambient WAV, and Story 1 WAV.
- Verification limit: no controlled browser rendering or listening test was available in this environment. Visual timing, audible synchronization, reduced-motion presentation, and repeated interactive replay require Developer verification.
- Developer review of the initial screen recording: the timeline was present, but the King read as a narrow triangle and the crown did not clearly belong to him; Checkpoint 4 was not approved.
- Refinement: replaced the clipped triangular figure with a wider layered cloak, separate shoulder/neck/profile pieces, hinged arms, and a hinged upper body. Rebuilt the branch crown as one three-point twig silhouette that forms among the branches, settles onto the head, follows the bow, and then becomes leaves.
- Refinement: adjusted the eight-second choreography so branch folding and crown formation lead the first two seconds, the King and crown settle by four seconds, the readable pose and rigid-piece bow occupy the middle, and the leaf transformation and retreat begin near 5.5 seconds.
- Refinement: anchored Play/Pause explicitly to the stage's safe-area top-right while preserving the centered motion label and all accessible control behavior.
- Refinement agent check: `node --check app.js` passed; source inspection confirmed the separate cloak, upper body, profile, arms, continuous crown, eight-second duration, development button, and unchecked checkpoint remain present.
- Refinement agent check: a local static server returned HTTP 200 for the revised page, stylesheet, and application script. No rendered visual result is claimed.
- Developer review of the full-body refinement: the separate character, crown placement, and bow remained visually confusing, so the Developer did not approve Checkpoint 4.
- Current refinement: replaced the external full-body King with a subtle face, amber eyes, and collar clipped inside the tree hollow. The tree itself now holds the crown, and a three-and-a-half-degree rigid tilt communicates a dignified nod.
- Current choreography: branches fold and the crown forms during 0–2 seconds; the crown and hollow presence become readable during 2–4.5 seconds; the crowned tree holds and nods during 4.5–6.5 seconds; the crown becomes leaves and the complete scene resets during 6.5–8 seconds.
- Current-refinement agent check: `node --check app.js` passed. Source inspection confirmed the prior full-body cloak, upper-body, and arm pieces are absent; the hollow-clipped presence and tree crown are present; Story 1 remains configured for eight seconds; and Play/Pause remains anchored top-right. Checkpoint 4 was still awaiting Developer verification at this stage and is completed by the later report below.
- Current-refinement agent check: a local server returned HTTP 200 for the revised page, stylesheet, script, and unchanged Story 1 WAV. No rendered visual result is claimed.
- Crown-fit refinement: replaced the wide crown geometry with a compact face-width design, moved its band onto the upper forehead, updated all three hinge origins, and relocated the glowing leaves to match the new crown. The crown now settles downward while its branch points fold inward, then holds in contact with the face before dissolving.
- Crown-fit agent check: `node --check` passed for `app.js` and the unchanged Story 1 audio-build script; Git whitespace validation passed; and a local server returned HTTP 200 for the page, stylesheet, and application script. No rendered visual result is claimed.
- Developer visual approval: the latest crown placement and character design are approved. The crown now reads as part of the King's head, making the reveal substantially clearer. Preserve the King, crown, and surrounding scene unless a verified issue requires a change.
- Earlier verification boundary: at the time of the visual approval, only the design was verified. The later direct Developer reports above confirm desktop timing/audio synchronization, Play/Pause, replay/reset, and reduced motion plus the required deployed physical-phone checks. Checkpoint 4 is complete.
- Post-deployment Developer approval: the final King and crown design are approved without further visual changes.

### Checkpoint 5 implementation evidence

- Converted the reserved lantern region into one 73-by-111 SVG interaction target with button semantics, visible focus, mouse/touch activation, and explicit Enter/Space handling.
- Added a guarded three-step controller. Each accepted response must finish before another can count; the third response calls the existing Story 1 entry point once, and paused/story states disable the target.
- Initial implementation added three carved trunk marks; the Developer's screen-recording review found them narratively disconnected, so the awakening refinement below supersedes them.
- Added three distinct restrained lantern responses, reduced-motion opacity alternatives, and one reusable feedback audio element. The reproducible original-audio script generated cues of 0.420, 0.460, and 0.520 seconds at stereo 44.1 kHz with measured peaks of 0.1658, 0.1807, and 0.1849.
- Added one pause-aware inactivity clock for the approved provisional 12-, 24-, and 36-second hints. Accepted lantern activity and other non-control scene activity restart the sequence; Story 1 suppresses it.
- Story completion resets discovery progress, restarts hints, enables another three-step replay, and returns focus only when the triggering interaction was keyboard-based.
- First awakening attempt: replaced the carvings with a separate hollow glow and duplicate eye path. The Developer found that the preview eyes overlapped the Story 1 eyes, so this structure is superseded.
- Continuity correction: removed the entire preview layer. Discovery and Story 1 now animate one shared King group containing one silhouette path, one eye path, and one facial-detail group. The third activation preserves the silhouette and eyes while Story 1 adds details and forms the crown.
- Expression refinement: retained the approved head and crown geometry, changed the mouth from an upward curve to a slight downturn, and added restrained angled brows for a more mysterious, unsettling expression.
- Reset correction: the story layer remains available during exploration, but all King components default to hidden. Story completion cancels their timeline and synchronously resets the shared progress state, hiding the silhouette, eyes, details, and crown before replay.
- Continuity-correction agent checks: `node --check app.js` and Git whitespace validation passed. Source inspection found exactly one `.king-silhouette-base`, one `.king-eyes`, and one `.king-face-details`; no preview-eye, preview-glow, carved-mark, or story-layer visibility toggles remain. `STORY_DURATION` remains 8000 milliseconds.
- Continuity-correction server check: the revised page, stylesheet, application script, ambient WAV, unchanged Story 1 WAV, and all three unchanged lantern cues returned HTTP 200. No rendered visual or emotional-expression result is claimed.
- Awakening-refinement server check: the revised page, stylesheet, application script, three existing lantern cues, and unchanged Story 1 WAV each returned HTTP 200. No rendered visual transition or listening result is claimed.
- The development story button is hidden normally and can be exposed only on localhost with `?storyTest=1`; a public hostname cannot enable it through that query parameter.
- Agent checks: `node --check` passed for `app.js` and all three audio-build scripts; the feedback build completed; Git whitespace validation passed; and a local server returned HTTP 200 for the page, stylesheet, application script, both existing WAV files, and all three new feedback WAV files.
- Developer visual approval (latest review): the three-stage interaction now reads as one continuous reveal. The first activation reveals the King's dark silhouette, the second reveals the eyes within that same silhouette, and the third continues into the full King-and-crown animation without duplicate face or eye artwork. Preserve the approved King, crown, face, scene composition, and transition effects unless a later verification test identifies a specific defect.
- Earlier verification boundary: at the time of the visual approval, only the visual direction and transition were verified. The later direct Developer report above confirms desktop timing/audio synchronization, shared Play/Pause, replay/reset, reduced motion, keyboard behavior, and progressive hints.
- Agent verification limit: the Agent did not independently perform rendered-browser, listening, touch-device, or elapsed-time interaction tests; those results are attributed only to the Developer where reported.
- Post-deployment Developer approval: the final King and crown design and the complete silhouette → glowing eyes → full King-and-crown lantern interaction are approved. The deployed experience also works well in general on the Developer's physical smartphone. This does not claim phone-specific reduced-motion or detailed timing verification.

### GitHub Pages deployment evidence

- Preserved the outer Git repository and the approved nested `project-4-template/` application root; no files were moved and no nested repository was created.
- Added `.github/workflows/pages.yml` using GitHub's official checkout, Pages configuration, Pages artifact, and Pages deployment actions.
- The workflow validates and stages exactly eight public runtime files: `index.html`, `styles.css`, `app.js`, the ambient loop, the Story 1 mix, and the three lantern feedback cues.
- Project documents, transcripts, original source audio, reference material, and audio-building scripts remain in the source repository but are excluded from the published artifact.
- Pre-deployment Agent checks: `node --check` passed for the application and all three audio-building scripts; Git whitespace validation passed; all eight required runtime files exist; and a locally staged artifact contained exactly the expected eight files.
- Source push result: commit `1b3337f` was pushed successfully to `origin/main` with the complete project source and deployment workflow.
- First GitHub Actions result: run `39089211258` completed with failure. Checkout and public-file staging succeeded, but `actions/configure-pages@v5` failed because GitHub Pages is not yet enabled and configured to use GitHub Actions for this repository. Artifact upload and deployment were therefore skipped; no successful public URL is claimed.
- The Developer enabled GitHub Pages with GitHub Actions as the source and manually reran the deployment workflow.
- Successful deployment result: workflow-dispatch run `39089753244` completed successfully for commit `3010a66`. The confirmed public URL is `https://chelseajylee13.github.io/Project-4-Weenie/`.
- Post-deployment Agent checks: the page, stylesheet, application script, ambient WAV, Story 1 WAV, and lantern feedback WAV files are reachable over HTTPS. Seven endpoints returned HTTP 200 to direct HEAD checks; the remaining first lantern cue returned HTTP 206 to a one-byte ranged request after transient CDN connection resets, confirming that the asset is available.
- Post-deployment Developer check: the public HTTPS experience works well on an iPhone 18 Pro in Chrome. The later final report confirms the ambient animation, approximately seven-second story duration, Story 1 audio synchronization, physical-phone Pause/Resume, and physical-phone reduced motion all pass.

### Phase 1 completion

- [x] Checkpoint 2 ambient animation — Passed on the deployed website.
- [x] Story 1 duration — Approximately seven seconds, within the required 5–10-second range.
- [x] Story 1 audio synchronization — Passed.
- [x] Physical-phone Pause/Resume — Passed.
- [x] Physical-phone reduced motion — Passed.
- [x] Device/browser used for final verification — iPhone 18 Pro / Chrome.
- [ ] Optional missing-audio resilience exercise — Not reported and not required for Phase 1 completion. The Agent inspected the graceful failure-handling path, but no Developer runtime result is claimed.

All required Phase 1 acceptance criteria are satisfied. Checkpoints 1–5 are complete, the approved public HTTPS build is verified on a physical smartphone, and Phase 1 is finished. No further King, crown, interaction, scene, or audio-design approval is pending.

## Proposed Phase 2 plan — awaiting Developer approval

This plan preserves the completed Phase 1 experience and follows the same small-checkpoint workflow. No Phase 2 implementation begins until the Developer approves the plan and the consequential creative decisions for each story.

### Approved Phase 2 requirements

- Complete the two approved premises: *The Shadow That Escaped* and *The King's Midnight Invitation*.
- Give each story a discoverable trigger with unique audiovisual feedback, visible progress that is not color-only, progressive hints, input locking, replay, keyboard access, reduced-motion behavior, and shared Play/Pause support.
- Keep each story within the brief's 5–10-second range with a readable beginning, middle, and end.
- Preserve the approved scene, King and crown, Story 1, ambience, audio behavior, accessibility, responsive layout, and public deployment unless testing identifies a specific defect.
- Conduct peer playtesting on smartphones without explaining the interactions first; record observations separately from interpretation, revise consequential problems, and verify the complete three-story experience.

### Open creative decisions requiring approval

- The exact Story 2 and Story 3 triggers, progress feedback, hint text, timelines, and sound palettes are not yet approved.
- Story 2 should use the existing cottage as its principal stage and show one playful escaped shadow returning without becoming threatening. Story 3 should connect the King, tower/moon, and a miniature magical carnival without obscuring the established focal point. These are proposed constraints, not approved choreography.
- Any new external audio must be individually verified as CC0 or public domain and recorded in `research.md` before integration. Original locally generated cues remain an option.

### [ ] Phase 2 Checkpoint 6: Phase 1 peer discovery playtest

- Recruit peer Users and let each person explore the deployed site on a smartphone without instructions or assistance.
- Record whether they enter successfully, notice Play/Pause, discover the lantern, understand all three awakening stages, complete Story 1, and attempt replay.
- Record non-identifying observations and post-test comments, separating what Users did or said from interpretation.
- Identify only consequential revisions; obtain Developer approval before changing completed Phase 1 behavior.

### [ ] Phase 2 Checkpoint 7: Specify and storyboard Story 2

- Turn *The Shadow That Escaped* into an approved 5–10-second beginning/middle/end timeline centered on the cottage.
- Approve its trigger, three-step or equivalent progress language, provisional hints, shadow-puppet artwork, reduced-motion telling, and licensed/original audio plan.
- Resolve how its discovery state coexists with Story 1 without competing targets or simultaneous progress.
- Do not code until the storyboard and acceptance criteria are approved.

### [ ] Phase 2 Checkpoint 8: Implement and verify Story 2

- First build the coordinated audiovisual timeline behind a development-only test control.
- After the story is approved, add its discoverable interaction, feedback, hints, replay/reset, keyboard behavior, and shared state-controller integration.
- Verify timing, audio synchronization, pause/resume, interaction locking, reduced motion, repeated replay, and regression safety for Story 1 before deployment.

### [ ] Phase 2 Checkpoint 9: Specify and storyboard Story 3

- Turn *The King's Midnight Invitation* into an approved 5–10-second timeline in which the King conjures a miniature magical carnival.
- Approve how the existing King presence, tower/moon, and carnival elements connect; approve the trigger, progress language, hints, reduced-motion telling, and audio plan.
- Protect visual clarity on narrow phones and musical space across all three stories.
- Do not code until the storyboard and acceptance criteria are approved.

### [ ] Phase 2 Checkpoint 10: Implement and verify Story 3

- Build and approve the audiovisual timeline before adding its final discoverable trigger.
- Integrate feedback, hints, replay/reset, keyboard access, interaction locking, shared Play/Pause, and reduced motion.
- Verify all three stories can be discovered and replayed independently without duplicated audio, stale artwork, conflicting timers, or state leakage.

### [ ] Phase 2 Checkpoint 11: Complete-app peer playtest and revision

- Deploy the three-story build and repeat unassisted smartphone playtesting with peers.
- Observe discovery order, time to discover each trigger, hint usefulness, story comprehension, replay behavior, comfort with the spooky tone, and interest in exploring further.
- Prioritize revisions by frequency and impact, obtain Developer approval for consequential changes, then implement and retest one focused revision group at a time.

### [ ] Phase 2 Checkpoint 12: Final audit, deployment, and debrief

- Verify every brief requirement, asset credit, source/license record, keyboard path, touch target, reduced-motion path, audio state, timer, replay path, and common portrait viewport.
- Confirm the production artifact contains every new runtime asset but excludes source documents and build materials.
- Verify the final HTTPS deployment and complete three-story app on a physical smartphone.
- Add and complete the required `debrief.md`, update the project documents with final evidence, and close Phase 2 only after Developer verification.

## Saving transcripts

When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md` or `transcripts/build-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
