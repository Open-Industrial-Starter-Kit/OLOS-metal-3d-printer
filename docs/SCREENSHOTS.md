# Screenshots and imagery

## Interface

Screenshots of the OLOS interface running the metal printing workflow,
captured at 1680×1400 with a 2× device pixel ratio.

| Image | Shows |
|---|---|
| [`images/ui/01-machine-controls.png`](images/ui/01-machine-controls.png) | Jog and homing, powder system axes, reservoir and recoater moves, feed/power overrides |
| [`images/ui/02-machine-controls-lower.png`](images/ui/02-machine-controls-lower.png) | Lower half of the controls page |
| [`images/ui/03-slicing-workspace.png`](images/ui/03-slicing-workspace.png) | 3D slicing view: build platform, model tools, slice action |
| [`images/ui/04-printing-settings-top.png`](images/ui/04-printing-settings-top.png) | Printing Settings: slicing profile, slicer type, configuration sections |
| [`images/ui/05-preparation-anchor-flange-transition.png`](images/ui/05-preparation-anchor-flange-transition.png) | Sacrificial anchor pad, transition layers and internal flange support, remaining-layers mode |
| [`images/ui/06-layer-settings.png`](images/ui/06-layer-settings.png) | Layer settings |
| [`images/ui/07-contour-wall-settings.png`](images/ui/07-contour-wall-settings.png) | Contour and wall settings |
| [`images/ui/08-infill-settings.png`](images/ui/08-infill-settings.png) | Infill type, hatch angle and per-layer rotation, line bundles, contour overlap, bundle spacing |
| [`images/ui/09-per-zone-exposure.png`](images/ui/09-per-zone-exposure.png) | Per-zone exposure for first, intermediate and remaining layers |
| [`images/ui/10-machine-routine.png`](images/ui/10-machine-routine.png) | Machine routine settings |

### Reproducing these

No machine and no Python backend are required. `config.yaml` is served by the
frontend itself, so the slicing UI renders standalone; a small mock websocket
is enough to put the interface into its connected `IDLE` state and keep the
"Disconnected" modal from covering every page.

```bash
# 1. frontend
cd OLOS_Interface
npm install
npm run dev                  # http://localhost:9000

# 2. mock backend on ws://localhost:8887
#    accept the connection, then repeat a MACHINE_STATUS message:
#    {"type": "MACHINE_CONNECTION", "success": true}
#    {"type": "MACHINE_STATUS", "state": "Idle",
#     "machine_position": {"x": 0, "y": 0, "z": 0},
#     "work_coordinate_offset": {"x": 0, "y": 0, "z": 0},
#     "buffer_state": {"commands_queued": 0, "buffer_length": 128}}
```

Then open <http://localhost:9000> and capture by hand, or drive a headless
browser against it.

`OLOS_Server` is not needed for interface screenshots. It is a heavy,
Windows-oriented stack (torch, PyQt5, pywin32, WMI, openvino) and expects a
serial-connected controller. Saved slicing profiles do live server-side, so
the browser console logs "Error listing slicing profiles" when the backend is
absent; the settings UI itself is unaffected.

## Machine, process and results

| Image | Shows |
|---|---|
| [`images/machine/machine-architecture-labelled.png`](images/machine/machine-architecture-labelled.png) | Labelled architecture: galvo scanner, laser diode, gantry, reserve and printing cylinder |
| [`images/machine/machine-cad-gantry.png`](images/machine/machine-cad-gantry.png) | CAD render of the gantry machine |
| [`images/machine/machine-enclosure.png`](images/machine/machine-enclosure.png) | Enclosure |
| [`images/machine/powder-cylinders-cad.png`](images/machine/powder-cylinders-cad.png) | CAD render of the powder cylinders |
| [`images/machine/powder-cylinder-assembly.png`](images/machine/powder-cylinder-assembly.png) | Powder cylinder assembly |
| [`images/machine/build-platform-cylinders.png`](images/machine/build-platform-cylinders.png) | Build platform with both cylinders and the laser head above |
| [`images/machine/gantry-build-area.png`](images/machine/gantry-build-area.png) | Gantry over the build area |
| [`images/machine/laser-in-action.png`](images/machine/laser-in-action.png) | Laser melting powder, seen through the protective window |
| [`images/machine/result-metal-benchy.png`](images/machine/result-metal-benchy.png) | Printed 316L 3DBenchy on the build plate |
| [`images/machine/result-test-coupons.png`](images/machine/result-test-coupons.png) | Test coupon array |
| [`images/machine/result-printed-parts.png`](images/machine/result-printed-parts.png) | Printed parts, close up |
| [`images/machine/olos-slicing-benchy.png`](images/machine/olos-slicing-benchy.png) | OLOS slicing a Benchy, with estimated print time |
| [`images/machine/olos-slicing-vase.png`](images/machine/olos-slicing-vase.png) | OLOS slicing a spiral vase |
| [`images/machine/olos-ui-collage.png`](images/machine/olos-ui-collage.png) | Collage of interface panels |
| [`images/machine/olos-in-use.png`](images/machine/olos-in-use.png) | The software in use |
| [`images/machine/publication-procedia-cirp.png`](images/machine/publication-procedia-cirp.png) | Procedia CIRP, "Towards an Open source Metal 3D Printer" |
| [`images/machine/thesis-316l-lpbf.png`](images/machine/thesis-316l-lpbf.png) | Thesis, process parameter development for 316L LPBF |
| [`images/machine/slide-full-page.png`](images/machine/slide-full-page.png) | Open Industrial Starter Kit (2025–2026) overview slide |

These come from the dtec.bw final-meeting presentation on the Open Industrial
Starter Kit and carry InMachines, OpenLab Hamburg, HSU, dtec.bw and EU
funding branding. Check attribution requirements before reusing them outside
this project.
