================================================================================
OLOS BACKEND PATCHES — 4 CRITICAL FIXES
================================================================================

This patch set fixes 4 issues in the OLOS server's G-code generation:

  Issue 1 (Critical) - Infill geometry exceeds tile boundary (X = -1)
  Issue 2 (Critical) - No per-zone laser power control (first/bulk/final)
  Issue 3 (Critical) - No M3 laser-enable command before infill scanning
  Issue 4 (Major)    - Infill angle parameter not applied to output

================================================================================
FILES CHANGED (4 files)
================================================================================

Replace these files in your OLOS_Server installation:

  1. C:\Users\Dharunjaz\Open-Lab-Operating-System\OLOS_Server\src\utils\
     threeD_printing_slice\src\slicers_shared_methods.py

  2. C:\Users\Dharunjaz\Open-Lab-Operating-System\OLOS_Server\src\utils\
     threeD_printing_slice\src\pyslm.py

  3. C:\Users\Dharunjaz\Open-Lab-Operating-System\OLOS_Server\src\utils\
     threeD_printing_slice\src\prusa_slicer.py

  4. C:\Users\Dharunjaz\Open-Lab-Operating-System\OLOS_Server\src\utils\
     threeD_slice.py

================================================================================
HOW TO APPLY THE PATCHES
================================================================================

STEP 1 - Backup your existing files first.

   In CMD:
       cd C:\Users\Dharunjaz\Open-Lab-Operating-System\OLOS_Server\src\utils
       copy threeD_slice.py threeD_slice.py.backup
       cd threeD_printing_slice\src
       copy slicers_shared_methods.py slicers_shared_methods.py.backup
       copy pyslm.py pyslm.py.backup
       copy prusa_slicer.py prusa_slicer.py.backup

STEP 2 - Replace each file with the patched version.

   Copy the four files from the patches folder into the same locations
   as the originals.

STEP 3 - Restart the OLOS server.

   In your server CMD window press Ctrl+C, then:
       cd C:\Users\Dharunjaz\Open-Lab-Operating-System\OLOS_Server
       venv\Scripts\activate
       python src/main.py

STEP 4 - Slice a test model and verify the G-code output.

   Open the generated .nc file and check for:
       - M3 appears before each "; infill" section
       - M5 appears after each infill section
       - All X and Y values stay within the tile bounds
       - Z values use 3 decimal places (no floating point error)

================================================================================
WHAT EACH FIX DOES
================================================================================

ISSUE 1 - Boundary clamping
   The clamp_gcode_to_bounds() function is called on the infill G-code
   for every layer. It scans each X and Y value and clamps it to the
   model's actual bounding box (with a small 0.05mm margin for rounding).
   The bounds are computed from the model geometry in pyslm.py and from
   the model_size in prusa_slicer.py.

ISSUE 2 - Per-zone laser power
   Each layer can use a different power and speed depending on whether
   it's in the first-layer zone, intermediate transition zone, or the
   normal bulk zone. The configured first/intermediate zones use their
   corresponding power and speed values. All remaining layers use the
   main contour and infill settings.
   Backward compatible - if these fields are not sent from the frontend,
   the slicer falls back to the single power/speed mode.

ISSUE 3 - M3/M5 framing
   In generate_gcode_for_layer(), the layer structure becomes:
       [Z move]
       ; infill
       M3                  <-- NEW: enable laser
       [infill gcode]
       M5                  <-- NEW: disable laser
       ; contour
       [contour gcode]
   The contour section already had M3/M5 from svg2gcode, so this only
   adds it where it was missing.

ISSUE 4 - Infill angle
   In _setup_hatching_pattern() in pyslm.py, the angle is now set on
   ALL relevant hatcher properties:
       infill.hatchAngle  (always)
       infill.stripeAngle (if StripeHatcher)
       infill.islandAngle (if IslandHatcher)
   Previously only hatchAngle was set, which for StripeHatcher only
   rotates hatches within each stripe, not the stripes themselves.

================================================================================
FRONTEND CHANGES NEEDED (separate task)
================================================================================

Issue 2 (per-zone power) requires frontend UI changes to be useful. The
backend already accepts the new fields, but the user can't set them yet.

In PrusaSettings.vue (and PyslmSettings.vue), add a new expansion item
for "Per-Zone Exposure" with these fields:
    firstLayersCount         (number, default 0)
    firstInfillPower         (number, % 0-100)
    firstInfillSpeed         (number, mm/min)
    firstContourPower        (number, % 0-100)
    firstContourSpeed        (number, mm/min)
    intermediateZoneEnabled  (boolean)
    intermediateLayersCount  (number, default 0)
    intermediateInfillPower  (number, % 0-100)
    intermediateInfillSpeed  (number, mm/min)
    intermediateContourPower (number, % 0-100)
    intermediateContourSpeed (number, mm/min)

In the corresponding store and TypeScript interface, add these properties
to the prusaSettings/pyslmSettings object.

================================================================================
NOTES AND CAVEATS
================================================================================

- These patches are backward compatible. Existing slicing profiles will
  continue to work without modification.

- Issue 1 uses CLAMPING (pinning out-of-bounds coordinates to the boundary)
  rather than CLIPPING (removing them entirely). This is safer because it
  preserves the laser-on/off sequence but can produce a small pile-up of
  laser points at the boundary edge. For most cases this is acceptable.

- Issue 4's fix uses hasattr() to check for stripeAngle and islandAngle
  before setting them. This protects against PySlm API changes between
  versions. If the patch doesn't fix the angle issue, the PySlm library
  itself may need to be updated or replaced.

- These patches do NOT fix the edge power reduction (S49-S55 variation
  in PrusaSlicer output). That requires modifying the underlying
  Image2gcode library which is outside the OLOS codebase.

- These patches do NOT add the OLSK-specific layer routine (powder feed
  and recoater sweep). For that you still need to run the post-processor
  script (olsk_postprocess.py) on the output.
