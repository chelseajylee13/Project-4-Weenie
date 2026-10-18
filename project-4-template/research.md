# Research

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Keep the evidence and creative decisions that currently guide the build.

## Working agreement

Developer: Run the starter first. Direct the inquiry, judge sources and options, make consequential decisions, and keep this file current.

Agent: Read `AGENTS.md`, `brief.md`, and this file, then inspect the project. Help compare possibilities, test assumptions quickly, and verify external sources without delaying the prototype for exhaustive research.

Start a fresh chat with:

`Read brief.md and research.md, inspect the running project, and help me develop the scene and three spooky stories.`

## Inquiry and decisions

Record only what informs the next build decisions:

- creative alternatives for the scene, stories, and audiovisual direction, with reasons for your choices
- useful sources and references, what they support, and important limitations
- experiments that resolve uncertainty, the results, and consequential trade-offs

Investigate unfamiliar techniques or asset sources as needed. Verify usage terms and keep source links and required credits here. Distinguish evidence from assumptions; the Agent's recommendation alone is not evidence.

### Status key

- **Approved requirement:** supplied or confirmed by the Developer, or fixed by `brief.md`
- **Proposed decision:** a creative or technical choice that still needs Developer approval
- **Unverified research:** a claim, source, or asset that still needs checking

### Approved creative direction

- **Approved requirement:** The experience is titled *Once Upon a Midnight: The King of Shadows*.
- **Approved requirement:** The scene is one vertical, non-scrolling paper theater. A giant hollow tree and its hanging lantern form the focal point. A crooked cottage, distant tower and moon, layered forest silhouettes, and foreground foliage establish the setting.
- **Approved requirement:** The visual language uses original SVG and CSS artwork inspired by handcrafted shadow puppets: dark cut-paper shapes, theatrical backlighting, hinged forms, muted charcoal and parchment, muted purple, and selective amber light.
- **Approved requirement:** The tone is mysterious, elegant, slightly mischievous, playful, and appropriate for ages 10 and older. It does not directly adapt the original ballad's threatening events or tragic ending.
- **Approved requirement:** The three story premises are *The Crown in the Trees*, *The Shadow That Escaped*, and *The King's Midnight Invitation*.
- **Approved requirement:** Phase 1 includes the complete ambient scene and the first complete eight-second story. Eight seconds satisfies the brief's required 5-10 second duration.
- **Approved requirement:** Story 1 begins after three taps, clicks, or keyboard activations on the entire hanging lantern. The lantern will have a comfortably touch-sized hit area.
- **Approved requirement:** Each trigger activation gives distinct audiovisual feedback through *The King's Awakening*: the first reveals the actual Story 1 head silhouette, the second reveals its actual amber eye path, and the third continues those same elements into the full story reveal. There is no separate preview face, eye layer, progress bar, symbol, or carved-mark system.
- **Approved requirement:** The King of Shadows appears mysterious, elegant, and slightly mischievous rather than threatening. The story ends when the branch crown transforms into glowing paper leaves.
- **Approved requirement:** Phase 1 retains progressive hints, replay without reload, input locking during the story, keyboard accessibility, reduced-motion support, unified Play/Pause, and Developer verification on a smartphone.

### Sources and limitations

- Inspiration video: https://www.youtube.com/watch?v=JS91p-vmSf0. **Unverified research:** Treat this as a visual reference only; permission to reuse its animation or recording has not been established.
- Historical score reference: https://imslp.org/wiki/Erlk%C3%B6nig%2C_D.328_%28Schubert%2C_Franz%29. **Unverified research:** Any individual edition or recording must be checked before use.
- Copyright distinction: https://www.copyright.gov/engage/musicians/. A musical composition and a particular sound recording are separate works.
- **Approved decision:** Use original artwork and do not copy frames, character designs, or audio from the inspiration video.
- **Approved requirement and Developer-verified license:** Checkpoint 3 uses only the following three Freesound assets. The Developer independently confirmed that each linked page currently identifies its asset as Creative Commons 0 (CC0). CC0 does not require attribution, but the creators and sources remain credited here:
  - `464694__branndybottle__night_wind.wav` / “night_wind.wav” by BranndyBottle — https://freesound.org/people/BranndyBottle/sounds/464694/ — CC0; stereo, 44.1 kHz, 16-bit WAV; used as the main atmospheric foundation.
  - `707835__stevielematt__paper-rustling.wav` / “PAPER RUSTLING” by stevielematt — https://freesound.org/people/stevielematt/sounds/707835/ — CC0; mono, 48 kHz, 24-bit WAV; retained unchanged in the source archive but no longer used in the active mix.
  - `533532__saltbearer__yolk-bangin-fft.wav` / “yolk bangin FFT.wav” by Saltbearer — https://freesound.org/people/Saltbearer/sounds/533532/ — CC0; stereo, 44.1 kHz, 16-bit WAV; used as a very quiet spectral color.
- **Developer-selected replacement and verified license:** `232447__mmaruska__lights-flicker-on.wav` / “Lights Flicker On.wav” by mmaruska — https://freesound.org/people/mmaruska/sounds/232447/ — CC0; mono, 192 kHz, 24-bit WAV. The official source page identifies it as a fluorescent light switching on, humming, and switching off. The Developer preferred this sound to the paper rustle; only brief excerpts from its initial flickering portion are used.
- **Approved implementation decision:** Keep all original WAV downloads unchanged in `assets/audio/source/`. The reproducible `scripts/build-ambient-audio.mjs` process resamples active sources to 44.1 kHz stereo PCM and produces `assets/audio/ambient-midnight.wav`, a single 36-second loop.
- **Approved sound direction:** The wind remains dominant. Three separately faded electrical-flicker excerpts appear occasionally and subtly. The spectral layer fades slowly at a much lower gain, preserving musical space for Story 1.
- **Audio-processing record:** Three overlapping wind placements are wrapped around the output buffer with 3.2-second equal-power-style fades so the loop boundary remains continuous. Flicker excerpts use 0.35–0.4-second edge fades and draw only from the first 3.3 seconds of the source, avoiding its long steady hum and shutoff. The spectral excerpt uses five-second fades. Each active source is RMS-referenced before its approved relative gain is applied; the final mix is stereo 16-bit/44.1 kHz and is reduced only if its peak would exceed 0.82. No audio was extracted from the inspiration video.
- **Approved Story 1 source and verified license:** `95262__department64__tree_creak_04.wav` / “tree_creak_04.wav” by Department64 — https://freesound.org/people/Department64/sounds/95262/ — CC0; stereo, 44.1 kHz, 16-bit WAV. The official source page describes a smaller tree creaking in its upper branches. The Developer approved this specific asset for the opening branch movement.
- **Approved Story 1 music decision:** The rising motif is original project audio rather than a quotation or extracted recording of *Erlkönig*. It uses a restrained ascending D-minor color, papery overtones, and gentle rhythmic pulses to suggest mounting theatrical tension without copying Schubert's melody.
- **Story 1 audio-processing record:** `scripts/build-story-one-audio.mjs` takes a faded excerpt from 1–3.35 seconds of the approved tree-creak recording and combines it with the original synthesized motif. It produces `assets/audio/story-one-crown.wav`, an eight-second stereo 16-bit/44.1 kHz cue. The cue is a single file so its effects and musical rise share one playback clock.
- **Developer-observed Story 1 revision:** In the initial screen recording, the King read as a narrow triangular shadow and the separate pointed crown did not clearly belong to him. The approved refinement uses a broad layered cloak, separate shoulders and neck, an angled profile, rigid hinged upper-body pieces, and a three-point branching crown that forms above the hollow before settling directly onto his head.
- **Developer-approved Story 1 simplification:** The later full-body revision still made the separate King, crown placement, and bow visually confusing. The replacement concept is *The Tree Remembers the King*: the tree is the performer, its inward-folding branches form a crown above the trunk, and only a subtle royal face and eyes appear inside the existing hollow. A small rigid tilt replaces the bow. This decision supersedes the full-body character approach above while preserving its record as revision evidence.
- **Developer-observed sequencing revision:** The hollow face reads more clearly, but revealing the crown before the face made the two elements appear to combine. The approved order now establishes the awakened hollow and royal face first, then gathers three upper branch sections in place into a crown above it. The crown never travels toward the face or appears as a separate royal prop; the held image is the tree itself as a crowned face.
- **Developer-observed crown-fit revision:** The face-first order reads better, but the broad crown remained too high and looked like a floating branch object. The crown is therefore narrowed to approximately the face width, lowered so its band overlaps the upper forehead, and given a short downward settling motion. The final held silhouette must read immediately as the King wearing the crown.
- **Developer-approved Checkpoint 5 behavior:** The entire hanging lantern is the three-activation target for touch, mouse, Enter, and Space. The provisional inactivity hints appear at 12, 24, and 36 seconds, one at a time, using the exact text recorded in `spec.md`; their timing remains open to peer-test revision. Story completion hides the shared silhouette, eyes, crown, and details and permits a new three-step replay.
- **Developer-observed Checkpoint 5 revisions:** The three-tap behavior worked in the first screen recording, but carved trunk marks felt narratively disconnected. A later preview-eye layer then visibly overlapped the Story 1 eyes. The final approved structure uses one SVG King only: discovery and Story 1 animate the same silhouette and eye elements, preventing duplicate faces or eyes by construction.
- **Developer-approved expression refinement:** Preserve the established head and crown shapes while replacing the slightly smiling mouth with a restrained downturn and adding subtle angled brow lines. The result should feel scarier and more mysterious without becoming gory, monstrous, or inappropriate for ages 10 and older.
- **Approved original feedback-audio decision:** `scripts/build-lantern-feedback.mjs` synthesizes three short stereo PCM cues from decaying wooden-tone harmonics and deterministic papery transients. The generated `lantern-step-1.wav`, `lantern-step-2.wav`, and `lantern-step-3.wav` files are original project audio and require no external attribution. One reusable player prevents overlapping cue instances.

### Repository structure decision

- The Git root is the outer `project-4-template` directory. It contains the existing `.git` directory and `README.md`.
- The supplied planning documents are in its child `project-4-template/` directory, which contains no second `.git` directory.
- **Approved implementation decision:** Keep the child `project-4-template/` directory as the single application root and place the lightweight app beside the supplied documents. This preserves all existing files, avoids another nested repository, and keeps the app and its documentation together.

## Revisions

Update decisions when new evidence changes the direction, linking to playtest observations in `plan.md` rather than copying them. Keep chosen behavior and asset requirements in `spec.md`. The Developer confirms when the inquiry is sufficient to continue building; exhaustive research is not a prerequisite.

## Saving the transcript

When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
