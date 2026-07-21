"""
This module provides functionality for slicing 3D models using different slicing backends,
including Slic3r, PrusaSlicer, and PySLM. It selects the appropriate slicer based on 
provided slicing settings and delegates the slicing process accordingly.
"""

from core.constants import CoreConstants as constants
from utils.media_convertor_helper import MediaConvertorHelper
from utils.threeD_printing_slice.src.slic3r import Slic3r
from utils.threeD_printing_slice.src.prusa_slicer import PrusaSlicer
from utils.threeD_printing_slice.src.pyslm import Pyslm


def _extract_zone_settings(slicing_settings):
    """
    Pull optional per-zone exposure and OLSK routine settings from the
    frontend model. The slicers use snake_case keys internally.
    """
    out = {}

    def add(attr, key, caster):
        value = getattr(slicing_settings, attr, None)
        if value is not None:
            out[key] = caster(value)

    add('firstLayersCount', 'first_layers_count', int)
    add('firstZoneEngravingEnabled', 'first_zone_engraving_enabled', bool)
    add('firstInfillPower', 'first_infill_power', int)
    add('firstInfillSpeed', 'first_infill_speed', int)
    add('firstEngravingHatchSpacing', 'first_engraving_hatch_spacing', float)
    add('firstContourPower', 'first_contour_power', int)
    add('firstContourSpeed', 'first_contour_speed', int)

    add('intermediateZoneEnabled', 'intermediate_zone_enabled', bool)
    add('intermediateZoneEngravingEnabled',
        'intermediate_zone_engraving_enabled', bool)
    add('intermediateLayersCount', 'intermediate_layers_count', int)
    add('intermediateInfillPower', 'intermediate_infill_power', int)
    add('intermediateInfillSpeed', 'intermediate_infill_speed', int)
    add('intermediateEngravingHatchSpacing',
        'intermediate_engraving_hatch_spacing', float)
    add('intermediateContourPower', 'intermediate_contour_power', int)
    add('intermediateContourSpeed', 'intermediate_contour_speed', int)

    add('noRoutineFirstLayers', 'no_routine_first_layers', int)
    if getattr(slicing_settings, 'reservoirLiftPerLayer', None) is not None:
        out['powder_feed'] = -abs(float(slicing_settings.reservoirLiftPerLayer))
    if getattr(slicing_settings, 'recoaterFeedRate', None) is not None:
        out['recoater_feed'] = int(slicing_settings.recoaterFeedRate)
    add('bedOffsetX', 'bed_offset_x', float)
    add('bedOffsetY', 'bed_offset_y', float)

    return out


class ThreeDSlice:
    """
    Handles slicing of 3D models using various slicing libraries.
    """

    @classmethod
    def slice_models(cls, model_tmp_file_path,
                     slice_result_tmp_file_path,
                     slice_data,
                     websocket_write_queue):
        """
        Slices the model using the specified slicing library.

        Args:
            model_tmp_file_path (str): Path to temporarily store the input 3D model file.
            slice_result_tmp_file_path (str): Path to store the generated G-code or sliced output.
            slice_data (obj): Contains model data and slicing settings.
            websocket_write_queue (PriorityQueueWithCounter): Queue to communicate slicing progress or results.
        """

        slicer = cls()
        model = MediaConvertorHelper.decode_base64_to_binary(
            slice_data.modelFile)

        # write model data into the model tmp file
        open(model_tmp_file_path, mode='wb').write(model)

        settings = slice_data.slicingSettings
        if settings.slicingLib == constants.SLICING_LIBRARIES['SLIC3R']:
            slicer._use_slic3r(model_tmp_file_path=model_tmp_file_path,
                               slice_result_tmp_file_path=slice_result_tmp_file_path,
                               model_size=slice_data.modelSize,
                               slicing_settings=settings.slic3rSettings,
                               websocket_write_queue=websocket_write_queue)

        elif settings.slicingLib == constants.SLICING_LIBRARIES['PRUSA_SLICER']:
            requested_mode = getattr(settings, 'engravingMode', None)
            if requested_mode is not None:
                settings.prusaSettings.engravingMode = requested_mode
            recoater_feed_rate = getattr(settings, 'recoaterFeedRate', None)
            if recoater_feed_rate is not None:
                settings.prusaSettings.recoaterFeedRate = recoater_feed_rate
            slicer._use_prusa_slicer(
                model_tmp_file_path=model_tmp_file_path,
                slice_result_tmp_file_path=slice_result_tmp_file_path,
                model_size=slice_data.modelSize,
                slicing_settings=settings.prusaSettings,
                websocket_write_queue=websocket_write_queue,
                print_height_lower_limit=getattr(
                    slice_data, 'printHeightLowerLimit', None),
                print_height_limit=getattr(
                    slice_data, 'printHeightLimit', None))

        elif settings.slicingLib == constants.SLICING_LIBRARIES['PYSLM']:
            slicer._use_pyslm_lib(
                model_tmp_file_path=model_tmp_file_path,
                slice_result_tmp_file_path=slice_result_tmp_file_path,
                model_size=slice_data.modelSize,
                slicing_settings=settings.pyslmSettings,
                websocket_write_queue=websocket_write_queue,
                engraving_mode=getattr(
                    settings.pyslmSettings, 'engravingMode', 'vectoring'))

    def _use_slic3r(self, model_tmp_file_path, slice_result_tmp_file_path, model_size, slicing_settings, websocket_write_queue):
        """
        Slices the model using Slic3r.

        Args:
            model_tmp_file_path (str): Path to the input model file.
            slice_result_tmp_file_path (str): Output path for sliced data.
            model_size (tuple): Dimensions of the model.
            slicing_settings (obj): Slic3r-specific settings.
            websocket_write_queue (PriorityQueueWithCounter): Queue for progress or result messages.
        """

        slic3r_data = {
            'model_file_path': model_tmp_file_path,
            'gcode_file_path': slice_result_tmp_file_path,
            'model_size': model_size,
            'layer_height': float(slicing_settings.layerHeight),
            'layer_speed': int(slicing_settings.layerSpeed),
            'infill_power': int(slicing_settings.infillPower),
            'infill_speed': int(slicing_settings.infillSpeed),
            'infill_image_pixel_size': (slicing_settings.infillImageSettings.x,
                                        slicing_settings.infillImageSettings.y),
            'infill_image_size': (slicing_settings.infillImageSettings.width,
                                  slicing_settings.infillImageSettings.height),
            'infill_noise': int(slicing_settings.infillImageSettings.noise),
            'use_image_size': slicing_settings.infillImageSettings.isImageSizeSettings,
            'contour_power': int(slicing_settings.contourPower),
            'contour_speed': int(slicing_settings.contourSpeed),
        }
        slic3r_data.update(_extract_zone_settings(slicing_settings))

        Slic3r.slice_model(slicing_data=slic3r_data,
                           websocket_write_queue=websocket_write_queue)

    def _use_prusa_slicer(self, model_tmp_file_path, slice_result_tmp_file_path,
                          model_size, slicing_settings,
                          websocket_write_queue, print_height_lower_limit=None,
                          print_height_limit=None):
        """
        Slices the model using PrusaSlicer with extended support for hollowing, supports, and pads.

        Args:
            model_tmp_file_path (str): Path to the input model file.
            slice_result_tmp_file_path (str): Output path for sliced data.
            model_size (tuple): Dimensions of the model.
            slicing_settings (obj): PrusaSlicer-specific settings.
            websocket_write_queue (PriorityQueueWithCounter): Queue for progress or result messages.
        """

        solid_mode_enabled = bool(getattr(
            slicing_settings, 'solidModeEnabled', False))
        layer_height = float(slicing_settings.layerHeight)

        prusa_slicer_data = {
            'model_file_path': model_tmp_file_path,
            'gcode_file_path': slice_result_tmp_file_path,
            'model_size': model_size,
            'solid_mode_enabled': solid_mode_enabled,
            'solid_track_width': float(getattr(
                slicing_settings, 'solidTrackWidth', 0.2) or 0.2),
            'solid_close_top_bottom_enabled': bool(getattr(
                slicing_settings, 'solidCloseTopBottomEnabled', False)),
            'solid_close_top_bottom_layers': max(1, int(getattr(
                slicing_settings, 'solidCloseTopBottomLayers', 3) or 3)),
            'solid_close_top_bottom_power': float(getattr(
                slicing_settings, 'solidCloseTopBottomPower', 50) or 0),
            'solid_close_top_bottom_speed': float(getattr(
                slicing_settings, 'solidCloseTopBottomSpeed', 3000) or 3000),
            'solid_close_top_bottom_line_overlap': float(getattr(
                slicing_settings,
                'solidCloseTopBottomLineOverlap', 0) or 0) / 100.0,
            'solid_first_zone_enabled': bool(getattr(
                slicing_settings, 'solidFirstZoneEnabled', False)),
            'solid_first_zone_engraving_enabled': bool(getattr(
                slicing_settings, 'solidFirstZoneEngravingEnabled', True)),
            'solid_first_layers_count': max(1, int(getattr(
                slicing_settings, 'solidFirstLayersCount', 1) or 1)),
            'solid_first_power': float(getattr(
                slicing_settings, 'solidFirstPower', 50) or 0),
            'solid_first_speed': float(getattr(
                slicing_settings, 'solidFirstSpeed', 3000) or 3000),
            'solid_first_engraving_hatch_spacing': float(getattr(
                slicing_settings,
                'solidFirstEngravingHatchSpacing', 0.2) or 0.2),
            'solid_intermediate_zone_enabled': bool(getattr(
                slicing_settings, 'solidIntermediateZoneEnabled', False)),
            'solid_intermediate_zone_engraving_enabled': bool(getattr(
                slicing_settings,
                'solidIntermediateZoneEngravingEnabled', True)),
            'solid_intermediate_layers_count': max(1, int(getattr(
                slicing_settings, 'solidIntermediateLayersCount', 1) or 1)),
            'solid_intermediate_power': float(getattr(
                slicing_settings, 'solidIntermediatePower', 50) or 0),
            'solid_intermediate_speed': float(getattr(
                slicing_settings, 'solidIntermediateSpeed', 3000) or 3000),
            'solid_intermediate_engraving_hatch_spacing': float(getattr(
                slicing_settings,
                'solidIntermediateEngravingHatchSpacing', 0.2) or 0.2),
            'solid_raster_direction': str(getattr(
                slicing_settings, 'solidRasterDirection', 'x') or 'x'),
            'solid_cross_hatch': bool(getattr(
                slicing_settings, 'solidCrossHatch', False)),
            'solid_power': float(getattr(
                slicing_settings, 'solidPower', 50) or 0),
            'solid_speed': float(getattr(
                slicing_settings, 'solidSpeed', 3000) or 3000),
            'solid_contour_overlap': float(getattr(
                slicing_settings, 'solidContourOverlap', 0) or 0) / 100.0,
            'solid_line_overlap': float(getattr(
                slicing_settings, 'solidLineOverlap', 0) or 0) / 100.0,
            'solid_contour_enabled': bool(getattr(
                slicing_settings, 'solidContourEnabled', True)),
            'solid_contour_power': float(getattr(
                slicing_settings, 'solidContourPower', 50) or 0),
            'solid_contour_speed': float(getattr(
                slicing_settings, 'solidContourSpeed', 3000) or 3000),
            'solid_contour_line_count': max(1, int(getattr(
                slicing_settings, 'solidContourLineCount', 3) or 3)),
            'engraving_mode': str(getattr(
                slicing_settings, 'engravingMode', 'vectoring') or 'vectoring'),
            'engraving_acceleration': float(getattr(
                slicing_settings, 'engravingAcceleration', 500) or 500),
            'engraving_contour_thickness': float(getattr(
                slicing_settings, 'engravingContourThickness', 0.8) or 0.8),
            'nominal_vector_track_width': float(getattr(
                slicing_settings, 'nominalVectorTrackWidth', 0.2) or 0.2),
            'match_engraved_shell_to_vector_wall': bool(getattr(
                slicing_settings, 'matchEngravedShellToVectorWall', True)),
            'engraving_raster_direction': str(getattr(
                slicing_settings, 'engravingRasterDirection', 'x') or 'x'),
            'print_height_limit': (
                float(print_height_limit)
                if print_height_limit is not None else None),
            'print_height_lower_limit': (
                float(print_height_lower_limit)
                if print_height_lower_limit is not None else None),
            'layer_height': layer_height,
            'layer_speed': int(slicing_settings.layerSpeed),

            'contour_power': int(slicing_settings.contourPower),
            'contour_speed': int(slicing_settings.contourSpeed),
            'contour_line_count': int(getattr(
                slicing_settings, 'contourLineCount', 1) or 1),
            'auto_contour_line_count_enabled': bool(getattr(
                slicing_settings, 'autoContourLineCountEnabled', False)),

            'infill_power': int(slicing_settings.infillPower),
            'infill_speed': int(slicing_settings.infillSpeed),
            'infill_type': str(getattr(
                slicing_settings, 'infillType', 'Lines') or 'Lines'),
            'infill_angle': float(getattr(
                slicing_settings, 'infillAngle', 0) or 0),
            'hatch_rotation_per_layer': float(getattr(
                slicing_settings, 'hatchRotationPerLayer', 67) or 0),
            'hatch_rotation_grouping_enabled': bool(getattr(
                slicing_settings, 'hatchRotationGroupingEnabled', False)),
            'hatch_rotation_group_layers': max(1, int(getattr(
                slicing_settings, 'hatchRotationGroupLayers', 5) or 5)),
            'infill_line_count': int(getattr(
                slicing_settings, 'infillLineCount', 1) or 1),
            'infill_line_thickness': float(getattr(
                slicing_settings, 'infillLineThickness', 0.8) or 0.8),
            'contour_infill_overlap': float(getattr(
                slicing_settings, 'contourInfillOverlap', 15) or 0) / 100.0,
            'optimize_scan_order': bool(getattr(
                slicing_settings, 'optimizeScanOrder', True)),
            'line_bundle_spacing': float(getattr(
                slicing_settings, 'lineBundleSpacing', 0.2) or 0.2),
            'scanline_spacing': float(getattr(
                slicing_settings, 'scanlineSpacing',
                getattr(slicing_settings, 'infillHatchSpacing', 0.2)) or 0.2),
            'infill_hatch_spacing': float(getattr(
                slicing_settings, 'infillHatchSpacing', 0) or 0),
            'surface_skin_enabled': bool(getattr(
                slicing_settings, 'surfaceSkinEnabled', True)),
            'surface_skin_layers': max(1, int(getattr(
                slicing_settings, 'surfaceSkinLayers', 3) or 3)),
            'surface_skin_engraving_enabled': bool(getattr(
                slicing_settings, 'surfaceSkinEngravingEnabled', False)),
            'surface_skin_hatch_spacing': float(getattr(
                slicing_settings, 'surfaceSkinHatchSpacing', 0.2) or 0.2),
            'surface_skin_power': float(getattr(
                slicing_settings, 'surfaceSkinPower',
                getattr(slicing_settings, 'infillPower', 50)) or 50),
            'surface_skin_speed': float(getattr(
                slicing_settings, 'surfaceSkinSpeed',
                getattr(slicing_settings, 'infillSpeed', 3000)) or 3000),
            'surface_skin_alternate_lines': bool(getattr(
                slicing_settings, 'surfaceSkinAlternateLines', False)),
            'surface_skin_alternate_mode': str(getattr(
                slicing_settings, 'surfaceSkinAlternateMode', 'two-pass') or 'two-pass'),
            'flat_surface_skin_layers': max(1, int(getattr(
                slicing_settings, 'flatSurfaceSkinLayers',
                getattr(slicing_settings, 'surfaceSkinLayers', 3)) or 3)),
            'flat_surface_skin_hatch_spacing': float(getattr(
                slicing_settings, 'flatSurfaceSkinHatchSpacing',
                getattr(slicing_settings, 'surfaceSkinHatchSpacing', 0.2)) or 0.2),
            'flat_surface_skin_hatch_overlap': (
                float(getattr(
                    slicing_settings, 'flatSurfaceSkinHatchOverlap', 0)
                    if getattr(
                        slicing_settings, 'flatSurfaceSkinHatchOverlap', 0)
                    is not None else 0) / 100.0),
            'flat_surface_skin_power': float(getattr(
                slicing_settings, 'flatSurfaceSkinPower',
                getattr(slicing_settings, 'surfaceSkinPower',
                        getattr(slicing_settings, 'infillPower', 50))) or 50),
            'flat_surface_skin_speed': float(getattr(
                slicing_settings, 'flatSurfaceSkinSpeed',
                getattr(slicing_settings, 'surfaceSkinSpeed',
                        getattr(slicing_settings, 'infillSpeed', 3000))) or 3000),
            'flat_surface_skin_raster_direction': str(getattr(
                slicing_settings, 'flatSurfaceSkinRasterDirection',
                'x') or 'x'),
            'flat_surface_skin_cross_hatch': bool(getattr(
                slicing_settings, 'flatSurfaceSkinCrossHatch', False)),
            'flat_surface_skin_pattern': str(getattr(
                slicing_settings, 'flatSurfaceSkinPattern', 'hatch') or 'hatch'),
            'flat_surface_skin_spiral_direction': str(getattr(
                slicing_settings, 'flatSurfaceSkinSpiralDirection',
                'outside-in') or 'outside-in'),
            'flat_surface_skin_boundary_mode': str(getattr(
                slicing_settings, 'flatSurfaceSkinBoundaryMode',
                'engrave') or 'engrave'),
            'flat_surface_skin_contour_line_count': max(1, int(getattr(
                slicing_settings, 'flatSurfaceSkinContourLineCount',
                getattr(slicing_settings, 'contourLineCount', 3)) or 3)),
            'flat_surface_skin_contour_overlap': float(getattr(
                slicing_settings, 'flatSurfaceSkinContourOverlap',
                getattr(slicing_settings, 'contourInfillOverlap', 15)) or 0) / 100.0,
            'flat_surface_skin_second_pass_enabled': bool(getattr(
                slicing_settings, 'flatSurfaceSkinSecondPassEnabled', False)),
            'flat_surface_skin_second_pass_power': float(getattr(
                slicing_settings, 'flatSurfaceSkinSecondPassPower',
                getattr(slicing_settings, 'flatSurfaceSkinPower',
                        getattr(slicing_settings, 'surfaceSkinPower',
                                getattr(slicing_settings, 'infillPower', 50)))) or 50),
            'flat_surface_skin_second_pass_speed': float(getattr(
                slicing_settings, 'flatSurfaceSkinSecondPassSpeed',
                getattr(slicing_settings, 'flatSurfaceSkinSpeed',
                        getattr(slicing_settings, 'surfaceSkinSpeed',
                                getattr(slicing_settings, 'infillSpeed', 3000)))) or 3000),
            'flat_surface_skin_second_pass_hatch_overlap': (
                float(getattr(
                    slicing_settings, 'flatSurfaceSkinSecondPassHatchOverlap',
                    getattr(slicing_settings, 'flatSurfaceSkinHatchOverlap', 0))
                    if getattr(
                        slicing_settings, 'flatSurfaceSkinSecondPassHatchOverlap',
                        getattr(slicing_settings, 'flatSurfaceSkinHatchOverlap', 0))
                    is not None else 0) / 100.0),
            'flat_surface_skin_second_pass_raster_direction': str(getattr(
                slicing_settings, 'flatSurfaceSkinSecondPassRasterDirection',
                getattr(slicing_settings, 'flatSurfaceSkinRasterDirection', 'x')) or 'x'),
            'flat_surface_skin_second_pass_cross_hatch': bool(getattr(
                slicing_settings, 'flatSurfaceSkinSecondPassCrossHatch',
                getattr(slicing_settings, 'flatSurfaceSkinCrossHatch', False))),
            'flat_surface_skin_second_pass_boundary_mode': str(getattr(
                slicing_settings, 'flatSurfaceSkinSecondPassBoundaryMode',
                getattr(slicing_settings, 'flatSurfaceSkinBoundaryMode', 'engrave')) or 'engrave'),
            'flat_surface_skin_second_pass_contour_line_count': max(1, int(getattr(
                slicing_settings, 'flatSurfaceSkinSecondPassContourLineCount',
                getattr(slicing_settings, 'flatSurfaceSkinContourLineCount',
                        getattr(slicing_settings, 'contourLineCount', 3))) or 3)),
            'flat_surface_skin_second_pass_contour_overlap': float(getattr(
                slicing_settings, 'flatSurfaceSkinSecondPassContourOverlap',
                getattr(slicing_settings, 'flatSurfaceSkinContourOverlap',
                        getattr(slicing_settings, 'contourInfillOverlap', 15))) or 0) / 100.0,
            'roof_hollow_infill_enabled': bool(getattr(
                slicing_settings, 'roofHollowInfillEnabled', False)),
            'roof_hollow_infill_overlap': float(getattr(
                slicing_settings, 'roofHollowInfillOverlap',
                getattr(slicing_settings, 'contourInfillOverlap', 15)) or 0) / 100.0,
            'variable_grid_infill_enabled': bool(getattr(
                slicing_settings, 'variableGridInfillEnabled', False)),
            'variable_grid_target': str(getattr(
                slicing_settings, 'variableGridTarget', 'hollow') or 'hollow'),
            'variable_grid_infill_layers_before_roof': max(1, int(getattr(
                slicing_settings, 'variableGridInfillLayersBeforeRoof', 3) or 3)),
            'variable_grid_spacing': float(getattr(
                slicing_settings, 'variableGridSpacing',
                getattr(slicing_settings, 'gridSpacing', 2)) or 2),
            'variable_grid_hatch_spacing': float(getattr(
                slicing_settings, 'variableGridHatchSpacing',
                getattr(slicing_settings, 'infillHatchSpacing', 1)) or 1),
            'variable_grid_hatch_rotation_per_layer': float(getattr(
                slicing_settings, 'variableGridHatchRotationPerLayer',
                getattr(slicing_settings, 'hatchRotationPerLayer', 67)) or 0),
            'variable_grid_clearance': float(getattr(
                slicing_settings, 'variableGridClearance',
                getattr(slicing_settings, 'gridClearance', 0.2)) or 0),
            'variable_grid_line_count': max(1, int(getattr(
                slicing_settings, 'variableGridLineCount',
                getattr(slicing_settings, 'infillLineCount', 1)) or 1)),
            'variable_engraving_grid_spacing': float(getattr(
                slicing_settings, 'variableEngravingGridSpacing',
                getattr(slicing_settings, 'engravingGridSpacing', 2)) or 2),
            'variable_engraving_grid_line_thickness': float(getattr(
                slicing_settings, 'variableEngravingGridLineThickness',
                getattr(slicing_settings, 'engravingGridLineThickness', 0.8)) or 0.8),
            'multi_variable_grid_enabled': bool(getattr(
                slicing_settings, 'multiVariableGridEnabled', False)),
            'secondary_variable_grid_layers_before_roof': max(1, int(getattr(
                slicing_settings, 'secondaryVariableGridLayersBeforeRoof',
                getattr(slicing_settings, 'variableGridInfillLayersBeforeRoof', 3)) or 3)),
            'secondary_variable_grid_spacing': float(getattr(
                slicing_settings, 'secondaryVariableGridSpacing',
                getattr(slicing_settings, 'variableGridSpacing',
                        getattr(slicing_settings, 'gridSpacing', 2))) or 2),
            'secondary_variable_grid_hatch_spacing': float(getattr(
                slicing_settings, 'secondaryVariableGridHatchSpacing',
                getattr(slicing_settings, 'variableGridHatchSpacing',
                        getattr(slicing_settings, 'infillHatchSpacing', 1))) or 1),
            'secondary_variable_grid_clearance': float(getattr(
                slicing_settings, 'secondaryVariableGridClearance',
                getattr(slicing_settings, 'variableGridClearance',
                        getattr(slicing_settings, 'gridClearance', 0.2))) or 0),
            'secondary_variable_grid_line_count': max(1, int(getattr(
                slicing_settings, 'secondaryVariableGridLineCount',
                getattr(slicing_settings, 'variableGridLineCount',
                        getattr(slicing_settings, 'infillLineCount', 1))) or 1)),
            'secondary_variable_engraving_grid_spacing': float(getattr(
                slicing_settings, 'secondaryVariableEngravingGridSpacing',
                getattr(slicing_settings, 'variableEngravingGridSpacing',
                        getattr(slicing_settings, 'engravingGridSpacing', 2))) or 2),
            'secondary_variable_engraving_grid_line_thickness': float(getattr(
                slicing_settings, 'secondaryVariableEngravingGridLineThickness',
                getattr(slicing_settings, 'variableEngravingGridLineThickness',
                        getattr(slicing_settings, 'engravingGridLineThickness', 0.8))) or 0.8),
            'tertiary_variable_grid_enabled': bool(getattr(
                slicing_settings, 'tertiaryVariableGridEnabled', False)),
            'tertiary_variable_grid_layers_before_roof': max(1, int(getattr(
                slicing_settings, 'tertiaryVariableGridLayersBeforeRoof',
                getattr(slicing_settings, 'secondaryVariableGridLayersBeforeRoof',
                        getattr(slicing_settings, 'variableGridInfillLayersBeforeRoof', 3))) or 3)),
            'tertiary_variable_grid_spacing': float(getattr(
                slicing_settings, 'tertiaryVariableGridSpacing',
                getattr(slicing_settings, 'secondaryVariableGridSpacing',
                        getattr(slicing_settings, 'variableGridSpacing',
                                getattr(slicing_settings, 'gridSpacing', 2)))) or 2),
            'tertiary_variable_grid_hatch_spacing': float(getattr(
                slicing_settings, 'tertiaryVariableGridHatchSpacing',
                getattr(slicing_settings, 'secondaryVariableGridHatchSpacing',
                        getattr(slicing_settings, 'variableGridHatchSpacing',
                                getattr(slicing_settings, 'infillHatchSpacing', 1)))) or 1),
            'tertiary_variable_grid_clearance': float(getattr(
                slicing_settings, 'tertiaryVariableGridClearance',
                getattr(slicing_settings, 'secondaryVariableGridClearance',
                        getattr(slicing_settings, 'variableGridClearance',
                                getattr(slicing_settings, 'gridClearance', 0.2)))) or 0),
            'tertiary_variable_grid_line_count': max(1, int(getattr(
                slicing_settings, 'tertiaryVariableGridLineCount',
                getattr(slicing_settings, 'secondaryVariableGridLineCount',
                        getattr(slicing_settings, 'variableGridLineCount',
                                getattr(slicing_settings, 'infillLineCount', 1)))) or 1)),
            'tertiary_variable_engraving_grid_spacing': float(getattr(
                slicing_settings, 'tertiaryVariableEngravingGridSpacing',
                getattr(slicing_settings, 'secondaryVariableEngravingGridSpacing',
                        getattr(slicing_settings, 'variableEngravingGridSpacing',
                                getattr(slicing_settings, 'engravingGridSpacing', 2)))) or 2),
            'tertiary_variable_engraving_grid_line_thickness': float(getattr(
                slicing_settings, 'tertiaryVariableEngravingGridLineThickness',
                getattr(slicing_settings, 'secondaryVariableEngravingGridLineThickness',
                        getattr(slicing_settings, 'variableEngravingGridLineThickness',
                                getattr(slicing_settings, 'engravingGridLineThickness', 0.8)))) or 0.8),
            'slanted_surface_skin_enabled': bool(getattr(
                slicing_settings, 'slantedSurfaceSkinEnabled', True)),
            'slanted_surface_skin_layers': max(1, int(getattr(
                slicing_settings, 'slantedSurfaceSkinLayers',
                getattr(slicing_settings, 'surfaceSkinLayers', 3)) or 3)),
            'slanted_surface_skin_hatch_spacing': float(getattr(
                slicing_settings, 'slantedSurfaceSkinHatchSpacing',
                getattr(slicing_settings, 'surfaceSkinHatchSpacing', 0.2)) or 0.2),
            'slanted_surface_skin_power': float(getattr(
                slicing_settings, 'slantedSurfaceSkinPower',
                getattr(slicing_settings, 'surfaceSkinPower',
                        getattr(slicing_settings, 'infillPower', 50))) or 50),
            'slanted_surface_skin_speed': float(getattr(
                slicing_settings, 'slantedSurfaceSkinSpeed',
                getattr(slicing_settings, 'surfaceSkinSpeed',
                        getattr(slicing_settings, 'infillSpeed', 3000))) or 3000),
            'slanted_surface_skin_raster_direction': str(getattr(
                slicing_settings, 'slantedSurfaceSkinRasterDirection',
                'diagonal') or 'diagonal'),
            'slanted_surface_skin_cross_hatch': bool(getattr(
                slicing_settings, 'slantedSurfaceSkinCrossHatch', False)),
            'grid_spacing': float(getattr(
                slicing_settings, 'gridSpacing', 2) or 2),
            'engraving_grid_spacing': float(getattr(
                slicing_settings, 'engravingGridSpacing',
                getattr(slicing_settings, 'gridSpacing', 2)) or 2),
            'engraving_grid_angle': float(getattr(
                slicing_settings, 'engravingGridAngle', 45) or 0),
            'engraving_grid_line_thickness': float(getattr(
                slicing_settings, 'engravingGridLineThickness', 0.8) or 0.8),
            'use_custom_grid_clearance': bool(getattr(
                slicing_settings, 'useCustomGridClearance', False)),
            'grid_clearance': float(getattr(
                slicing_settings, 'gridClearance', 0.2) or 0),
            'fill_enclosed_hollows': bool(getattr(
                slicing_settings, 'fillEnclosedHollows', False)),
            'infill_image_pixel_size': (
                slicing_settings.infillImageSettings.x,
                slicing_settings.infillImageSettings.y
            ),
            'infill_image_size': (
                slicing_settings.infillImageSettings.width,
                slicing_settings.infillImageSettings.height
            ),
            'infill_noise': int(slicing_settings.infillImageSettings.noise),
            'use_image_size': slicing_settings.infillImageSettings.isImageSizeSettings,

            # Hollowing
            'is_hollowing_enabled': slicing_settings.isHollowingEnabled,
            'hollowing_wall_thickness': float(slicing_settings.hollowingWallThickness),
            'hollowing_closing_distance': float(slicing_settings.hollowingClosingDistance),
            'hollowing_quality': float(slicing_settings.hollowingQuality),

            # Support
            'is_support_enabled': slicing_settings.isSupportEnabled,
            'is_support_enforced': slicing_settings.isSupportEnforced,
            'support_pinhead_width': float(slicing_settings.supportPinheadWidth),
            'support_pinhead_front_diameter': float(slicing_settings.supportPinheadFrontDiameter),
            'support_pinhead_penetration': float(slicing_settings.supportPinheadPenetration),
            'support_pillar_diameter': float(slicing_settings.supportPillarDiameter),
            'is_support_on_build_plate': slicing_settings.isSupportOnBuildPlate,
            'support_base_diameter': float(slicing_settings.supportBaseDiameter),
            'support_base_height': float(slicing_settings.supportBaseHeight),
            'support_max_bridge_length': float(slicing_settings.supportMaxBridgeLength),
            'support_max_pillar_distance': float(slicing_settings.supportMaxPillarDistance),
            'support_points_density': float(slicing_settings.supportPointsDensity),
            'support_points_minimal_distance': float(slicing_settings.supportPointsMinimalDistance),

            # Pad
            'is_pad_enabled': slicing_settings.isPadEnabled,
            'pad_wall_thickness': float(slicing_settings.padWallThickness),
            'pad_brim_size': float(slicing_settings.padBrimSize),
            'is_pad_around_object': slicing_settings.isPadAroundObject,
            'is_pad_around_object_everywhere': slicing_settings.isPadAroundObjectEverywhere,
        }
        prusa_slicer_data.update(_extract_zone_settings(slicing_settings))
        prusa_slicer_data['body_engraving_enabled'] = (
            prusa_slicer_data['engraving_mode'] == 'engraving'
            or (
                prusa_slicer_data.get('first_layers_count', 0) > 0
                and prusa_slicer_data.get('first_zone_engraving_enabled', False)
            )
            or (
                prusa_slicer_data.get('intermediate_zone_enabled', False)
                and prusa_slicer_data.get('intermediate_layers_count', 0) > 0
                and prusa_slicer_data.get(
                    'intermediate_zone_engraving_enabled', False)
            )
        )

        PrusaSlicer.slice_model(
            slicing_data=prusa_slicer_data, websocket_write_queue=websocket_write_queue)

    def _use_pyslm_lib(self, model_tmp_file_path, slice_result_tmp_file_path, model_size, slicing_settings, websocket_write_queue, engraving_mode='vectoring'):
        """
        Slices the model using PySLM with hatching strategy and laser-specific parameters.

        Args:
            model_tmp_file_path (str): Path to the input model file.
            slice_result_tmp_file_path (str): Output path for sliced data.
            model_size (tuple): Dimensions of the model.
            slicing_settings (obj): PySLM-specific settings.
            websocket_write_queue (PriorityQueueWithCounter): Queue for progress or result messages.
            engraving_mode (str): Engraving mode: 'vectoring' or 'engraving' for line-by-line.
        """

        pyslm_data = {
            'model_file_path': model_tmp_file_path,
            'gcode_file_path': slice_result_tmp_file_path,
            'model_size': model_size,
            'layer_height': float(slicing_settings.layerHeight),
            'layer_speed': int(slicing_settings.layerSpeed),
            'infill_power': int(slicing_settings.infillPower),
            'infill_speed': int(slicing_settings.infillSpeed),
            'infill_image_pixel_size': (slicing_settings.infillImageSettings.x,
                                        slicing_settings.infillImageSettings.y),
            'infill_image_size': (slicing_settings.infillImageSettings.width,
                                  slicing_settings.infillImageSettings.height),
            'infill_noise': int(slicing_settings.infillImageSettings.noise),
            'infill_resolution': int(slicing_settings.infillImageSettings.resolution),
            'use_image_size': slicing_settings.infillImageSettings.isImageSizeSettings,
            'contour_power': int(slicing_settings.contourPower),
            'contour_speed': int(slicing_settings.contourSpeed),
            'contour_line_count': int(getattr(
                slicing_settings, 'contourLineCount', 1) or 1),
            'infill_line_count': int(getattr(
                slicing_settings, 'infillLineCount', 1) or 1),
            'infill_line_thickness': float(getattr(
                slicing_settings, 'infillLineThickness', 0.8) or 0.8),
            'line_bundle_spacing': float(getattr(
                slicing_settings, 'lineBundleSpacing', 0.2) or 0.2),
            'engraving_mode': engraving_mode,
            'hatching_settings': {
                'infill_type': slicing_settings.infillType,
                'infill_angle': float(slicing_settings.infillAngle),
                'infill_volume_offset': float(slicing_settings.infillVolumeOffset),
                'infill_spot_compensation': float(slicing_settings.infillSpotCompensation),
                'infill_strip_width': float(slicing_settings.infillStripWidth),
                'infill_island_width': float(slicing_settings.infillIslandWidth),
                'infill_island_overlap': float(slicing_settings.infillIslandOverlap),
                'infill_island_offset': float(slicing_settings.infillIslandOffset),
                'infill_spot_compensation': float(slicing_settings.infillSpotCompensation),
                'infill_inner_contour': int(slicing_settings.innerContour),
                'infill_outer_contour': int(slicing_settings.outerContour)
            }
        }
        pyslm_data.update(_extract_zone_settings(slicing_settings))

        Pyslm.slice_model(slicing_data=pyslm_data,
                          websocket_write_queue=websocket_write_queue)
