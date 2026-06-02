"""
PySlm slicer — V2 PATCH.

On top of V1:
- Uses generate_init_block() for bed offset header (Issue 5)
- Passes slicing_data + layer_index to layer generator for routine injection
- Sets hatchAngle / stripeAngle / islandAngle for the angle parameter
- Tight boundary clamping (no margin)
"""

import io
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import pyslm
from pyslm import hatching as hatching
from shapely.geometry import LineString, MultiLineString, Polygon, MultiPolygon, GeometryCollection
from shapely.ops import unary_union
from utils.threeD_printing_slice.src.slicers_shared_methods import (
    generate_gcode_for_layer, prepare_contour_settings, prepare_infill_settings,
    send_slicing_progress_to_interface, generate_init_block
)
from utils.image_to_gcode_helper import ImageToGcodeHelper
from core.constants import CoreConstants as constants


class Pyslm:
    def __init__(self):
        self.image_to_gcode_helper = ImageToGcodeHelper()

    @classmethod
    def slice_model(cls, slicing_data, websocket_write_queue):
        slicer = cls()

        solidPart = pyslm.Part('Model')
        solidPart.setGeometry(slicing_data["model_file_path"], fixGeometry=False)
        solidPart.dropToPlatform()

        infill = slicer._setup_hatching_pattern(slicing_data["hatching_settings"])

        with open(slicing_data["gcode_file_path"], "w") as gcode_file:
            user_layer_height = slicing_data["layer_height"]
            lowest_point_z = solidPart.boundingBox[2]
            highest_point_z = solidPart.boundingBox[5]

            global_geom = solidPart.getVectorSlice(
                (highest_point_z + lowest_point_z) / 2)
            global_layer = infill.hatch(global_geom)

            _, _, min_x, min_y, max_x, max_y, global_image_size = (
                slicer._extract_layer_geometry_info(global_layer))

            output_image_size = slicer._normalise_image_size(
                slicing_data["infill_image_size"]
                if slicing_data["use_image_size"] else global_image_size)
            model_bounds = (0, 0, output_image_size[0], output_image_size[1])

            total_layers = max(1, int(round(
                (highest_point_z - 0) / user_layer_height)))

            # PATCH (Issue 5): write OLSK init block with bed offset
            gcode_file.write(generate_init_block(slicing_data))

            layer_index = 0
            for z in np.arange(0, highest_point_z, user_layer_height):
                infill_gcode, contour_gcode, infill_settings, contour_settings = (
                    slicer._slice_layer(
                        solidPart=solidPart, infill=infill,
                        z=z + lowest_point_z,
                        slicing_data=slicing_data,
                        min_x=min_x, min_y=min_y, max_x=max_x, max_y=max_y,
                        image_size=output_image_size,
                        layer_index=layer_index,
                        total_layers=total_layers))

                if contour_gcode and infill_gcode:
                    gcode_content = generate_gcode_for_layer(
                        image_to_gcode_helper=slicer.image_to_gcode_helper,
                        img_infill=None, svg_contour=None,
                        contour_settings=contour_settings,
                        infill_settings=infill_settings,
                        z=z, layer_speed=slicing_data["layer_speed"],
                        bounds=model_bounds,
                        slicing_data=slicing_data,
                        layer_index=layer_index,
                        infill_gcode_override=infill_gcode,
                        contour_gcode_override=contour_gcode)
                    gcode_file.write(gcode_content)

                send_slicing_progress_to_interface(
                    websocket_write_queue,
                    layer_index=int(round(z / user_layer_height)) + 1,
                    total_layers=int(round(solidPart.boundingBox[5] / user_layer_height)))
                layer_index += 1

            gcode_file.write(slicer.image_to_gcode_helper.add_end_of_job_commands())

    def _setup_hatching_pattern(self, hatching_settings):
        infill = None
        angle = float(hatching_settings["infill_angle"])

        if hatching_settings["infill_type"] == "Basic":
            infill = hatching.Hatcher()
        elif hatching_settings["infill_type"] == "Strip":
            infill = hatching.StripeHatcher()
            infill.stripeWidth = hatching_settings["infill_strip_width"]
        elif hatching_settings["infill_type"] == "Island":
            infill = hatching.IslandHatcher()
            infill.islandWidth = hatching_settings["infill_island_width"]
            infill.islandOverlap = hatching_settings["infill_island_overlap"]
            infill.islandOffset = hatching_settings["infill_island_offset"]

        # PATCH (Issue 6): apply angle on all rotation properties so it actually works
        infill.hatchAngle = angle
        if hasattr(infill, 'stripeAngle'):
            infill.stripeAngle = angle
        if hasattr(infill, 'islandAngle'):
            infill.islandAngle = angle

        infill.volumeOffsetHatch = hatching_settings["infill_volume_offset"]
        infill.spotCompensation = hatching_settings["infill_spot_compensation"]
        infill.numInnerContours = hatching_settings["infill_inner_contour"]
        infill.numOuterContours = hatching_settings["infill_outer_contour"]

        return infill

    def _slice_layer(self, solidPart, infill, z, slicing_data,
                     min_x, min_y, max_x, max_y, image_size,
                     layer_index=None, total_layers=None):
        geomSliceVector = solidPart.getVectorSlice(z)
        layer = infill.hatch(geomSliceVector)

        infill_gcode, contour_gcode = None, None
        user_image_size = image_size

        if layer:
            hatchGeoms = layer.getHatchGeometry()
            hatchContours = layer.getContourGeometry()

            if slicing_data["use_image_size"]:
                user_image_size = self._normalise_image_size(
                    slicing_data["infill_image_size"])

            contour_settings = prepare_contour_settings(
                slicing_data=slicing_data, layer_index=layer_index, total_layers=total_layers)
            infill_settings = prepare_infill_settings(
                slicing_data=slicing_data, image_size=image_size,
                user_image_size=user_image_size,
                layer_index=layer_index, total_layers=total_layers)

            if hatchGeoms:
                infill_gcode = self._generate_infill_vector_gcode(
                    hatchGeoms, hatchContours, min_x, min_y, max_x, max_y,
                    image_size, infill_settings,
                    slicing_data.get("infill_line_count", 1),
                    slicing_data.get("line_bundle_spacing", 0.2))
            if hatchContours:
                contour_gcode = self._generate_contour_vector_gcode(
                    hatchContours, min_x, min_y, max_x, max_y, image_size,
                    contour_settings,
                    slicing_data.get("contour_line_count", 1),
                    slicing_data.get("line_bundle_spacing", 0.2))
        else:
            contour_settings = prepare_contour_settings(
                slicing_data=slicing_data, layer_index=layer_index, total_layers=total_layers)
            infill_settings = prepare_infill_settings(
                slicing_data=slicing_data, image_size=image_size,
                user_image_size=user_image_size,
                layer_index=layer_index, total_layers=total_layers)

        return infill_gcode, contour_gcode, infill_settings, contour_settings

    def _extract_layer_geometry_info(self, layer):
        hatchGeoms = layer.getHatchGeometry()
        hatchContours = layer.getContourGeometry()
        min_x, min_y, max_x, max_y = self._get_global_bounds(hatchGeoms, hatchContours)
        image_size = self._compute_image_size_from_bounds(min_x, min_y, max_x, max_y)
        return hatchGeoms, hatchContours, min_x, min_y, max_x, max_y, image_size

    def _generate_infill_vector_gcode(self, hatchGeoms, hatchContours,
                                      min_x, min_y, max_x, max_y, image_size,
                                      infill_settings, line_count, spacing):
        scale_x, scale_y = self._calculate_scale_factor(
            min_x, min_y, max_x, max_y, image_size)
        clip_region = self._contour_region(hatchContours)
        line_count = self._normalise_line_count(line_count)
        spacing = float(spacing)
        lines = []

        for line in self._expanded_hatch_lines(
                hatchGeoms, clip_region, line_count, spacing):
            coords = list(line.coords)
            if len(coords) < 2:
                continue
            start = self._scale_point(coords[0], min_x, min_y, scale_x, scale_y)
            end = self._scale_point(coords[-1], min_x, min_y, scale_x, scale_y)
            if start == end:
                continue
            lines.append(
                f"G1 X{start[0]:.4f} Y{start[1]:.4f} S0F{int(infill_settings['speed'])}")
            lines.append(
                f"G1 X{end[0]:.4f} Y{end[1]:.4f} S{int(infill_settings['power'])}F{int(infill_settings['speed'])}")

        return "\n".join(lines)

    def _generate_contour_vector_gcode(self, hatchContours,
                                       min_x, min_y, max_x, max_y, image_size,
                                       contour_settings, line_count, spacing):
        scale_x, scale_y = self._calculate_scale_factor(
            min_x, min_y, max_x, max_y, image_size)
        line_count = self._normalise_line_count(line_count)
        spacing = float(spacing)
        lines = []

        for contour in self._offset_contour_lines(hatchContours, line_count, spacing):
            pts = [self._scale_point(p, min_x, min_y, scale_x, scale_y)
                   for p in contour]
            if len(pts) < 2:
                continue
            start = pts[0]
            lines.append(
                f"G1 X{start[0]:.4f} Y{start[1]:.4f} S0F{int(contour_settings['speed'])}")
            for pt in pts[1:]:
                lines.append(
                    f"G1 X{pt[0]:.4f} Y{pt[1]:.4f} S{int(contour_settings['power'])}F{int(contour_settings['speed'])}")

        return "\n".join(lines)

    def _expanded_hatch_lines(self, hatchGeoms, clip_region, line_count, spacing):
        hatches = np.vstack([h.coords.reshape(-1, 2, 2) for h in hatchGeoms])
        offsets = self._line_offsets(line_count, spacing)
        out = []

        for seg in hatches:
            (x1, y1), (x2, y2) = seg
            dx = x2 - x1
            dy = y2 - y1
            length = float(np.hypot(dx, dy))
            if length == 0:
                continue
            nx = -dy / length
            ny = dx / length

            for offset in offsets:
                line = LineString([
                    (x1 + nx * offset, y1 + ny * offset),
                    (x2 + nx * offset, y2 + ny * offset),
                ])
                clipped = line.intersection(clip_region) if clip_region else line
                out.extend(self._extract_lines(clipped))

        return out

    def _offset_contour_lines(self, contours, line_count, spacing):
        region = self._contour_region(contours)
        if not region:
            return []

        out = []
        for index in range(line_count):
            offset_region = region.buffer(
                -index * spacing, join_style=2, mitre_limit=5)
            for poly in self._extract_polygons(offset_region):
                coords = list(poly.exterior.coords)
                if len(coords) > 2:
                    out.append(coords)
        return out

    def _contour_region(self, contours):
        polygons = []
        for pts in self._raw_contour_points(contours):
            if len(pts) < 3:
                continue
            polygon = Polygon(pts)
            if not polygon.is_valid:
                polygon = polygon.buffer(0)
            if not polygon.is_empty:
                polygons.append(polygon)
        if not polygons:
            return None
        return unary_union(polygons)

    def _raw_contour_points(self, contours):
        return [np.array(c.coords).tolist() for c in contours]

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
        return max(1, min(10, int(value or 1)))

    def _line_offsets(self, line_count, spacing):
        return [(index - (line_count - 1) / 2) * spacing
                for index in range(line_count)]

    def _scale_point(self, point, min_x, min_y, scale_x, scale_y):
        x, y = point
        return ((x - min_x) * scale_x, (y - min_y) * scale_y)

    def _generate_infill_raster_image(self, hatchGeoms, hatchContours, min_x, min_y, max_x, max_y, image_size, resolution):
        scaled_size = (min((image_size[0] * resolution), 5000),
                       min((image_size[1] * resolution), 5000))
        scale_x, scale_y = self._calculate_scale_factor(min_x, min_y, max_x, max_y, scaled_size)
        img = Image.new("RGB", scaled_size, "black")
        draw = ImageDraw.Draw(img)
        for line_points in self._modified_hatches_lines(hatchGeoms, min_x, min_y, scale_x, scale_y):
            draw.line(line_points, fill='white', width=1)
        img = self._clip_infill_to_contours(
            img, hatchContours, min_x, min_y, scale_x, scale_y)
        bio = io.BytesIO()
        img.save(bio, format='PNG')
        return bio.getvalue()

    def _clip_infill_to_contours(self, img, contours, min_x, min_y, scale_x, scale_y):
        if not contours:
            return img

        mask = Image.new("L", img.size, 0)
        mask_draw = ImageDraw.Draw(mask)
        for pts in self._modified_contour_line(contours, min_x, min_y, scale_x, scale_y):
            if len(pts) > 2:
                mask_draw.polygon(pts, fill=255)

        # Keep the hatch very slightly inside the contour so raster resizing
        # cannot smear powered pixels over the contour edge.
        mask = mask.filter(ImageFilter.MinFilter(3))
        return Image.composite(img, Image.new("RGB", img.size, "black"), mask)

    def _generate_contour_svg(self, hatchContours, min_x, min_y, max_x, max_y, image_size):
        scale_x, scale_y = self._calculate_scale_factor(min_x, min_y, max_x, max_y, image_size)
        svg = ET.Element('svg', xmlns="http://www.w3.org/2000/svg",
                         width=str(image_size[0]), height=str(image_size[1]))
        for pts in self._modified_contour_line(hatchContours, min_x, min_y, scale_x, scale_y):
            path = self._create_path_from_coords(pts)
            ET.SubElement(svg, 'path', d=path, fill="none", stroke='black', stroke_width=str(0.1))
        return ET.tostring(svg, encoding='utf-8')

    def _compute_image_size_from_bounds(self, min_x, min_y, max_x, max_y):
        return (max(1, int(np.ceil(max_x - min_x))),
                max(1, int(np.ceil(max_y - min_y))))

    def _create_path_from_coords(self, coords):
        if not coords:
            return ""
        closed_coords = list(coords)
        if len(closed_coords) > 2 and closed_coords[0] != closed_coords[-1]:
            closed_coords.append(closed_coords[0])
        path = "M " + " L ".join([f"{x:.2f},{y:.2f}" for x, y in closed_coords])
        return path + (" Z" if len(closed_coords) > 2 else "")

    def _calculate_scale_factor(self, min_x, min_y, max_x, max_y, image_size):
        return image_size[0] / (max_x - min_x), image_size[1] / (max_y - min_y)

    def _normalise_image_size(self, image_size):
        return (max(1, int(round(float(image_size[0])))),
                max(1, int(round(float(image_size[1])))))

    def _get_global_bounds(self, hatchGeoms, contourGeoms):
        all_coords = []
        for h in hatchGeoms:
            all_coords.append(h.coords)
        for c in contourGeoms:
            all_coords.append(c.coords)
        all_coords = np.vstack(all_coords)
        min_x, min_y = np.min(all_coords, axis=0)
        max_x, max_y = np.max(all_coords, axis=0)
        return min_x, min_y, max_x, max_y

    def _modified_contour_line(self, contours, min_x, min_y, scale_x, scale_y):
        all_contours = []
        for c in contours:
            coords = np.array(c.coords)
            coords = (coords - [min_x, min_y]) * [scale_x, scale_y]
            all_contours.append([tuple(p) for p in coords])
        return all_contours

    def _modified_hatches_lines(self, hatchGeoms, min_x, min_y, scale_x, scale_y):
        hatches = np.vstack([h.coords.reshape(-1, 2, 2) for h in hatchGeoms])
        out = []
        for seg in hatches:
            pts = []
            for wx, wy in seg:
                pts.append(((wx - min_x) * scale_x, (wy - min_y) * scale_y))
            out.append(pts)
        return out
