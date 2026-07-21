from pathlib import Path
from textwrap import wrap


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs"
MD_PATH = OUT_DIR / "OLOS_Software_Changes_Report.md"
PDF_PATH = OUT_DIR / "OLOS_Software_Changes_Report.pdf"


REPORT = [
    ("title", "OLOS Metal 3D Printing Slicer Change Report"),
    ("p", "Generated: 2026-07-07"),
    ("p", "Scope: This report is based on the current workspace state and the work discussed in the active Codex thread. It cannot include hidden details from other Codex chats unless those details are present in files, generated G-code, screenshots, or notes in this workspace."),
    ("h1", "Executive Summary"),
    ("p", "The OLOS slicer has been extended from a basic vector contour/infill generator into a hybrid metal 3D printing workflow with per-zone engraving, surface skin/roof generation, slanted deck skin support, variable grid support below roofs, compact machine-specific G-code formatting, and a more expressive 3D preview. Most changes are centered on the Prusa-based slice path for metal laser printing."),
    ("h1", "Major G-code and Slicer Changes"),
    ("h2", "1. OLSK / VisiCut-style machine format"),
    ("bullet", "The generated G-code now uses the tested OLSK coordinate convention: machine bed reference with G53, work origin reset with G92, and compact laser moves similar to the known-good Benchy 3x3 file."),
    ("bullet", "Startup and layer routine blocks support bed offsets, parking, powder feed, recoater travel, return to origin, and layer-height stepping."),
    ("bullet", "Unsupported or unnecessary modal commands were avoided in the compact path because the target controller may stall on commands it already owns."),
    ("bullet", "Layer blocks are organized as routine, work origin reset, M3, infill/skin/contour content, M5, then return-to-origin travel."),
    ("h2", "2. Per-zone scan mode and exposure"),
    ("bullet", "The slicer now supports first-layer, intermediate-layer, and remaining-layer zones."),
    ("bullet", "Each zone can use its own scan mode: vectoring or engraving."),
    ("bullet", "Each zone can use its own infill/contour power and feed rate."),
    ("bullet", "This enables engraved adhesion or transition layers followed by normal vectored body layers."),
    ("h2", "3. Engraving mode with rastered contour shell"),
    ("bullet", "Engraving layers are generated as line-by-line raster rows instead of normal vector hatch paths."),
    ("bullet", "The contour shell is rastered together with the fill rows, and the G-code marks this with comments such as ENGRAVING COMBINED ROWS START."),
    ("bullet", "Engraving lead-in and lead-out compensation is calculated from feed rate and acceleration."),
    ("bullet", "The engraved shell can be matched to the calculated vector wall width so engraved and vectored regions have comparable physical wall thickness."),
    ("h2", "4. Engraved interior grid"),
    ("bullet", "Engraved layers can fill the interior core with grid bands rather than leaving only an engraved contour shell."),
    ("bullet", "Recent changes convert engraved variable/interior grid into rastered grid bands inside the combined engraving rows, with sparse vector grid only as a fallback if band generation fails."),
    ("bullet", "This makes engraved first and intermediate layers behave more like true engraved layers instead of visibly vectored grid lines."),
    ("h2", "5. Vector infill and contours"),
    ("bullet", "Vectoring mode supports line hatch and grid infill, configurable line count, hatch spacing, grid spacing, and grid clearance."),
    ("bullet", "Contour line count, contour/infill overlap, boundary fallback, scan order optimization, and hatch rotation grouping are handled in the vector generator."),
    ("bullet", "Normal infill is preserved in non-roof/non-variable-grid areas so support-grid logic does not accidentally hollow the rest of a layer."),
    ("h1", "Roof and Surface Skin Features"),
    ("h2", "6. Surface solid skin"),
    ("bullet", "A generated skin system was added for roof/deck surfaces. The skin is separate from ordinary sparse infill and appears in preview as dark green."),
    ("bullet", "Skin regions are excluded from normal infill so the same roof area is not filled first with infill and then overwritten by roof skin."),
    ("bullet", "Surface skin has its own power, feed rate, hatch spacing, layer count, and alternate-line behavior."),
    ("h2", "7. Flat roof skin"),
    ("bullet", "Flat roof/deck detection identifies broad stable top-skin regions rather than every tiny cap or wall top."),
    ("bullet", "Flat roof skin supports independent layer count, hatch spacing, laser power, feed rate, raster direction, and cross hatch."),
    ("bullet", "Flat roof boundary modes include engraved boundary, vector boundary, contour-only, or no boundary."),
    ("bullet", "Flat skin can use a normal hatch pattern or spiral pattern with outside-in or inside-out direction."),
    ("h2", "8. Slanted roof / slanted deck skin"),
    ("bullet", "Slanted surface skin detects usable sloped roof/deck strips by comparing future layers and filtering tiny wall/rim caps."),
    ("bullet", "Slanted skin can have its own layer count, hatch spacing, power, feed rate, raster direction, and cross hatch."),
    ("bullet", "The slanted deck is intended to be built layer by layer: each layer may contain normal infill, variable-grid support, and a local skin/roof strip where appropriate."),
    ("h2", "9. Roof-only exclusion logic"),
    ("bullet", "Normal infill is subtracted from active roof/skin regions before vector G-code is emitted."),
    ("bullet", "This prevents the same local roof area from receiving ordinary infill and surface skin on the same layer."),
    ("bullet", "Other non-roof regions on the same layer still receive normal infill."),
    ("h2", "10. Roof hollow infill support"),
    ("bullet", "A separate roof-hollow infill path exists for filling hollow roof cores when enabled."),
    ("bullet", "It has its own overlap setting and can use variable-grid settings when targeted to hollow regions."),
    ("bullet", "In the latest inspected file this feature was disabled, but the code path remains available."),
    ("h1", "Variable Grid Features"),
    ("h2", "11. Variable grid before roof"),
    ("bullet", "Variable grid support can be generated in the layers before a roof or slanted roof."),
    ("bullet", "The main purpose is to strengthen regions underneath roof/skin so the final roof does not sit over unsupported sparse infill."),
    ("bullet", "Variable grid can target hollow regions or both hollow and main infill areas."),
    ("h2", "12. Multi-stage variable grid"),
    ("bullet", "The slicer supports stage 1, stage 2, and stage 3 variable-grid sections."),
    ("bullet", "Stage 1 is closest to the roof. Stage 2 is farther below. Stage 3 is optional and can be enabled for a third support band."),
    ("bullet", "Each stage has its own lookahead layer count, grid spacing, hatch spacing, clearance, line count, and engraving-grid width settings."),
    ("bullet", "Preview colors distinguish stages: stage 1 is deepskyblue, stage 2 is gold, and stage 3 is magenta."),
    ("h2", "13. Spatial variable grid for slanted layers"),
    ("bullet", "Variable grid was changed from a whole-layer decision to a per-region decision."),
    ("bullet", "A single slanted layer can now contain far support grid, near support grid, roof skin, and normal infill in different local regions."),
    ("bullet", "This matches the desired slanted-deck behavior: 4x4 grid partially, 3x3 grid partially, and roof partially in the same layer, progressing with the slope."),
    ("h2", "14. Normal infill preservation around variable grid"),
    ("bullet", "When variable-grid regions are generated, the slicer computes normal infill for region minus variable-grid support region."),
    ("bullet", "This prevents layers near roofs from becoming hollow outside the variable-grid patch."),
    ("bullet", "Variable-grid stages are also separated from each other to avoid one stage overwriting another in the same local area."),
    ("h2", "15. Grid overlap minimization"),
    ("bullet", "Variable-grid hatches are phase-shifted relative to normal grid lines to reduce direct overlap."),
    ("bullet", "The slicer cannot eliminate every crossing, but it now tries to place grid lines in different spaces where possible."),
    ("h1", "Preview and Visualization Changes"),
    ("h2", "16. Separate preview channels"),
    ("bullet", "The 3D preview now separates normal infill, contour, engraving grid, variable-grid stages, and surface skin into different draw batches."),
    ("bullet", "This makes it possible to color and inspect each role independently."),
    ("h2", "17. Preview colors"),
    ("bullet", "Normal infill is light coral/red, engraved infill is crimson, roof/skin is dark green, engraving grid is dodger blue, variable-grid stage 1 is deepskyblue, stage 2 is gold, and stage 3 is magenta."),
    ("bullet", "High-opacity rendering is used for roof, engraved infill, engraving grid, and variable-grid overlays so they remain visible."),
    ("h2", "18. Compact G-code preview parsing"),
    ("bullet", "The preview worker can parse compact VisiCut-style G-code where M3 is outside the split infill/contour sections."),
    ("bullet", "Preview-only contour comments are decoded so contours remain visible without adding executable contour moves to the print file."),
    ("bullet", "Preview-only grid and surface-skin comments are decoded for display while remaining harmless to the machine."),
    ("h2", "19. Red patch / squashed-object preview fix"),
    ("bullet", "The preview fallback that caused the full object to appear squashed into lower layers was restricted so it does not run after marker-based batches have already been parsed."),
    ("bullet", "This addressed the large red patch that appeared after the rest of the body loaded in preview."),
    ("h2", "20. Engraving-layer preview detection"),
    ("bullet", "The worker detects the last layer scan-mode header before each infill marker, so engraving layers can be previewed with engraving colors and behavior."),
    ("bullet", "This avoids treating engraved first/intermediate layers as ordinary vectoring layers in the preview."),
    ("h1", "Model Cropping and Placement"),
    ("h2", "21. Print-height slab cropping"),
    ("bullet", "The interface supports a non-destructive top and bottom print-height range."),
    ("bullet", "This lets a user print only a slab of the model, such as just the deck region and a little material below it."),
    ("bullet", "The selected lower and upper limits are stored with the slicing project data."),
    ("h2", "22. Drop model to platform"),
    ("bullet", "The slicer store exposes a dropModelOnPlatform action so a cropped or transformed model can be moved down to the build plate."),
    ("bullet", "This is important when the lower portion of a model is removed and the remaining section would otherwise appear floating."),
    ("h1", "Machine Routine and Layer Handling"),
    ("h2", "23. Recoater and powder routine"),
    ("bullet", "A layer routine was added for resetting axes, moving to parking, feeding powder/reserve, stepping Z, sweeping the recoater out and home, and returning to the bed reference."),
    ("bullet", "The Z move uses the current layer height, not cumulative height, to avoid compounding Z errors."),
    ("h2", "24. Source-layer and output-layer tracking"),
    ("bullet", "Layer headers include output layer number and source layer number, which is useful when crop/slab printing shifts the visible layer numbering."),
    ("bullet", "Example: a roof that visually belongs to source layer 51 can appear as output layer 12 after bottom cropping."),
    ("h1", "G-code Validation and Safety Checks"),
    ("h2", "25. Static G-code checks used during development"),
    ("bullet", "Generated files were checked for unknown commands, powered G0 moves, powered parking moves, standalone S0 lines, M3/M5 balance, and whether normal infill remains outside variable-grid regions."),
    ("bullet", "The latest inspected file had balanced M3/M5 counts and no unknown command lines."),
    ("h2", "26. Known current hardware issue: faint laser trails"),
    ("bullet", "The current G-code can still leave faint laser trails on the real machine even when it looks logically correct."),
    ("bullet", "The suspected cause is hardware/controller behavior while M3 remains armed and moves use S0 for off-state travel or lead-in/lead-out."),
    ("bullet", "A safer future format may need explicit M5 before non-print travel/gap moves and M3 only immediately before powered exposure moves. This may make files slower and less compact but safer for this laser driver."),
    ("h1", "Important Files Touched or Involved"),
    ("bullet", "OLOS_Server/src/utils/threeD_printing_slice/src/prusa_slicer.py: main Prusa-based metal slicing logic, surface skin, variable grid, engraving, and G-code generation."),
    ("bullet", "OLOS_Server/src/utils/threeD_printing_slice/src/slicers_shared_methods.py: shared machine initialization, layer routine, exposure zones, and compact laser formatting helpers."),
    ("bullet", "OLOS_Interface/src/workers/slice.previewer.worker.ts: parsing of compact G-code, variable-grid sections, roof/skin preview, and engraving-layer preview detection."),
    ("bullet", "OLOS_Interface/src/services/gcode.previewer.service/gcode.3D.previewer.service.ts: preview drawing roles, colors, opacity, and layer tracking."),
    ("bullet", "OLOS_Interface/src/stores/3d-slicing.ts: crop/slab controls, print-height range, generated G-code handling, and preview dispatch."),
    ("bullet", "OLOS_Interface/src/interfaces/3D.slicing.interface.ts: typed settings for surface skin, slanted skin, variable grid, engraving grid, and related controls."),
    ("h1", "Recommended Verification Before Printing"),
    ("bullet", "Regenerate the G-code after code changes; old .nc files do not update automatically."),
    ("bullet", "Inspect early engraved layers for RASTER GRID INTERIOR CORE and absence of old ENGRAVING VARIABLE GRID START markers."),
    ("bullet", "Inspect slanted roof layers for coexistence of normal infill, variable-grid stage 2, variable-grid stage 1, and surface skin where expected."),
    ("bullet", "Run a low-power or dry motion test when changing laser-off formatting, because the real machine has shown faint marking during S0 travel moves."),
    ("bullet", "If faint trails continue, prioritize a hardware-safe laser state format over compactness: explicit M5 around all non-print moves, optional dwell after off, and re-arm only before exposure."),
]


def markdown_lines():
    lines = []
    for kind, text in REPORT:
        if kind == "title":
            lines.append(f"# {text}")
            lines.append("")
        elif kind == "h1":
            lines.append(f"## {text}")
            lines.append("")
        elif kind == "h2":
            lines.append(f"### {text}")
            lines.append("")
        elif kind == "bullet":
            lines.append(f"- {text}")
        else:
            lines.append(text)
            lines.append("")
    return lines


def pdf_escape(text):
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
    )


def build_pdf(lines):
    page_width = 612
    page_height = 792
    margin_x = 54
    margin_y = 54
    body_size = 10
    title_size = 18
    h1_size = 14
    h2_size = 11
    leading = 14
    max_chars = 92
    pages = []
    current = []
    y = page_height - margin_y

    def add_line(text, size=body_size, font="F1", gap_after=0):
        nonlocal y, current
        if y < margin_y + leading:
            pages.append(current)
            current = []
            y = page_height - margin_y
        current.append((margin_x, y, size, font, text))
        y -= leading + gap_after

    for raw in lines:
        if raw.startswith("# "):
            add_line(raw[2:], title_size, "F2", 8)
            continue
        if raw.startswith("## "):
            y -= 4
            add_line(raw[3:], h1_size, "F2", 4)
            continue
        if raw.startswith("### "):
            y -= 2
            add_line(raw[4:], h2_size, "F2", 2)
            continue
        if raw.startswith("- "):
            wrapped = wrap(raw[2:], width=max_chars - 4) or [""]
            add_line("- " + wrapped[0], body_size, "F1", 0)
            for cont in wrapped[1:]:
                add_line("  " + cont, body_size, "F1", 0)
            continue
        if raw == "":
            y -= 5
            continue
        for part in wrap(raw, width=max_chars) or [""]:
            add_line(part, body_size, "F1", 0)
        y -= 4

    if current:
        pages.append(current)

    objects = []

    def add_object(data):
        objects.append(data)
        return len(objects)

    font1 = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    font2 = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    page_refs = []
    content_refs = []
    for page in pages:
        stream_lines = ["BT"]
        for x, line_y, size, font, text in page:
            stream_lines.append(f"/{font} {size} Tf")
            stream_lines.append(f"1 0 0 1 {x} {line_y:.2f} Tm")
            stream_lines.append(f"({pdf_escape(text)}) Tj")
        stream_lines.append("ET")
        stream = "\n".join(stream_lines).encode("latin-1", errors="replace")
        content_refs.append(
            add_object(
                b"<< /Length " + str(len(stream)).encode("ascii") +
                b" >>\nstream\n" + stream + b"\nendstream"
            )
        )
    pages_ref_placeholder = None
    for content_ref in content_refs:
        page_refs.append(add_object(
            f"<< /Type /Page /Parent 0 0 R /MediaBox [0 0 {page_width} {page_height}] "
            f"/Resources << /Font << /F1 {font1} 0 R /F2 {font2} 0 R >> >> "
            f"/Contents {content_ref} 0 R >>".encode("ascii")
        ))
    kids = " ".join(f"{ref} 0 R" for ref in page_refs)
    pages_obj = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_refs)} >>".encode("ascii")
    pages_ref = add_object(pages_obj)
    catalog_ref = add_object(f"<< /Type /Catalog /Pages {pages_ref} 0 R >>".encode("ascii"))

    # Patch page parent references now that pages_ref is known.
    for ref in page_refs:
        objects[ref - 1] = objects[ref - 1].replace(b"/Parent 0 0 R", f"/Parent {pages_ref} 0 R".encode("ascii"))

    out = bytearray()
    out.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(out))
        out.extend(f"{index} 0 obj\n".encode("ascii"))
        out.extend(obj)
        out.extend(b"\nendobj\n")
    xref_offset = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    out.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        out.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    out.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_ref} 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n".encode("ascii")
    )
    return bytes(out)


def main():
    OUT_DIR.mkdir(exist_ok=True)
    lines = markdown_lines()
    MD_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    PDF_PATH.write_bytes(build_pdf(lines))
    print(MD_PATH)
    print(PDF_PATH)


if __name__ == "__main__":
    main()
