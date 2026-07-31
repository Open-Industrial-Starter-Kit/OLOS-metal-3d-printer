<div align="center">
  <h1>Open Lab Operating System</h1>
  <p><em>Open-source control and job-preparation software for digital fabrication machines</em></p>
</div>

## Metal 3D Printer Branch

The `metal-3d-printer` branch extends OLOS with a Prusa-based metal laser
printing workflow. It converts Prusa SL1 slice masks into compact
OLOS/VisiCut-style G-code and connects slicing, preview, job management, and
GRBL-compatible machine execution in one application.

This branch is under active development and targets the OLOS metal 3D printer
workflow. Machine configuration, generated G-code, laser state, axis limits,
and recoater motion must be verified on the intended controller before a
powered print.

## Current Metal Printing Features

- Hybrid layer processing with independently engraved first and intermediate
  zones followed by engraved or vectored remaining layers.
- Per-zone laser power and feed rate for first, intermediate, and remaining
  layers.
- Vector contours and Lines/Grid infill with configurable hatch angle, hatch
  rotation, line bundles, track width, overlap, grid spacing, and scan order.
- Engraved contour shells with optional grid-filled interiors, selectable X/Y
  raster direction, and shell-width matching to the calculated vector wall.
- Acceleration-based engraving lead-in and lead-out compensation using
  `d = (F / 60)^2 / (2a)`, including circular scan-area validation.
- Flat and slanted surface-skin generation with independent exposure and hatch
  controls.
- Multi-stage variable-grid support below roof and deck regions while
  preserving normal infill outside those regions.
- Solid-stack processing with line-filled layers, optional vector contours,
  configurable line overlap, top and bottom closure layers, and independent
  exposure controls.
- Edge-interleaved, two-pass, normal line, and island scan strategies with
  configurable direction, cross-hatching, layer rotation, island size, and
  island sub-strategy.
- Optional sacrificial anchor pads and multi-layer transition preparation for
  solid and normal models. Transition material can extend into hollow regions
  to support detected internal floors or flanges.
- Synchronized multi-object slicing that processes layer `n` for every model
  before advancing to layer `n + 1`, with independently stored print settings
  for each selected object.
- Optional recoater bed-drop and return motion with configurable Z distance
  and feed rate.
- Non-destructive print-height limiting and slab cropping without scaling or
  deforming the model.
- Saved slicer projects that retain every transformed model, source filename,
  global slicing settings, and per-object settings, with an **Open in Slicer**
  workflow from Jobs Manager.
- Layer-by-layer preview for contours, infill, engraving, skin, and variable
  grid regions, plus solid patterns, closure layers, anchor pads, transition
  layers, transformed model positions, and machine-coordinate overlays.
- Ordered plain-text print-setting reports that list active settings and
  `ON`/`OFF` toggle states for the selected slicing workflow.
- Automatically numbered duplicate model names, a filleted-box primitive, and
  Job Manager sorting by newest date or by name.
- Estimated motion and recoating time derived from generated G-code.
- Acknowledgement-based execution progress, live command status, pause/resume,
  stop handling, and pre-run circular-bed boundary checks.


## System Architecture

OLOS is split into two main applications:

### OLOS Interface

The Vue, TypeScript, Pinia, and Quasar frontend provides model preparation,
slicer settings, 2D/3D G-code preview, job management, live machine controls,
and execution status.

See [OLOS Interface setup and architecture](OLOS_Interface/README.md).

### OLOS Server

The Python backend coordinates FastAPI, WebSocket communication, serial machine
control, job storage, slicing, preview data, and multiprocessing services.

See [OLOS Server setup and architecture](OLOS_Server/README.md).

## Quick Start

### Prerequisites

- Python 3.11.9
- Node.js 20 or newer
- Yarn 1.21 or newer, or npm
- A GRBL-compatible controller configured for the target machine

### 1. Configure the server

Review `OLOS_Server/config.yaml`, especially the machine type, serial port,
baud rate, controller requirement, and machine-specific limits. The matching
FastAPI and WebSocket addresses must also be configured in the interface.

### 2. Start the server

```powershell
cd OLOS_Server
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python src/main.py
```

The FastAPI documentation is available at
`http://localhost:8000/docs/` when the default port is used.

### 3. Start the interface

```powershell
cd OLOS_Interface
yarn
yarn dev
```

The development interface is available at `http://localhost:9000` by default.

## Printing Safety

- Regenerate G-code after changing slicer code or settings; existing `.nc`
  files do not update automatically.
- Inspect the slice preview, layer-zone comments, laser power/feed values,
  machine routine, and bed-boundary result before execution.
- Run an unpowered dry-motion test after changing offsets, recoater moves,
  laser-state formatting, or controller configuration.
- The development report records faint laser trails during some `S0` travel
  behavior on real hardware. Confirm that `M3`, `M5`, and travel commands behave
  safely with the connected laser controller before enabling power.
- Keep physical emergency-stop access available during machine testing.

Raw STL and G-code files do not contain OLOS project configuration. Save an
`.olos-project.json` file, or load a job with an associated saved project, to
restore model transforms and per-object print settings.

## Contributors

OLOS is developed by
[InMachines Ingrassia GmbH](https://www.inmachines.net/) for the
[Open Lab Starter Kit](https://www.inmachines.net/open-lab-starter-kit).

Original software development:

- [Daniele Ingrassia](https://www.linkedin.com/in/danieleingrassia/)
- [Sulaiman Tanbari](https://www.linkedin.com/in/mohammad-sulaiman-tanbari/)

Metal 3D printer workflow and slicer development:

- [Dharunjay Tiwari](https://www.linkedin.com/in/dharunjay-tiwari-30b7a9234/)

The OLSK project is developed for the
[dtec.bw Fab City project](https://dtecbw.de/home/forschung/hsu/projekt-fabcity)
at [Fab City Hamburg](https://www.fabcity.hamburg/en/).

## Contact

- [daniele@inmachines.net](mailto:daniele@inmachines.net)
- [InMachines](https://www.inmachines.net/)
- [Dharunjay](mailto:dharunjay14@gmail.com)

## License

This software is licensed under the
[GNU General Public License v3.0](LICENSE.txt).
