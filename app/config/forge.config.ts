import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Cafe POS',
    executableName: 'cafe-pos',
    icon: '../assets/icon.png',
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}, ['win32']),
    new MakerZIP({}, ['win32', 'darwin', 'linux']),
    new MakerDeb({}, ['linux']),
    new MakerRpm({}, ['linux']),
  ],
};

export default config;
