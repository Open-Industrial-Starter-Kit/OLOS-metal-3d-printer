# OLOS Metal 3D Printing Slicer Change Report

Generated: 2026-07-07

Scope: This report is based on the current workspace state and the work discussed in the active Codex thread. It cannot include hidden details from other Codex chats unless those details are present in files, generated G-code, screenshots, or notes in this workspace.

## Executive Summary

The OLOS slicer has been extended from a basic vector contour/infill generator into a hybrid metal 3D printing workflow with per-zone engraving, surface skin/roof generation, slanted deck skin support, variable grid support below roofs, compact machine-specific G-code formatting, and a more expressive 3D preview. Most changes are centered on the Prusa-based slice path for metal laser printing.

## Major G-code and Slicer Changes

### 1. OLSK / VisiCut-style machine format

- The generated G-code now uses the tested OLSK coordinate convention: machine bed reference with G53, work origin reset with G92, and compact laser moves similar to the known-good Benchy 3x3 file.
- Startup and layer routine blocks support bed offsets, parking, powder feed, recoater travel, return to origin, and layer-height stepping.
- Unsupported or unnecessary modal commands were avoided in the compact path because the target controller may stall on commands it already owns.
- Layer blocks are organized as routine, work origin reset, M3, infill/skin/contour content, M5, then return-to-origin travel.
### 2. Per-zone scan mode and exposure

- The slicer now supports first-layer, intermediate-layer, and remaining-layer zones.
- Each zone can use its own scan mode: vectoring or engraving.
- Each zone can use its own infill/contour power and feed rate.
- This enables engraved adhesion or transition layers followed by normal vectored body layers.
### 3. Engraving mode with rastered contour shell

- Engraving layers are generated as line-by-line raster rows instead of normal vector hatch paths.
- The contour shell is rastered together with the fill rows, and the G-code marks this with comments such as ENGRAVING COMBINED ROWS START.
- Engraving lead-in and lead-out compensation is calculated from feed rate and acceleration.
- The engraved shell can be matched to the calculated vector wall width so engraved and vectored regions have comparable physical wall thickness.
### 4. Engraved interior grid

- Engraved layers can fill the interior core with grid bands rather than leaving only an engraved contour shell.
- Recent changes convert engraved variable/interior grid into rastered grid bands inside the combined engraving rows, with sparse vector grid only as a fallback if band generation fails.
- This makes engraved first and intermediate layers behave more like true engraved layers instead of visibly vectored grid lines.
### 5. Vector infill and contours

- Vectoring mode supports line hatch and grid infill, configurable line count, hatch spacing, grid spacing, and grid clearance.
- Contour line count, contour/infill overlap, boundary fallback, scan order optimization, and hatch rotation grouping are handled in the vector generator.
- Normal infill is preserved in non-roof/non-variable-grid areas so support-grid logic does not accidentally hollow the rest of a layer.
## Roof and Surface Skin Features

### 6. Surface solid skin

- A generated skin system was added for roof/deck surfaces. The skin is separate from ordinary sparse infill and appears in preview as dark green.
- Skin regions are excluded from normal infill so the same roof area is not filled first with infill and then overwritten by roof skin.
- Surface skin has its own power, feed rate, hatch spacing, layer count, and alternate-line behavior.
### 7. Flat roof skin

- Flat roof/deck detection identifies broad stable top-skin regions rather than every tiny cap or wall top.
- Flat roof skin supports independent layer count, hatch spacing, laser power, feed rate, raster direction, and cross hatch.
- Flat roof boundary modes include engraved boundary, vector boundary, contour-only, or no boundary.
- Flat skin can use a normal hatch pattern or spiral pattern with outside-in or inside-out direction.
### 8. Slanted roof / slanted deck skin

- Slanted surface skin detects usable sloped roof/deck strips by comparing future layers and filtering tiny wall/rim caps.
- Slanted skin can have its own layer count, hatch spacing, power, feed rate, raster direction, and cross hatch.
- The slanted deck is intended to be built layer by layer: each layer may contain normal infill, variable-grid support, and a local skin/roof strip where appropriate.
### 9. Roof-only exclusion logic

- Normal infill is subtracted from active roof/skin regions before vector G-code is emitted.
- This prevents the same local roof area from receiving ordinary infill and surface skin on the same layer.
- Other non-roof regions on the same layer still receive normal infill.
### 10. Roof hollow infill support

- A separate roof-hollow infill path exists for filling hollow roof cores when enabled.
- It has its own overlap setting and can use variable-grid settings when targeted to hollow regions.
- In the latest inspected file this feature was disabled, but the code path remains available.
## Variable Grid Features

### 11. Variable grid before roof

- Variable grid support can be generated in the layers before a roof or slanted roof.
- The main purpose is to strengthen regions underneath roof/skin so the final roof does not sit over unsupported sparse infill.
- Variable grid can target hollow regions or both hollow and main infill areas.
### 12. Multi-stage variable grid

- The slicer supports stage 1, stage 2, and stage 3 variable-grid sections.
- Stage 1 is closest to the roof. Stage 2 is farther below. Stage 3 is optional and can be enabled for a third support band.
- Each stage has its own lookahead layer count, grid spacing, hatch spacing, clearance, line count, and engraving-grid width settings.
- Preview colors distinguish stages: stage 1 is deepskyblue, stage 2 is gold, and stage 3 is magenta.
### 13. Spatial variable grid for slanted layers

- Variable grid was changed from a whole-layer decision to a per-region decision.
- A single slanted layer can now contain far support grid, near support grid, roof skin, and normal infill in different local regions.
- This matches the desired slanted-deck behavior: 4x4 grid partially, 3x3 grid partially, and roof partially in the same layer, progressing with the slope.
### 14. Normal infill preservation around variable grid

- When variable-grid regions are generated, the slicer computes normal infill for region minus variable-grid support region.
- This prevents layers near roofs from becoming hollow outside the variable-grid patch.
- Variable-grid stages are also separated from each other to avoid one stage overwriting another in the same local area.
### 15. Grid overlap minimization

- Variable-grid hatches are phase-shifted relative to normal grid lines to reduce direct overlap.
- The slicer cannot eliminate every crossing, but it now tries to place grid lines in different spaces where possible.
## Preview and Visualization Changes

### 16. Separate preview channels

- The 3D preview now separates normal infill, contour, engraving grid, variable-grid stages, and surface skin into different draw batches.
- This makes it possible to color and inspect each role independently.
### 17. Preview colors

- Normal infill is light coral/red, engraved infill is crimson, roof/skin is dark green, engraving grid is dodger blue, variable-grid stage 1 is deepskyblue, stage 2 is gold, and stage 3 is magenta.
- High-opacity rendering is used for roof, engraved infill, engraving grid, and variable-grid overlays so they remain visible.
### 18. Compact G-code preview parsing

- The preview worker can parse compact VisiCut-style G-code where M3 is outside the split infill/contour sections.
- Preview-only contour comments are decoded so contours remain visible without adding executable contour moves to the print file.
- Preview-only grid and surface-skin comments are decoded for display while remaining harmless to the machine.
### 19. Red patch / squashed-object preview fix

- The preview fallback that caused the full object to appear squashed into lower layers was restricted so it does not run after marker-based batches have already been parsed.
- This addressed the large red patch that appeared after the rest of the body loaded in preview.
### 20. Engraving-layer preview detection

- The worker detects the last layer scan-mode header before each infill marker, so engraving layers can be previewed with engraving colors and behavior.
- This avoids treating engraved first/intermediate layers as ordinary vectoring layers in the preview.
## Model Cropping and Placement

### 21. Print-height slab cropping

- The interface supports a non-destructive top and bottom print-height range.
- This lets a user print only a slab of the model, such as just the deck region and a little material below it.
- The selected lower and upper limits are stored with the slicing project data.
### 22. Drop model to platform

- The slicer store exposes a dropModelOnPlatform action so a cropped or transformed model can be moved down to the build plate.
- This is important when the lower portion of a model is removed and the remaining section would otherwise appear floating.
## Machine Routine and Layer Handling

### 23. Recoater and powder routine

- A layer routine was added for resetting axes, moving to parking, feeding powder/reserve, stepping Z, sweeping the recoater out and home, and returning to the bed reference.
- The Z move uses the current layer height, not cumulative height, to avoid compounding Z errors.
### 24. Source-layer and output-layer tracking

- Layer headers include output layer number and source layer number, which is useful when crop/slab printing shifts the visible layer numbering.
- Example: a roof that visually belongs to source layer 51 can appear as output layer 12 after bottom cropping.
## G-code Validation and Safety Checks

### 25. Static G-code checks used during development

- Generated files were checked for unknown commands, powered G0 moves, powered parking moves, standalone S0 lines, M3/M5 balance, and whether normal infill remains outside variable-grid regions.
- The latest inspected file had balanced M3/M5 counts and no unknown command lines.
### 26. Known current hardware issue: faint laser trails

- The current G-code can still leave faint laser trails on the real machine even when it looks logically correct.
- The suspected cause is hardware/controller behavior while M3 remains armed and moves use S0 for off-state travel or lead-in/lead-out.
- A safer future format may need explicit M5 before non-print travel/gap moves and M3 only immediately before powered exposure moves. This may make files slower and less compact but safer for this laser driver.
## Important Files Touched or Involved

- OLOS_Server/src/utils/threeD_printing_slice/src/prusa_slicer.py: main Prusa-based metal slicing logic, surface skin, variable grid, engraving, and G-code generation.
- OLOS_Server/src/utils/threeD_printing_slice/src/slicers_shared_methods.py: shared machine initialization, layer routine, exposure zones, and compact laser formatting helpers.
- OLOS_Interface/src/workers/slice.previewer.worker.ts: parsing of compact G-code, variable-grid sections, roof/skin preview, and engraving-layer preview detection.
- OLOS_Interface/src/services/gcode.previewer.service/gcode.3D.previewer.service.ts: preview drawing roles, colors, opacity, and layer tracking.
- OLOS_Interface/src/stores/3d-slicing.ts: crop/slab controls, print-height range, generated G-code handling, and preview dispatch.
- OLOS_Interface/src/interfaces/3D.slicing.interface.ts: typed settings for surface skin, slanted skin, variable grid, engraving grid, and related controls.
## Recommended Verification Before Printing

- Regenerate the G-code after code changes; old .nc files do not update automatically.
- Inspect early engraved layers for RASTER GRID INTERIOR CORE and absence of old ENGRAVING VARIABLE GRID START markers.
- Inspect slanted roof layers for coexistence of normal infill, variable-grid stage 2, variable-grid stage 1, and surface skin where expected.
- Run a low-power or dry motion test when changing laser-off formatting, because the real machine has shown faint marking during S0 travel moves.
- If faint trails continue, prioritize a hardware-safe laser state format over compactness: explicit M5 around all non-print moves, optional dwell after off, and re-arm only before exposure.
