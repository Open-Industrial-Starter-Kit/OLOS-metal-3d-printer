"""
Shared methods for slicers — V2 PATCH.

Adds on top of V1:
- Intermediate-layer zone (first / intermediate, then base settings)
- Routine injection BETWEEN layers (configurable — skip for first N layers)
- Tighter boundary clamping (margin = 0 by default — fixes infill shift)
- Configurable bed offset header (G53 X-... Y-... + G92 X0 Y0)
"""

import re
import numpy as np
from core.constants import CoreConstants as constants
from utils.websocket_json_data import WebsocketJsonData


# ============================================================================
# DEFAULT OLSK MACHINE CONSTANTS
# These can be overridden by slicing_data if the frontend sends them.
# ============================================================================

DEFAULT_BED_OFFSET_X = -238.5
DEFAULT_BED_OFFSET_Y = -158
DEFAULT_PARKING_X = -395.5
DEFAULT_PARKING_Y = -4.5
DEFAULT_POWDER_FEED = -0.3
DEFAULT_POWDER_FEED_RATE = 50
DEFAULT_RECOATER_OUT = -405
DEFAULT_RECOATER_HOME = -4.5
DEFAULT_RECOATER_FEED = 1500
DEFAULT_PARKING_FEED = 5000


# ============================================================================
# Per-zone exposure resolution (first / intermediate, then base settings)
# ============================================================================

def get_zone_exposure(layer_index, total_layers, slicing_data):
    """
    Determine which exposure zone the current layer belongs to:
    first or intermediate. Falls back to base contour/infill settings if
    no zone settings are provided.

    Zone counts use plain layer indices (0-based) where layer_index = 0 is
    the bottom-most layer.

    Returns:
        dict with infill_power, infill_speed, contour_power, contour_speed
    """
    first_count = int(slicing_data.get('first_layers_count', 0) or 0)
    interm_count = int(slicing_data.get('intermediate_layers_count', 0) or 0)
    interm_enabled = bool(slicing_data.get('intermediate_zone_enabled', False))

    in_first_zone = first_count > 0 and layer_index < first_count

    if interm_enabled and interm_count > 0:
        interm_start = first_count
        interm_end = first_count + interm_count
        in_interm_zone = interm_start <= layer_index < interm_end
    else:
        in_interm_zone = False

    if in_first_zone:
        return {
            'infill_power':  int(slicing_data.get('first_infill_power',  slicing_data['infill_power'])),
            'infill_speed':  int(slicing_data.get('first_infill_speed',  slicing_data['infill_speed'])),
            'contour_power': int(slicing_data.get('first_contour_power', slicing_data['contour_power'])),
            'contour_speed': int(slicing_data.get('first_contour_speed', slicing_data['contour_speed'])),
        }
    if in_interm_zone:
        return {
            'infill_power':  int(slicing_data.get('intermediate_infill_power',  slicing_data['infill_power'])),
            'infill_speed':  int(slicing_data.get('intermediate_infill_speed',  slicing_data['infill_speed'])),
            'contour_power': int(slicing_data.get('intermediate_contour_power', slicing_data['contour_power'])),
            'contour_speed': int(slicing_data.get('intermediate_contour_speed', slicing_data['contour_speed'])),
        }
    return {
        'infill_power':  int(slicing_data['infill_power']),
        'infill_speed':  int(slicing_data['infill_speed']),
        'contour_power': int(slicing_data['contour_power']),
        'contour_speed': int(slicing_data['contour_speed']),
    }


# ============================================================================
# Bed-offset header — replaces the simple init commands
# ============================================================================

def generate_init_block(slicing_data):
    """
    Generate the OLSK machine initialisation block at the start of the G-code:
        G1 F5000
        G53 X-238.5 Y-158
        G92 X0 Y0
        G92 X0 Y0
    """
    bed_x = float(slicing_data.get('bed_offset_x', DEFAULT_BED_OFFSET_X))
    bed_y = float(slicing_data.get('bed_offset_y', DEFAULT_BED_OFFSET_Y))
    parking_feed = int(slicing_data.get('parking_feed', DEFAULT_PARKING_FEED))

    return (
        f"G1 F{parking_feed}\n"
        f"G53 X{bed_x} Y{bed_y}\n"
        "G92 X0 Y0\n"
        "G92 X0 Y0\n\n"
    )


# ============================================================================
# Routine injection — powder feed + recoater sweep + return to tile origin
# ============================================================================

def generate_routine_block(slicing_data, next_z):
    """
    Generate the OLSK layer routine: powder feed → recoater sweep → return.
    The Z step uses the current layer height (so 0.075 follows the user's setting).

    Output matches the reference ROUTINE75.nc.txt structure exactly.
    """
    bed_x = float(slicing_data.get('bed_offset_x', DEFAULT_BED_OFFSET_X))
    bed_y = float(slicing_data.get('bed_offset_y', DEFAULT_BED_OFFSET_Y))
    parking_x = float(slicing_data.get('parking_x', DEFAULT_PARKING_X))
    parking_y = float(slicing_data.get('parking_y', DEFAULT_PARKING_Y))
    powder_feed = float(slicing_data.get('powder_feed', DEFAULT_POWDER_FEED))
    powder_feed_rate = int(slicing_data.get('powder_feed_rate', DEFAULT_POWDER_FEED_RATE))
    recoater_out = float(slicing_data.get('recoater_out', DEFAULT_RECOATER_OUT))
    recoater_home = float(slicing_data.get('recoater_home', DEFAULT_RECOATER_HOME))
    recoater_feed = int(slicing_data.get('recoater_feed', DEFAULT_RECOATER_FEED))
    parking_feed = int(slicing_data.get('parking_feed', DEFAULT_PARKING_FEED))

    # After G92 Z0 resets the coordinate origin to the current physical
    # position, we must only step UP by one layer height — not by next_z
    # (the cumulative absolute height). Using next_z here would compound:
    # each routine would overshoot by more than the previous one.
    # The sample reference always uses the constant layer height (e.g. 0.075mm).
    layer_height = float(slicing_data.get('layer_height', next_z))
    z_str = f"{round(layer_height, 3):.3f}"

    return (
        "\n"
        ";reset reserve and z axis before anything\n"
        "G92 A0 \n"
        "G92 Z0\n"
        "\n"
        ";speed for the X and Y parking\n"
        f"G1 F{parking_feed}\n"
        ";safe parking position for X to actuate the recoater\n"
        f"G53 X{parking_x} Y{parking_y}\n"
        "\n"
        ";move z and reserve where they are visible for the test\n"
        f"G1 A{powder_feed} F{powder_feed_rate} \n"
        f"G1 Z{z_str} F{powder_feed_rate}\n"
        "\n"
        "\n"
        ";speed for the recoater motion\n"
        f"G1 F{recoater_feed} \n"
        ";move to left max the recoater\n"
        f"G53 B{recoater_out}\n"
        ";move back recoater to near home position\n"
        f"G53 B{recoater_home}\n"
        "\n"
        f"G1 F{parking_feed}\n"
        f"G53 X{bed_x} Y{bed_y}\n"
        "G92 X0 Y0\n"
        "G92 X0 Y0\n"
        "\n"
    )


# ============================================================================
# Tight boundary clamping — margin=0 by default (fixes infill shift)
# ============================================================================

def clamp_gcode_to_bounds(gcode_content, min_x, min_y, max_x, max_y, margin=0.0):
    """
    Clamp all X and Y coordinates to stay within the model bounding box.
    Default margin is 0 (strict bounds) — this fixes the infill-shift issue
    where the laser scans went 0.05–0.9 mm outside the tile.
    """
    x_lo, x_hi = float(min_x) - margin, float(max_x) + margin
    y_lo, y_hi = float(min_y) - margin, float(max_y) + margin

    def clamp_x(m):
        val = float(m.group(1))
        return f"X{max(x_lo, min(x_hi, val)):.4f}"

    def clamp_y(m):
        val = float(m.group(1))
        return f"Y{max(y_lo, min(y_hi, val)):.4f}"

    gcode_content = re.sub(r'X(-?\d+\.?\d*)', clamp_x, gcode_content)
    gcode_content = re.sub(r'Y(-?\d+\.?\d*)', clamp_y, gcode_content)
    return gcode_content


def ensure_power_moves_have_feedrate(gcode_content, feedrate):
    """
    Add F immediately after S on powered G1 moves when a feedrate is missing,
    matching the compact VisiCut-style S55F2000 format.
    """
    feedrate = int(feedrate)

    def fix_line(line):
        if not re.search(r'\bG0?1\b', line):
            return line
        if 'S' not in line or re.search(r'F-?\d', line):
            return line
        return re.sub(r'\bS(-?\d+\.?\d*)', rf'S\1F{feedrate}', line, count=1)

    return '\n'.join(fix_line(line) for line in gcode_content.split('\n'))


def get_xy_bounds_from_gcode(gcode_content):
    """
    Return local X/Y bounds from G0/G1 moves in a generated contour block.
    """
    xs = []
    ys = []
    current_x = 0.0
    current_y = 0.0

    for line in gcode_content.splitlines():
        if line.lstrip().startswith(';') or not re.search(r'\bG0?1\b', line):
            continue

        x_match = re.search(r'\bX(-?\d+\.?\d*)', line)
        y_match = re.search(r'\bY(-?\d+\.?\d*)', line)
        if x_match:
            current_x = float(x_match.group(1))
        if y_match:
            current_y = float(y_match.group(1))
        if x_match or y_match:
            xs.append(current_x)
            ys.append(current_y)

    if not xs or not ys:
        return None
    return min(xs), min(ys), max(xs), max(ys)


def get_infill_boundary_clearance(infill_settings, min_x, min_y, max_x, max_y):
    """
    Keep raster infill just inside the contour instead of exactly on top of
    the contour path. The value is capped so tiny slices do not collapse.
    """
    if "boundary_clearance" in infill_settings:
        try:
            return max(0.0, float(infill_settings["boundary_clearance"]))
        except (TypeError, ValueError):
            pass

    pixel_size = infill_settings.get("pixel_size", (0, 0))
    try:
        clearance = max(abs(float(pixel_size[0])), abs(float(pixel_size[1]))) * 0.5
    except (TypeError, ValueError, IndexError):
        clearance = 0.0

    width = abs(float(max_x) - float(min_x))
    height = abs(float(max_y) - float(min_y))
    max_clearance = min(width, height) * 0.45
    return min(clearance, max(0.0, max_clearance))


def add_laser_off_lead_in(gcode_content, feedrate):
    """
    Move to the first powered raster point with S0 before burning. Without
    this, the first infill command burns diagonally from the layer origin.
    """
    feedrate = int(feedrate)
    current_x = 0.0
    current_y = 0.0
    output_lines = []
    lead_in_added = False
    last_laser_off_xy_move = False

    for line in gcode_content.split('\n'):
        if (
            not lead_in_added
            and re.search(r'\bG0?1\b', line)
            and re.search(r'\bS(?!0(?:\.0+)?(?:\b|F))-?\d', line)
            and (re.search(r'\bX-?\d', line) or re.search(r'\bY-?\d', line))
        ):
            if not last_laser_off_xy_move:
                x_match = re.search(r'\bX(-?\d+\.?\d*)', line)
                y_match = re.search(r'\bY(-?\d+\.?\d*)', line)
                target_x = float(x_match.group(1)) if x_match else current_x
                target_y = float(y_match.group(1)) if y_match else current_y
                if target_x != current_x or target_y != current_y:
                    output_lines.append(
                        f"G1 X{target_x:.4f} Y{target_y:.4f} S0F{feedrate}")
                    current_x = target_x
                    current_y = target_y
            lead_in_added = True

        output_lines.append(line)

        if re.search(r'\bG0?1\b', line):
            x_match = re.search(r'\bX(-?\d+\.?\d*)', line)
            y_match = re.search(r'\bY(-?\d+\.?\d*)', line)
            if x_match:
                current_x = float(x_match.group(1))
            if y_match:
                current_y = float(y_match.group(1))
            last_laser_off_xy_move = bool(
                re.search(r'\bS0(?:\.0+)?(?:\b|F)', line)
                and (x_match or y_match))
        elif line.strip():
            last_laser_off_xy_move = False

    return '\n'.join(output_lines)


def strip_redundant_laser_off_feedrates(gcode_content):
    """
    Match the compact VisiCut convention: laser-off positioning uses G0...S0
    without feedrate payloads.
    """
    return re.sub(r'^(G0[^\n]*S0(?:\.0+)?)(?:F-?\d+(?:\.\d+)?)',
                  r'\1', gcode_content, flags=re.MULTILINE)


# ============================================================================
# Layer G-code generator — adds M3/M5, optional routine, optional bounds
# ============================================================================

def generate_gcode_for_layer(image_to_gcode_helper, img_infill, svg_contour,
                             contour_settings, infill_settings, z, layer_speed,
                             bounds=None,
                             slicing_data=None,
                             layer_index=0,
                             infill_gcode_override=None,
                             contour_gcode_override=None):
    """
    Generate G-code for one layer:
      - Optional routine block before the layer (skipped for first N if configured)
      - Reset work coordinates (G92 X0 Y0)
      - M3 (laser on)
      - Infill G-code (with bounds clamping)
      - Contour G-code
      - M5 (laser off)
      - Return to work origin (G1 X0 Y0 F5000)
    """

    z_rounded = round(float(z), 3)
    z_str = f"{z_rounded:.3f}"
    layer_gcode = f'G0 X0 Y0 Z{z_str} F{layer_speed}'

    # --- Decide whether to inject routine before this layer ---
    routine_block = ""
    if slicing_data is not None and layer_index > 0:
        no_routine_first = int(slicing_data.get('no_routine_first_layers', 0) or 0)
        if layer_index >= no_routine_first:
            routine_z = (
                float(slicing_data.get("layer_height", z_rounded))
                if slicing_data.get("visicut_style", False)
                else z_rounded
            )
            routine_block = generate_routine_block(slicing_data, routine_z)

    # --- Contour ---
    if contour_gcode_override is not None:
        clean_contour_gcode = contour_gcode_override
    else:
        contour_gcode = image_to_gcode_helper.generate_gcode_for_svg(
            svg_contour, contour_settings)
        clean_contour_gcode = image_to_gcode_helper.modify_gcode_content(contour_gcode)
    clean_contour_gcode = ensure_power_moves_have_feedrate(
        clean_contour_gcode, contour_settings["speed"])
    if bounds is not None:
        min_x, min_y, max_x, max_y = bounds
        clean_contour_gcode = clamp_gcode_to_bounds(
            clean_contour_gcode, min_x, min_y, max_x, max_y, margin=0.0)

    # --- Infill ---
    if infill_gcode_override is not None:
        clean_infill_gcode = infill_gcode_override
    else:
        infill_gcode = image_to_gcode_helper.generate_gcode_for_image(
            img_infill, infill_settings)
        clean_infill_gcode = image_to_gcode_helper.modify_gcode_content(infill_gcode)
    clean_infill_gcode = ensure_power_moves_have_feedrate(
        clean_infill_gcode, infill_settings["speed"])

    contour_bounds = get_xy_bounds_from_gcode(clean_contour_gcode)
    if contour_bounds is not None:
        min_x, min_y, max_x, max_y = contour_bounds
        clearance = get_infill_boundary_clearance(
            infill_settings, min_x, min_y, max_x, max_y)
        clean_infill_gcode = clamp_gcode_to_bounds(
            clean_infill_gcode, min_x, min_y, max_x, max_y, margin=-clearance)
    elif bounds is not None:
        min_x, min_y, max_x, max_y = bounds
        clean_infill_gcode = clamp_gcode_to_bounds(
            clean_infill_gcode, min_x, min_y, max_x, max_y, margin=0.0)
    clean_infill_gcode = add_laser_off_lead_in(
        clean_infill_gcode, infill_settings["speed"])

    parking_feed = int(slicing_data.get('parking_feed', DEFAULT_PARKING_FEED)) if slicing_data else DEFAULT_PARKING_FEED

    if slicing_data and slicing_data.get("visicut_style", False):
        clean_infill_gcode = strip_redundant_laser_off_feedrates(
            clean_infill_gcode)
        clean_contour_gcode = strip_redundant_laser_off_feedrates(
            clean_contour_gcode)
        return (
            routine_block
            + "G92X0Y0\n"
            + "M3" + constants.NEW_LINE
            + clean_infill_gcode + constants.NEW_LINE
            + clean_contour_gcode + constants.NEW_LINE
            + "M5" + constants.NEW_LINE
            + f"G1X0Y0F{parking_feed}" + constants.NEW_LINE
            + constants.NEW_LINE
        )

    return (
        routine_block
        + layer_gcode + constants.NEW_LINE
        + "G92 X0 Y0\n"
        + "M3" + constants.NEW_LINE
        + constants.GCODE_INFILL_LAYER_COMMENT + constants.NEW_LINE
        + clean_infill_gcode + constants.NEW_LINE
        + constants.GCODE_CONTOUR_LAYER_COMMENT + constants.NEW_LINE
        + clean_contour_gcode + constants.NEW_LINE
        + "M5" + constants.NEW_LINE
        + f"G1 X0 Y0 F{parking_feed}" + constants.NEW_LINE
        + constants.NEW_LINE
    )


def send_slicing_progress_to_interface(websocket_write_queue, layer_index, total_layers):
    res = WebsocketJsonData.parse_slicing_progress_to_json(
        layer_index=layer_index, total_layers=total_layers)
    websocket_write_queue.put(
        constants.SLICE_DATA_TYPE,
        constants.MIDDLE_PRIORITY_COMMAND,
        res)


# ============================================================================
# Settings preparation — applies per-zone (3-zone) exposure when layer info given
# ============================================================================

def prepare_contour_settings(slicing_data, layer_index=None, total_layers=None):
    """
    PATCHED: if layer_index and total_layers are provided, applies per-zone power
    (first / intermediate / final). Otherwise falls back to single-power mode.
    """
    if layer_index is not None and total_layers is not None:
        zone = get_zone_exposure(layer_index, total_layers, slicing_data)
        power = zone['contour_power']
        speed = zone['contour_speed']
    else:
        power = slicing_data["contour_power"]
        speed = slicing_data["contour_speed"]

    return {
        'power': power,
        'speed': speed,
        'speedmoves': slicing_data["layer_speed"],
        'origin': (0, 0)
    }


def prepare_infill_settings(slicing_data, image_size, user_image_size,
                            layer_index=None, total_layers=None):
    """
    PATCHED: if layer_index and total_layers are provided, applies per-zone power
    (first / intermediate / final). Otherwise falls back to single-power mode.

    ALSO PATCHED: the offset calculation is removed (set to (0,0)) because the
    original calculation was producing an asymmetric shift that pushed infill
    outside the tile boundary.
    """
    if layer_index is not None and total_layers is not None:
        zone = get_zone_exposure(layer_index, total_layers, slicing_data)
        power = zone['infill_power']
        speed = zone['infill_speed']
    else:
        power = slicing_data["infill_power"]
        speed = slicing_data["infill_speed"]

    return {
        'power': power,
        'speed': speed,
        'speedmoves': slicing_data["layer_speed"],
        'pixel_size': slicing_data["infill_image_pixel_size"],
        'size': user_image_size,
        # PATCH: zero offset prevents the infill-shift bug
        'offset': (0, 0),
        'noise': slicing_data["infill_noise"],
        "inverted": True
    }
