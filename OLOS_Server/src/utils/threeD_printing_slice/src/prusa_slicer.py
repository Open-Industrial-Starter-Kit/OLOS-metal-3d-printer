"""
PrusaSlicer wrapper — V2 PATCH.

On top of V1:
- Uses generate_init_block() for bed offset header
- Passes slicing_data + layer_index to layer generator for routine injection
- Tight boundary clamping
"""

import os
import io
import subprocess
import zipfile
from PIL import Image
import numpy as np
import cv2
from shapely.affinity import translate
from shapely.geometry import (
    LineString, MultiLineString, Polygon, MultiPolygon, GeometryCollection, box
)
from shapely.ops import unary_union
from autotrace import Bitmap, Color, VectorFormat
import xml.etree.ElementTree as ET
from utils.threeD_printing_slice.src.slicers_shared_methods import (
    generate_gcode_for_layer, prepare_contour_settings, prepare_infill_settings,
    send_slicing_progress_to_interface, generate_init_block
)
from utils.tmp_files_manager import TempFilesManager
from utils.image_to_gcode_helper import ImageToGcodeHelper
from core.constants import CoreConstants as constants


class PrusaSlicer:
    def __init__(self):
        self.image_to_gcode_helper = ImageToGcodeHelper()
        tmp_files_manager = TempFilesManager()
        self._zip_tmp_file_path = tmp_files_manager.create_temp_file('.zip')

    @classmethod
    def slice_model(cls, slicing_data, websocket_write_queue):
        slicer = cls()
        slicing_data["visicut_style"] = True
        slice_padding = slicer._slice_padding_for_model(
            slicing_data["model_size"], slicing_data)
        display_pixels_x, display_pixels_y = slicer._display_pixels_for_model(
            slicing_data["model_size"], slicing_data, slice_padding)
        display_width = float(slicing_data["model_size"].y) + 2 * slice_padding
        display_height = float(slicing_data["model_size"].x) + 2 * slice_padding

        prusa_slicer_path = os.path.abspath(
            os.path.join(__file__, "../../slicers/PrusaSlicer/prusa-slicer-console.exe"))

        slicer_cmd = [
            prusa_slicer_path,
            "--export-sla", slicing_data["model_file_path"],
            "--layer-height", str(slicing_data["layer_height"]),
            "--sla-archive-format", "SL1",
            "--center", f"{display_width / 2}, {display_height / 2}",
            "--rotate", "90",
            "--display-pixels-x", str(display_pixels_x),
            "--display-pixels-y", str(display_pixels_y),
            "--display-width", str(display_width),
            "--display-height", str(display_height),
            "--single-instance",
            "--output", slicer._zip_tmp_file_path
        ]

        # OLOS generates its own laser contour/infill from the Prusa slice
        # masks. Prusa-generated supports, pads, and hollowing become extra
        # masks/layers here, which made the preview show stray lower geometry
        # and far more layers than the object needs.
        slicer_cmd += [
            "--hollowing-enable=0",
            "--supports-enable=0",
            "--pad-enable=0",
        ]

        subprocess.run(slicer_cmd, check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        with open(slicing_data["gcode_file_path"], "w") as gcode_file:
            z = 0
            zip_ref = zipfile.ZipFile(slicer._zip_tmp_file_path, 'r')

            png_files = sorted(
                f for f in zip_ref.namelist() if f.lower().endswith('.png'))

            image_size = (
                float(slicing_data["model_size"].x) + 2 * slice_padding,
                float(slicing_data["model_size"].y) + 2 * slice_padding)
            model_image_size = (
                float(slicing_data["model_size"].x),
                float(slicing_data["model_size"].y))
            user_image_size = slicing_data["infill_image_size"] if slicing_data["use_image_size"] else image_size

            model_bounds = (0, 0, model_image_size[0], model_image_size[1])
            total_layers = len(png_files)

            # PATCH (Issue 5): write OLSK init block with bed offset
            gcode_file.write(generate_init_block(slicing_data))

            for i in range(len(png_files)):
                img_infill = zip_ref.open(png_files[i], 'r').read()

                contour_settings = prepare_contour_settings(
                    slicing_data=slicing_data, layer_index=i, total_layers=total_layers)
                infill_settings = prepare_infill_settings(
                    slicing_data=slicing_data, image_size=model_image_size,
                    user_image_size=user_image_size,
                    layer_index=i, total_layers=total_layers)
                spacing = float(slicing_data.get("line_bundle_spacing", 0.2))
                hatch_spacing = float(slicing_data.get(
                    "infill_hatch_spacing", 0) or 0)
                contour_line_count = max(
                    1, int(slicing_data.get("contour_line_count", 1) or 1))
                contour_overlap = max(
                    -1.0, min(1.0, float(slicing_data.get(
                        "contour_infill_overlap", 0.15) or 0.0)))
                infill_settings["boundary_clearance"] = (
                    max(0.0, (contour_line_count - 1) * spacing
                        - contour_overlap * spacing))
                region = slicer._mask_region_from_png(img_infill, image_size)
                region = slicer._remove_slice_padding(
                    region, slice_padding, model_image_size)
                layer_angle = (
                    float(slicing_data.get("infill_angle", 0) or 0)
                    + i * float(slicing_data.get(
                        "hatch_rotation_per_layer", 67) or 0)
                ) % 180
                infill_gcode = slicer._generate_infill_vector_gcode(
                    region=region,
                    infill_settings=infill_settings,
                    angle=layer_angle,
                    line_count=slicing_data.get("infill_line_count", 1),
                    spacing=spacing,
                    hatch_spacing=hatch_spacing,
                    contour_line_count=contour_line_count,
                    allow_boundary_fallback=(contour_overlap >= 0),
                    reverse_scan=(
                        bool(slicing_data.get("optimize_scan_order", True))
                        and i % 2 == 1),
                    optimize_scan_order=bool(
                        slicing_data.get("optimize_scan_order", True)))
                contour_gcode = slicer._generate_contour_vector_gcode(
                    region=region,
                    contour_settings=contour_settings,
                    line_count=contour_line_count,
                    spacing=spacing)

                gcode_content = generate_gcode_for_layer(
                    image_to_gcode_helper=slicer.image_to_gcode_helper,
                    img_infill=None, svg_contour=None,
                    contour_settings=contour_settings, infill_settings=infill_settings,
                    z=z, layer_speed=slicing_data["layer_speed"],
                    bounds=model_bounds,
                    slicing_data=slicing_data,
                    layer_index=i,
                    infill_gcode_override=infill_gcode,
                    contour_gcode_override=contour_gcode)

                z += slicing_data["layer_height"]
                gcode_file.write(gcode_content)
                send_slicing_progress_to_interface(
                    websocket_write_queue=websocket_write_queue,
                    layer_index=i + 1, total_layers=len(png_files))

            if not slicing_data.get("visicut_style", False):
                gcode_file.write(
                    slicer.image_to_gcode_helper.add_end_of_job_commands())

    def _slice_padding_for_model(self, model_size, slicing_data):
        if "slice_padding_mm" in slicing_data:
            return max(0.0, float(slicing_data.get("slice_padding_mm") or 0))

        smaller_dimension = max(
            1.0, min(float(model_size.x), float(model_size.y)))
        return max(2.0, min(5.0, smaller_dimension * 0.12))

    def _display_pixels_for_model(self, model_size, slicing_data, padding=0.0):
        pixels_per_mm = float(slicing_data.get("slice_pixels_per_mm", 15) or 15)
        max_pixels = int(slicing_data.get("slice_max_pixels", 4096) or 4096)
        min_pixels = int(slicing_data.get("slice_min_pixels", 256) or 256)

        def scale(value):
            physical_mm = max(1.0, float(value))
            pixels = int(np.ceil(physical_mm * pixels_per_mm))
            return max(min_pixels, min(max_pixels, pixels))

        return (
            scale(float(model_size.y) + 2 * padding),
            scale(float(model_size.x) + 2 * padding))

    def _remove_slice_padding(self, region, padding, model_image_size):
        if region is None or region.is_empty or padding <= 0:
            return region

        shifted_region = translate(region, xoff=-padding, yoff=-padding)
        model_region = box(0, 0, model_image_size[0], model_image_size[1])
        clipped_region = shifted_region.intersection(model_region)
        if not clipped_region.is_empty:
            return clipped_region
        return shifted_region

    def _mask_region_from_png(self, img_infill, image_size):
        img = Image.open(io.BytesIO(img_infill)).convert("L")
        arr = np.array(img)
        # Prusa SL1 masks use bright pixels for exposed/printable regions.
        # The old raster path inverted these images before power mapping, so
        # keep the same convention here for vector hatches.
        mask = arr > 5
        mask_u8 = (mask.astype(np.uint8)) * 255
        contours, hierarchy = cv2.findContours(
            mask_u8, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
        if hierarchy is None:
            return None

        hierarchy = hierarchy[0]
        height, width = mask.shape
        scale_x = float(image_size[0]) / max(1, width)
        scale_y = float(image_size[1]) / max(1, height)
        polygons = []

        for index, contour in enumerate(contours):
            if hierarchy[index][3] != -1 or len(contour) < 3:
                continue
            exterior = self._contour_to_points(contour, height, scale_x, scale_y)
            holes = []
            child = hierarchy[index][2]
            while child != -1:
                if len(contours[child]) >= 3:
                    holes.append(self._contour_to_points(
                        contours[child], height, scale_x, scale_y))
                child = hierarchy[child][0]

            polygon = Polygon(exterior, holes)
            if not polygon.is_valid:
                polygon = polygon.buffer(0)
            if not polygon.is_empty and polygon.area > 0:
                polygons.append(polygon)

        if not polygons:
            return None
        region = unary_union(polygons)
        simplify_tolerance = min(
            0.05, max(0.01, min(scale_x, scale_y) * 0.75))
        return region.simplify(simplify_tolerance, preserve_topology=True)

    def _contour_to_points(self, contour, image_height, scale_x, scale_y):
        pts = contour.reshape(-1, 2)
        return [(float(x) * scale_x, (image_height - float(y)) * scale_y)
                for x, y in pts]

    def _generate_infill_vector_gcode(self, region, infill_settings, angle,
                                      line_count, spacing, hatch_spacing,
                                      contour_line_count,
                                      allow_boundary_fallback=True,
                                      reverse_scan=False,
                                      optimize_scan_order=True):
        if region is None or region.is_empty:
            return ""

        line_count = self._normalise_line_count(line_count)
        spacing = float(spacing)
        if hatch_spacing and hatch_spacing > 0:
            pitch = max(float(hatch_spacing), spacing * line_count)
        else:
            pitch = max(float(infill_settings["pixel_size"][0]),
                        float(infill_settings["pixel_size"][1]),
                        spacing * line_count)
        clearance = float(infill_settings.get(
            "boundary_clearance",
            max(0, int(contour_line_count or 1) - 1) * spacing))
        clip_region = region.buffer(-clearance, join_style=2, mitre_limit=5)
        has_clearance_region = not clip_region.is_empty
        if not has_clearance_region:
            clip_region = region

        commands = []
        hatch_lines = self._angled_hatch_lines(
            clip_region, angle, pitch, line_count, spacing,
            require_complete_bundle=has_clearance_region)
        hatch_lines = self._order_hatch_lines(
            hatch_lines, reverse_scan, optimize_scan_order)
        for line in hatch_lines:
            coords = list(line.coords)
            if len(coords) < 2:
                continue
            start = coords[0]
            end = coords[-1]
            if start == end:
                continue
            commands.append(
                f"G0X{start[0]:.4f}Y{start[1]:.4f}S0")
            commands.append(
                f"G1X{end[0]:.4f}Y{end[1]:.4f}S{int(infill_settings['power'])}F{int(infill_settings['speed'])}")

        if allow_boundary_fallback and has_clearance_region and line_count > 1:
            loose_clearance = max(spacing * 0.25, clearance * 0.5)
            loose_region = region.buffer(
                -loose_clearance, join_style=2, mitre_limit=5)
            if not loose_region.is_empty:
                fallback_region = loose_region.difference(
                    clip_region.buffer(spacing * 0.1))
                fallback_lines = self._angled_hatch_lines(
                    fallback_region, angle, pitch, line_count, spacing,
                    require_complete_bundle=False)
                fallback_lines = self._order_hatch_lines(
                    fallback_lines, reverse_scan, optimize_scan_order)
                for line in fallback_lines:
                    coords = list(line.coords)
                    if len(coords) < 2:
                        continue
                    start = coords[0]
                    end = coords[-1]
                    if start == end:
                        continue
                    commands.append(
                        f"G0X{start[0]:.4f}Y{start[1]:.4f}S0")
                    commands.append(
                        f"G1X{end[0]:.4f}Y{end[1]:.4f}S{int(infill_settings['power'])}F{int(infill_settings['speed'])}")
        return "\n".join(commands)

    def _generate_contour_vector_gcode(self, region, contour_settings,
                                       line_count, spacing):
        if region is None or region.is_empty:
            return ""

        commands = []
        for contour in self._offset_contour_lines(region, line_count, spacing):
            if len(contour) < 2:
                continue
            start = contour[0]
            commands.append(
                f"G0X{start[0]:.4f}Y{start[1]:.4f}S0")
            first_powered_move = True
            for pt in contour[1:]:
                if first_powered_move:
                    commands.append(
                        f"G1X{pt[0]:.4f}Y{pt[1]:.4f}S{int(contour_settings['power'])}F{int(contour_settings['speed'])}")
                    first_powered_move = False
                    continue
                commands.append(
                    f"G1X{pt[0]:.4f}Y{pt[1]:.4f}")
        return "\n".join(commands)

    def _angled_hatch_lines(self, region, angle, pitch, line_count, spacing,
                            require_complete_bundle=True):
        if region is None or region.is_empty:
            return []

        theta = np.radians(float(angle))
        direction = np.array([np.cos(theta), np.sin(theta)])
        normal = np.array([-direction[1], direction[0]])
        min_x, min_y, max_x, max_y = region.bounds
        corners = np.array([
            [min_x, min_y], [min_x, max_y],
            [max_x, min_y], [max_x, max_y],
        ])
        projections = corners @ normal
        line_length = float(np.hypot(max_x - min_x, max_y - min_y)) + pitch * 4
        center = np.array([(min_x + max_x) / 2, (min_y + max_y) / 2])
        center_projection = float(center @ normal)
        base_offsets = np.arange(
            np.floor(projections.min() / pitch) * pitch,
            np.ceil(projections.max() / pitch) * pitch + pitch,
            pitch)
        lines = []
        bundle_offsets = self._line_offsets(line_count, spacing)
        min_segment_length = max(float(spacing) * 0.25, 1e-6)

        for base_offset in base_offsets:
            bundle_lines = []
            is_complete_bundle = True

            for bundle_offset in bundle_offsets:
                target_projection = base_offset + bundle_offset
                point = center + normal * (
                    target_projection - center_projection)
                raw_line = LineString([
                    tuple(point - direction * line_length),
                    tuple(point + direction * line_length),
                ])
                clipped_lines = [
                    line for line in self._extract_lines(
                        raw_line.intersection(region))
                    if line.length >= min_segment_length
                ]
                if not clipped_lines:
                    is_complete_bundle = False
                    if require_complete_bundle:
                        break
                    continue
                bundle_lines.extend(clipped_lines)

            if bundle_lines and (is_complete_bundle or not require_complete_bundle):
                lines.extend(bundle_lines)

        return lines

    def _order_hatch_lines(self, lines, reverse_scan=False,
                           optimize_scan_order=True):
        if not lines:
            return []

        ordered = list(reversed(lines)) if reverse_scan else list(lines)
        if not optimize_scan_order:
            return ordered

        optimized = []
        for index, line in enumerate(ordered):
            coords = list(line.coords)
            if len(coords) < 2:
                optimized.append(line)
                continue
            should_reverse = (index % 2 == 1) ^ bool(reverse_scan)
            optimized.append(
                LineString(list(reversed(coords))) if should_reverse else line)
        return optimized

    def _offset_contour_lines(self, region, line_count, spacing):
        out = []
        for index in range(self._normalise_line_count(line_count)):
            offset_region = region.buffer(
                -index * float(spacing), join_style=2, mitre_limit=5)
            for poly in self._extract_polygons(offset_region):
                coords = list(poly.exterior.coords)
                if len(coords) > 2:
                    out.append(coords)
                for interior in poly.interiors:
                    coords = list(interior.coords)
                    if len(coords) > 2:
                        out.append(coords)
        return out

    def _extract_lines(self, geometry):
        if geometry.is_empty:
            return []
        if isinstance(geometry, LineString):
            return [geometry]
        if isinstance(geometry, MultiLineString):
            return list(geometry.geoms)
        if isinstance(geometry, GeometryCollection):
            lines = []
            for geom in geometry.geoms:
                lines.extend(self._extract_lines(geom))
            return lines
        return []

    def _extract_polygons(self, geometry):
        if geometry.is_empty:
            return []
        if isinstance(geometry, Polygon):
            return [geometry]
        if isinstance(geometry, MultiPolygon):
            return list(geometry.geoms)
        if isinstance(geometry, GeometryCollection):
            polygons = []
            for geom in geometry.geoms:
                polygons.extend(self._extract_polygons(geom))
            return polygons
        return []

    def _normalise_line_count(self, value):
        return max(1, min(25, int(value or 1)))

    def _line_offsets(self, line_count, spacing):
        return [(index - (line_count - 1) / 2) * float(spacing)
                for index in range(self._normalise_line_count(line_count))]

    def _generate_svg_contour(self, img_infill):
        img = Image.open(io.BytesIO(img_infill))
        bitmap = Bitmap(np.asarray(img.convert('RGB')))
        vector1 = bitmap.trace(
            error_threshold=0.001, corner_threshold=100, filter_iterations=1,
            remove_adjacent_corners=True, noise_removal=1, color_count=2,
            background_color=Color(0, 0, 0))
        root = ET.fromstring(vector1.encode(VectorFormat.SVG))
        ns = {'svg': 'http://www.w3.org/2000/svg'}
        path_element = root.find(".//svg:path", ns)
        if path_element is not None:
            del path_element.attrib['style']
            path_element.set('stroke', 'black')
            path_element.set('fill', 'none')
        return ET.tostring(root)
