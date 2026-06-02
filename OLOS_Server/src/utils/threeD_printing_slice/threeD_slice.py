"""
ThreeDSlice dispatcher — V2 PATCH.

Adds passthrough of:
- Intermediate-zone exposure (first / intermediate / final)
- Routine settings (no-routine-first-layers, bed offset, parking coords, etc.)
"""

from core.constants import CoreConstants as constants
from utils.media_convertor_helper import MediaConvertorHelper
from utils.threeD_printing_slice.src.slic3r import Slic3r
from utils.threeD_printing_slice.src.prusa_slicer import PrusaSlicer
from utils.threeD_printing_slice.src.pyslm import Pyslm


def _extract_zone_settings(slicing_settings):
    """
    Pull per-zone exposure + OLSK routine settings from the frontend settings object.
    All fields are optional - missing fields cause the slicer to fall back to
    its single-power, no-routine behaviour.
    """
    out = {}

    # FIRST zone
    if hasattr(slicing_settings, 'firstLayersCount'):
        out['first_layers_count'] = int(slicing_settings.firstLayersCount)
    if hasattr(slicing_settings, 'firstInfillPower'):
        out['first_infill_power'] = int(slicing_settings.firstInfillPower)
    if hasattr(slicing_settings, 'firstInfillSpeed'):
        out['first_infill_speed'] = int(slicing_settings.firstInfillSpeed)
    if hasattr(slicing_settings, 'firstContourPower'):
        out['first_contour_power'] = int(slicing_settings.firstContourPower)
    if hasattr(slicing_settings, 'firstContourSpeed'):
        out['first_contour_speed'] = int(slicing_settings.firstContourSpeed)

    # INTERMEDIATE zone (NEW)
    if hasattr(slicing_settings, 'intermediateZoneEnabled'):
        out['intermediate_zone_enabled'] = bool(slicing_settings.intermediateZoneEnabled)
    if hasattr(slicing_settings, 'intermediateLayersCount'):
        out['intermediate_layers_count'] = int(slicing_settings.intermediateLayersCount)
    if hasattr(slicing_settings, 'intermediateInfillPower'):
        out['intermediate_infill_power'] = int(slicing_settings.intermediateInfillPower)
    if hasattr(slicing_settings, 'intermediateInfillSpeed'):
        out['intermediate_infill_speed'] = int(slicing_settings.intermediateInfillSpeed)
    if hasattr(slicing_settings, 'intermediateContourPower'):
        out['intermediate_contour_power'] = int(slicing_settings.intermediateContourPower)
    if hasattr(slicing_settings, 'intermediateContourSpeed'):
        out['intermediate_contour_speed'] = int(slicing_settings.intermediateContourSpeed)

    # ROUTINE settings (NEW)
    if hasattr(slicing_settings, 'noRoutineFirstLayers'):
        out['no_routine_first_layers'] = int(slicing_settings.noRoutineFirstLayers)
    if hasattr(slicing_settings, 'reservoirLiftPerLayer'):
        out['powder_feed'] = -abs(float(slicing_settings.reservoirLiftPerLayer))
    if hasattr(slicing_settings, 'bedOffsetX'):
        out['bed_offset_x'] = float(slicing_settings.bedOffsetX)
    if hasattr(slicing_settings, 'bedOffsetY'):
        out['bed_offset_y'] = float(slicing_settings.bedOffsetY)

    return out


class ThreeDSlice:
    @classmethod
    def slice_models(cls, model_tmp_file_path, slice_result_tmp_file_path,
                     slice_data, websocket_write_queue):
        slicer = cls()
        model = MediaConvertorHelper.decode_base64_to_binary(slice_data.modelFile)
        open(model_tmp_file_path, mode='wb').write(model)

        settings = slice_data.slicingSettings
        if settings.slicingLib == constants.SLICING_LIBRARIES['SLIC3R']:
            slicer._use_slic3r(model_tmp_file_path, slice_result_tmp_file_path,
                               slice_data.modelSize, settings.slic3rSettings,
                               websocket_write_queue)
        elif settings.slicingLib == constants.SLICING_LIBRARIES['PRUSA_SLICER']:
            slicer._use_prusa_slicer(model_tmp_file_path, slice_result_tmp_file_path,
                                     slice_data.modelSize, settings.prusaSettings,
                                     websocket_write_queue)
        elif settings.slicingLib == constants.SLICING_LIBRARIES['PYSLM']:
            slicer._use_pyslm_lib(model_tmp_file_path, slice_result_tmp_file_path,
                                  slice_data.modelSize, settings.pyslmSettings,
                                  websocket_write_queue)

    def _use_slic3r(self, model_tmp_file_path, slice_result_tmp_file_path,
                    model_size, slicing_settings, websocket_write_queue):
        slic3r_data = {
            'model_file_path': model_tmp_file_path,
            'gcode_file_path': slice_result_tmp_file_path,
            'model_size': model_size,
            'layer_height': float(slicing_settings.layerHeight),
            'layer_speed': int(slicing_settings.layerSpeed),
            'infill_power': int(slicing_settings.infillPower),
            'infill_speed': int(slicing_settings.infillSpeed),
            'contour_line_count': int(getattr(
                slicing_settings, 'contourLineCount', 1) or 1),
            'infill_angle': float(getattr(
                slicing_settings, 'infillAngle', 0) or 0),
            'infill_line_count': int(getattr(
                slicing_settings, 'infillLineCount', 1) or 1),
            'line_bundle_spacing': 0.2,
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
                          model_size, slicing_settings, websocket_write_queue):
        prusa_slicer_data = {
            'model_file_path': model_tmp_file_path,
            'gcode_file_path': slice_result_tmp_file_path,
            'model_size': model_size,
            'layer_height': float(slicing_settings.layerHeight),
            'layer_speed': int(slicing_settings.layerSpeed),
            'contour_power': int(slicing_settings.contourPower),
            'contour_speed': int(slicing_settings.contourSpeed),
            'contour_line_count': int(getattr(
                slicing_settings, 'contourLineCount', 1) or 1),
            'infill_angle': float(getattr(
                slicing_settings, 'infillAngle', 0) or 0),
            'hatch_rotation_per_layer': float(getattr(
                slicing_settings, 'hatchRotationPerLayer', 67) or 0),
            'infill_line_count': int(getattr(
                slicing_settings, 'infillLineCount', 1) or 1),
            'contour_infill_overlap': float(getattr(
                slicing_settings, 'contourInfillOverlap', 15) or 0) / 100.0,
            'optimize_scan_order': bool(getattr(
                slicing_settings, 'optimizeScanOrder', True)),
            'line_bundle_spacing': 0.2,
            'infill_hatch_spacing': float(getattr(
                slicing_settings, 'infillHatchSpacing', 0) or 0),
            'infill_power': int(slicing_settings.infillPower),
            'infill_speed': int(slicing_settings.infillSpeed),
            'infill_image_pixel_size': (slicing_settings.infillImageSettings.x,
                                        slicing_settings.infillImageSettings.y),
            'infill_image_size': (slicing_settings.infillImageSettings.width,
                                  slicing_settings.infillImageSettings.height),
            'infill_noise': int(slicing_settings.infillImageSettings.noise),
            'use_image_size': slicing_settings.infillImageSettings.isImageSizeSettings,
            'is_hollowing_enabled': slicing_settings.isHollowingEnabled,
            'hollowing_wall_thickness': float(slicing_settings.hollowingWallThickness),
            'hollowing_closing_distance': float(slicing_settings.hollowingClosingDistance),
            'hollowing_quality': float(slicing_settings.hollowingQuality),
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
            'is_pad_enabled': slicing_settings.isPadEnabled,
            'pad_wall_thickness': float(slicing_settings.padWallThickness),
            'pad_brim_size': float(slicing_settings.padBrimSize),
            'is_pad_around_object': slicing_settings.isPadAroundObject,
            'is_pad_around_object_everywhere': slicing_settings.isPadAroundObjectEverywhere,
        }
        prusa_slicer_data.update(_extract_zone_settings(slicing_settings))
        PrusaSlicer.slice_model(slicing_data=prusa_slicer_data,
                                websocket_write_queue=websocket_write_queue)

    def _use_pyslm_lib(self, model_tmp_file_path, slice_result_tmp_file_path,
                       model_size, slicing_settings, websocket_write_queue):
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
            'hatching_settings': {
                'infill_type': slicing_settings.infillType,
                'infill_angle': float(slicing_settings.infillAngle),
                'infill_volume_offset': float(slicing_settings.infillVolumeOffset),
                'infill_spot_compensation': float(slicing_settings.infillSpotCompensation),
                'infill_strip_width': float(slicing_settings.infillStripWidth),
                'infill_island_width': float(slicing_settings.infillIslandWidth),
                'infill_island_overlap': float(slicing_settings.infillIslandOverlap),
                'infill_island_offset': float(slicing_settings.infillIslandOffset),
                'infill_inner_contour': int(slicing_settings.innerContour),
                'infill_outer_contour': int(slicing_settings.outerContour)
            }
        }
        pyslm_data.update(_extract_zone_settings(slicing_settings))
        Pyslm.slice_model(slicing_data=pyslm_data,
                          websocket_write_queue=websocket_write_queue)
