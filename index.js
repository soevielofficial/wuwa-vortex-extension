const path = require('path');
const winapi = require('winapi-bindings');
const { fs, log, util } = require('vortex-api');

// Nexus Mods domain for the game. e.g. nexusmods.com/wutheringwaves
const GAME_ID = 'wutheringwaves'; 

function main(context) {
  // This is the main function Vortex will run when detecting the game extension.

    context.registerGame({
      id: GAME_ID,
      name: 'Wuthering Waves',
      mergeMods: true,
      queryPath: findGame,
      supportedTools: [],
      queryModPath: () => 'Wuthering Waves Game/Client/Content/Paks',
      logo: 'gameart.png',
      executable: () => 'launcher.exe',
      requiredFiles: ['Wuthering Waves Game/Client/Binaries/Win64/Client-Win64-Shipping.exe'],
      setup: prepareForModding,
      environment: {},
      details: {}
    });

    function findGame() {
      const instPath = winapi.RegGetValue(
        'HKEY_LOCAL_MACHINE',
        'SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KRInstall Wuthering Waves Overseas',
        'InstallPath');

      if (!instPath) {
        throw new Error('empty registry key');
      }
      
      return Promise.resolve(instPath.value);
  }

    function prepareForModding(discovery) {
      return fs.ensureDirAsync(path.join(discovery.path, 'Client', 'Content', 'Paks', '~mods'));
    }

    context.registerInstaller('wutheringwaves', 25, testSupportedContent, installContent);

    const MOD_FILE_EXT = ".pak";

    function testSupportedContent(files, gameId) {
      // Make sure we're able to support this mod.
      let supported = (gameId === GAME_ID) &&
        (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);
    
      return Promise.resolve({
        supported,
        requiredFiles: [],
      });
    }

    function installContent(files) {
      // The .pak file is expected to always be positioned in the mods directory we're going to disregard anything placed outside the root.
      const modFile = files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT);
      const idx = modFile.indexOf(path.basename(modFile));
      const rootPath = path.dirname(modFile);
      
      // Remove directories and anything that isn't in the rootPath.
      const filtered = files.filter(file => 
        ((file.indexOf(rootPath) !== -1) 
        && (!file.endsWith(path.sep))));
    
      const instructions = filtered.map(file => {
        return {
          type: 'copy',
          source: file,
          destination: path.join(file.substr(idx)),
        };
      });
    
      return Promise.resolve({ instructions });
    }
	
	return true
  
}

module.exports = {
    default: main,
  };