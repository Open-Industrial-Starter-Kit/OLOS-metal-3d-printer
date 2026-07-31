import {
  PrusaSettings,
  PyslmSettings,
  Slic3rSettings,
} from 'src/interfaces/3D.slicing.interface';

type EngineSettings = PrusaSettings | PyslmSettings | Slic3rSettings;
type ReportSetting = [key: string, value: unknown];

export interface PrintSettingsReportModel {
  name: string;
  solidSettings?: Partial<PrusaSettings>;
}

export interface PrintSettingsReportData {
  sourceFilename: string;
  profileName: string;
  slicingLibrary: string;
  printHeightLowerLimit?: number;
  printHeightLimit?: number;
  engineSettings: EngineSettings;
  models: PrintSettingsReportModel[];
}

const PREPARATION_PREFIXES = ['solidAnchorPad', 'solidTransition'];
const MACHINE_KEYS = new Set([
  'layerHeight',
  'layerSpeed',
  'engravingAcceleration',
  'noRoutineFirstLayers',
  'reservoirLiftPerLayer',
  'recoaterFeedRate',
  'recoaterReturnBedDropEnabled',
  'recoaterReturnBedDropDistance',
  'recoaterReturnBedFeedRate',
  'bedOffsetX',
  'bedOffsetY',
]);

const humanizeSettingName = (name: string) =>
  name
    .replace(/\./g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/\bxy\b/gi, 'XY')
    .replace(/\bz\b/g, 'Z')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatSettingValue = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
  if (value === null) return 'Not set';
  if (value === undefined) return 'Not set';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const flattenSettings = (
  settings: Record<string, unknown>,
  prefix = ''
): ReportSetting[] =>
  Object.entries(settings).flatMap(([key, value]) => {
    const settingName = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenSettings(value as Record<string, unknown>, settingName);
    }
    return [[settingName, value] as ReportSetting];
  });

const settingRoot = (key: string) => key.split('.')[0];

const isPreparationSetting = ([key]: ReportSetting) =>
  PREPARATION_PREFIXES.some((prefix) => settingRoot(key).startsWith(prefix));

const isMachineSetting = ([key]: ReportSetting) =>
  MACHINE_KEYS.has(settingRoot(key));

const appendSettingsSection = (
  lines: string[],
  title: string,
  settings: ReportSetting[]
) => {
  lines.push(title);
  if (!settings.length) {
    lines.push('  None');
  } else {
    settings.forEach(([key, value]) => {
      lines.push(`  ${humanizeSettingName(key)}: ${formatSettingValue(value)}`);
    });
  }
  lines.push('');
};

const appendOrderedSettings = (
  lines: string[],
  settings: Record<string, unknown>,
  titlePrefix = ''
) => {
  const entries = flattenSettings(settings);
  const preparation = entries.filter(isPreparationSetting);
  const machine = entries.filter(isMachineSetting);
  const model = entries.filter(
    (entry) => !isPreparationSetting(entry) && !isMachineSetting(entry)
  );

  appendSettingsSection(lines, `${titlePrefix}Preparation`, preparation);
  appendSettingsSection(lines, `${titlePrefix}Model`, model);
  appendSettingsSection(lines, `${titlePrefix}Machine`, machine);
};

export const createPrintSettingsReport = (data: PrintSettingsReportData) => {
  const lines = [
    'OLOS PRINT SETTINGS',
    '===================',
    '',
    'Print',
    `  File: ${data.sourceFilename}`,
    `  Profile: ${data.profileName}`,
    `  Slicer: ${data.slicingLibrary}`,
    `  Models: ${data.models.length}`,
    `  Generated: ${new Date().toLocaleString()}`,
  ];

  if (data.printHeightLowerLimit != null) {
    lines.push(`  Print Height Lower Limit: ${data.printHeightLowerLimit}`);
  }
  if (data.printHeightLimit != null) {
    lines.push(`  Print Height Limit: ${data.printHeightLimit}`);
  }
  lines.push('');

  lines.push('Models');
  data.models.forEach((model, index) => {
    lines.push(`  ${index + 1}. ${model.name}`);
  });
  lines.push('');

  appendOrderedSettings(
    lines,
    data.engineSettings as unknown as Record<string, unknown>
  );

  const modelsWithOverrides = data.models.filter(
    (model) =>
      model.solidSettings && Object.keys(model.solidSettings).length > 0
  );
  if (modelsWithOverrides.length) {
    lines.push('Per-Object Solid Settings');
    lines.push('=========================');
    lines.push('');
    modelsWithOverrides.forEach((model, index) => {
      lines.push(`${index + 1}. ${model.name}`);
      lines.push('-'.repeat(Math.max(4, model.name.length + 3)));
      appendOrderedSettings(
        lines,
        model.solidSettings as Record<string, unknown>,
        '  '
      );
    });
  }

  return `${lines.join('\n').trimEnd()}\n`;
};

export const settingsReportFilename = (sourceFilename: string) => {
  const withoutProjectSuffix = sourceFilename.replace(
    /\.olos-project\.json$/i,
    ''
  );
  const withoutExtension = withoutProjectSuffix.replace(/\.[^./\\]+$/, '');
  const safeName = (withoutExtension || 'olos_print')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .trim();
  return `${safeName || 'olos_print'}_print_settings.txt`;
};
