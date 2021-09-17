// file: lib.js
IMPORT("ToolLib");
IMPORT("flags");
IMPORT("ToolType");
IMPORT("energylib");
IMPORT("ChargeItem");
IMPORT("MachineRender");
IMPORT("TileRender");
IMPORT("LiquidLib");
IMPORT("StorageInterface");

// file: API/machine.js
// energy (Eu)
// file: core/StLib.js
const StructureLib = {
  getStructure: function(cx, cy, cz, structure) {
    let t = 0;
    for (let i in structure) {
      t++;
      var block = World.getBlock(cx + structure[i].x, cy + structure[i].y, cz + structure[i].z).id === structure[i].id;
      if (!block) { t = 0; return false; }
      if (structure.length == t) { return true; }
      //Game.message(block);
    }
  },
  getModdedStructure: function(cx, cy, cz, structure) {
    let t = 0;
    var isValid = false;
    bl: for (let i in structure) {
      var list = modifierAugmentApi.getList();
      var block = World.getBlock(cx + structure[i].x, cy + structure[i].y, cz + structure[i].z).id === structure[i].id;
      if (structure[i].id === BlockID.null_modifier) {
        for (let u in list) {
          block = World.getBlock(cx + structure[i].x, cy + structure[i].y, cz + structure[i].z).id === list[u];
          if (!block && u == list.length) { t = 0; break bl; }
        }
      } else {
        if (!block) { t = 0; break bl; }
      }
      if (structure.length == t) { isValid = true; break bl; }
      //Game.message(block);
      t++;
    }
    return isValid;
  },

  // Unused
  setStructure: function(coords, structure) {
    let c = coords;
    let p = 0;
    str: for (let i in structure) {
      if (World.getBlock(c.x + structure[i].x, c.y + structure[i].y, c.z + structure[i].z).id !== structure[i].id) {
        for (let u = 9; u < 45; u++) {
          let item = Player.getInventorySlot(u);
          if (item.id === structure[i].id) {
            Player.setInventorySlot(u, structure[i].id, item.count - 1, 0);
            World.setBlock(c.x + structure[i].x, c.y + structure[i].y, c.z + structure[i].z, structure[i].id, 0);
            //break str;
          } else if (u == 45) { p = 1;
            Game.message("Not Enough (> " + structure[i].id + " <) for assemble structure"); break str; }
        }
      }
      if (i == structure.length) { if (p == 0) { Game.message("Structure Assembler finished work"); } else if (p == 1) { Game.message("Structure Assembler finished work with error"); } }
    }
  },
  breakStructure: function(coords, structure) {
    let c = coords;
    //modifierApi.getModifier(structure, c);
    for (let i in structure) {
      for (let u = 9; u < 45; u++) {
        let item = Player.getInventorySlot(u);
        if (item.id === structure[i].id) {
          if (item.count < 64) {
            Player.setInventorySlot(u, structure[i].id, item.count + 1, 0);
            World.setBlock(structure[i].x + c.x, structure[i].y + c.y, structure[i].z + c.z, 0);
            break;
          }
        } else if (item.id == 0) {
          Player.setInventorySlot(u, structure[i].id, item.count + 1, 0);
          World.setBlock(structure[i].x + c.x, structure[i].y + c.y, structure[i].z + c.z, 0);
          break;
        } else if (u == 45) { World.drop(c.x, c.y + 1, c.z, structure[i].id, 1, 0);
          World.setBlock(structure[i].x + c.x, structure[i].y + c.y, structure[i].z + c.z, 0); }
      }
    }
  },
  structureAssembler: function(structure, coords) {
    let c = coords;
    let destroy = false;
    destroy = StructureLib.getStructure(c.x, c.y, c.z, structure);
    //Game.message(destroy);
    if (destroy) {
      Game.message("Structure Destroyed");
      StructureLib.breakStructure(c, structure);
    } else {
      StructureLib.setStructure(coords, structure);
    }
  },
}
let slots = 0;


// file: config.js
let Config = {
  reload: function() {
    this.soundEnabled = __config__.getBool("sound_enabled");
    this.machineSoundEnabled = __config__.getBool("machine_sounds");
    this.voltageEnabled = __config__.getBool("voltage_enabled");
    this.wireDamageEnabled = __config__.getBool("wire_damage_enabled");

    var lang = FileTools.ReadKeyValueFile("games/com.mojang/minecraftpe/options.txt").game_language;
    this.language = (lang || "en_US").substring(0, 2);
  }
}

Config.reload();

var player;
Callback.addCallback("LevelLoaded", function() {
  Config.reload();
  player = Player.get();
});

isLevelDisplayed = false;
Callback.addCallback("LevelDisplayed", function() {
  isLevelDisplayed = true;
});
Callback.addCallback("LevelLeft", function() {
  isLevelDisplayed = false;
});



// file: core/Api.js

// constants
var GUI_SCALE = 3.2;
var GUI_ENER = 0.6;
// API Machine
var RF = EnergyTypeRegistry.assureEnergyType("Rf", 0.25);
var MachineRegistry = {
  machineIDs: {},

  isMachine: function(id) {
    return this.machineIDs[id];
  },

  // Machine Base
  registerPrototype: function(id, Prototype) {
    // register ID
    this.machineIDs[id] = true;

    // audio
    if (Prototype.getStartSoundFile) {
      if (!Prototype.getStartingSoundFile) {
        Prototype.getStartingSoundFile = function() { return null; }
      }
      if (!Prototype.getInterruptSoundFile) {
        Prototype.getInterruptSoundFile = function() { return null; }
      }
      Prototype.startPlaySound = Prototype.startPlaySound || function() {
        if (!Config.machineSoundEnabled) { return; }
        let audio = this.audioSource;
        if (audio && audio.isFinishing) {
          audio.stop();
          audio.media = audio.startingSound || audio.startSound;
          audio.start();
          audio.isFinishing = false;
        }
        else if (!this.remove && (!audio || !audio.isPlaying()) && this.dimension == Player.getDimension()) {
          this.audioSource = SoundAPI.createSource([this.getStartingSoundFile(), this.getStartSoundFile(), this.getInterruptSoundFile()], this, 16);
        }
      }
      Prototype.stopPlaySound = Prototype.stopPlaySound || function(playInterruptSound) {
        let audio = this.audioSource;
        if (audio) {
          if (!audio.isPlaying()) {
            this.audioSource = null;
          }
          else if (!audio.isFinishing) {
            audio.stop();
            if (playInterruptSound) {
              audio.playFinishingSound();
            }
          }
        }
      }
    }
    else {
      Prototype.startPlaySound = Prototype.startPlaySound || function(name) {
        if (!Config.machineSoundEnabled) { return; }
        let audio = this.audioSource;
        if (!this.remove && (!audio || !audio.isPlaying()) && this.dimension == Player.getDimension()) {
          let sound = SoundAPI.playSoundAt(this, name, true, 16);
          this.audioSource = sound;
        }
      }
      Prototype.stopPlaySound = Prototype.stopPlaySound || function() {
        if (this.audioSource && this.audioSource.isPlaying()) {
          this.audioSource.stop();
          this.audioSource = null;
        }
      }
    }


    // machine activation
    if (Prototype.defaultValues && Prototype.defaultValues.isActive !== undefined) {
      if (!Prototype.renderModel) {
        Prototype.renderModel = this.renderModelWithRotation;
      }

      Prototype.setActive = Prototype.setActive || this.setActive;

      Prototype.activate = Prototype.activate || function() {
        this.setActive(true);
      }
      Prototype.deactivate = Prototype.deactivate || function() {
        this.setActive(false);
      }
      Prototype.destroy = Prototype.destroy || function() {
        BlockRenderer.unmapAtCoords(this.x, this.y, this.z);
        this.stopPlaySound();
      }
    }

    if (!Prototype.init && Prototype.renderModel) {
      Prototype.init = Prototype.renderModel;
    }

    ToolAPI.registerBlockMaterial(id, "stone", 1, true);
    Block.setDestroyTime(id, 3);
    TileEntity.registerPrototype(id, Prototype);
  },

  // RF machines
  registerElectricMachine: function(id, Prototype) {
    // wire connection
    ICRender.getGroup("rf-wire").add(id, -1);
    //ICRender.getGroup("ic-wire").add(id, -1);

    // setup energy values
    if (Prototype.defaultValues) {
      Prototype.defaultValues.energy = 0;
      Prototype.defaultValues.energy_receive = 0;
      Prototype.defaultValues.last_energy_receive = 0;
      Prototype.defaultValues.voltage = 0;
      Prototype.defaultValues.last_voltage = 0;
    }
    else {
      Prototype.defaultValues = {
        energy: 0,
        energy_receive: 0,
        last_energy_receive: 0,
        voltage: 0,
        last_voltage: 0
      };
    }

    Prototype.getTier = Prototype.getTier || function() {
      return 1;
    }

    if (!Prototype.getEnergyStorage) {
      Prototype.getEnergyStorage = function() {
        return 0;
      };
    }

    if (!Prototype.energyTick) {
      Prototype.energyTick = function() {
        this.data.last_energy_receive = this.data.energy_receive;
        this.data.energy_receive = 0;
        this.data.last_voltage = this.data.voltage;
        this.data.voltage = 0;
      };
    }

    if (!Prototype.getMaxPacketSize) {
      Prototype.getMaxPacketSize = function(tier) {
        return 8 << this.getTier() * 2;
      }
    }

    Prototype.energyReceive = Prototype.energyReceive || this.basicEnergyReceiveFunc;

    this.registerPrototype(id, Prototype);
    // register for energy net
    EnergyTileRegistry.addEnergyTypeForId(id, RF);
  },

  registerGenerator(id, Prototype) {
    Prototype.canReceiveEnergy = function() {
        return false;
      },

      Prototype.isEnergySource = function() {
        return true;
      },

      Prototype.energyTick = Prototype.energyTick || this.basicEnergyOutFunc;

    this.registerElectricMachine(id, Prototype);
  },

  registerRFStorage(id, Prototype) {
    Prototype.isEnergySource = function() {
        return true;
      },

      Prototype.energyReceive = Prototype.energyReceive || this.basicEnergyReceiveFunc;

    Prototype.energyTick = Prototype.energyTick || this.basicEnergyOutFunc;

    Prototype.isTeleporterCompatible = true;

    this.registerElectricMachine(id, Prototype);
  },

  // standard functions
  setStoragePlaceFunction: function(id, fullRotation) {
    Block.registerPlaceFunction(BlockID[id], function(coords, item, block) {
      var place = World.canTileBeReplaced(block.id, block.data) ? coords : coords.relative;
      World.setBlock(place.x, place.y, place.z, item.id, 0);
      World.playSound(place.x, place.y, place.z, "dig.stone", 1, 0.8)
      var rotation = TileRenderer.getBlockRotation(fullRotation);
      var tile = World.addTileEntity(place.x, place.y, place.z);
      tile.data.meta = rotation;
      TileRenderer.mapAtCoords(place.x, place.y, place.z, item.id, rotation);
      if (item.extra) {
        tile.data.energy = item.extra.getInt("energy");
      }
    });
  },

  setFacing: function(coords) {
    if (Entity.getSneaking(player)) {
      var facing = coords.side ^ 1;
    } else {
      var facing = coords.side;
    }
    if (facing != this.data.meta) {
      this.data.meta = facing;
      this.renderModel();
      return true;
    }
    return false;
  },

  renderModel: function() {
    if (this.data.isActive) {
      TileRenderer.mapAtCoords(this.x, this.y, this.z, this.blockID, 0);
    } else {
      BlockRenderer.unmapAtCoords(this.x, this.y, this.z);
    }
  },

  renderModelWithRotation: function() {
    TileRenderer.mapAtCoords(this.x, this.y, this.z, this.blockID, this.data.meta + (this.data.isActive ? 4 : 0));
  },

  renderModelWith6Sides: function() {
    TileRenderer.mapAtCoords(this.x, this.y, this.z, this.blockID, this.data.meta + (this.data.isActive ? 6 : 0));
  },

  setActive: function(isActive) {
    if (this.data.isActive != isActive) {
      this.data.isActive = isActive;
      this.renderModel();
    }
  },

  basicEnergyOutFunc: function(type, src) {
    this.data.last_energy_receive = this.data.energy_receive;
    this.data.energy_receive = 0;
    this.data.last_voltage = this.data.voltage;
    this.data.voltage = 0;
    var output = this.getMaxPacketSize();
    if (this.data.energy >= output) {
      this.data.energy += src.add(output) - output;
    }
  },

  basicEnergyReceiveFunc: function(type, amount, voltage) {
    var maxVoltage = this.getMaxPacketSize();
    if (voltage > maxVoltage) {
      if (Config.voltageEnabled) {
        World.setBlock(this.x, this.y, this.z, 0);
        World.explode(this.x + 0.5, this.y + 0.5, this.z + 0.5, 1.2, true);
        var sound = SoundAPI.playSound("Machines/MachineOverload.ogg", false, true);
        if (sound && !sound.source) {
          sound.setSource(this, 32);
        }
        this.selfDestroy();
        return 1;
      }
      var add = Math.min(maxVoltage, this.getEnergyStorage() - this.data.energy);
    } else {
      var add = Math.min(amount, this.getEnergyStorage() - this.data.energy);
    }
    this.data.energy += add;
    this.data.energy_receive += add;
    this.data.voltage = Math.max(this.data.voltage, voltage);
    return add;
  },

  getLiquidFromItem: function(liquid, inputItem, outputItem, hand) {
    if (hand) outputItem = { id: 0, count: 0, data: 0 };
    var empty = LiquidLib.getEmptyItem(inputItem.id, inputItem.data);
    if (empty && (!liquid && this.interface.canReceiveLiquid(empty.liquid) || empty.liquid == liquid) && !this.liquidStorage.isFull(empty.liquid)) {
      if (outputItem.id == empty.id && outputItem.data == empty.data && outputItem.count < Item.getMaxStack(empty.id) || outputItem.id == 0) {
        var liquidLimit = this.liquidStorage.getLimit(empty.liquid);
        var storedAmount = this.liquidStorage.getAmount(liquid).toFixed(3);
        var count = Math.min(hand ? inputItem.count : 1, parseInt((liquidLimit - storedAmount) / empty.amount));
        if (count > 0) {
          this.liquidStorage.addLiquid(empty.liquid, empty.amount * count);
          inputItem.count -= count;
          outputItem.id = empty.id;
          outputItem.data = empty.data;
          outputItem.count += count;
          if (!hand) this.container.validateAll();
        }
        else if (inputItem.count == 1 && empty.storage) {
          var amount = Math.min(liquidLimit - storedAmount, empty.amount);
          this.liquidStorage.addLiquid(empty.liquid, amount);
          inputItem.data += amount * 1000;
        }
        if (hand) {
          if (outputItem.id) {
            Player.addItemToInventory(outputItem.id, outputItem.count, outputItem.data);
          }
          if (inputItem.count == 0) inputItem.id = inputItem.data = 0;
          Player.setCarriedItem(inputItem.id, inputItem.count, inputItem.data);
          return true;
        }
      }
    }
  },

  addLiquidToItem: function(liquid, inputItem, outputItem) {
    var amount = this.liquidStorage.getAmount(liquid).toFixed(3);
    if (amount > 0) {
      var full = LiquidLib.getFullItem(inputItem.id, inputItem.data, liquid);
      if (full && (outputItem.id == full.id && outputItem.data == full.data && outputItem.count < Item.getMaxStack(full.id) || outputItem.id == 0)) {
        if (amount >= full.amount) {
          this.liquidStorage.getLiquid(liquid, full.amount);
          inputItem.count--;
          outputItem.id = full.id;
          outputItem.data = full.data;
          outputItem.count++;
          this.container.validateAll();
        }
        else if (inputItem.count == 1 && full.storage) {
          if (inputItem.id == full.id) {
            amount = this.liquidStorage.getLiquid(liquid, full.amount);
            inputItem.data -= amount * 1000;
          } else {
            amount = this.liquidStorage.getLiquid(liquid, full.storage);
            inputItem.id = full.id;
            inputItem.data = (full.storage - amount) * 1000;
          }
        }
      }
    }
  },

  isValidRFItem: function(id, count, data, container) {
    var level = container.tileEntity.getTier();
    return ChargeItemRegistry.isValidItem(id, "Rf", level);
  },

  isValidRFStorage: function(id, count, data, container) {
    var level = container.tileEntity.getTier();
    return ChargeItemRegistry.isValidStorage(id, "Rf", level);
  },

  updateGuiHeader: function(gui, text) {
    var header = gui.getWindow("header");
    header.contentProvider.drawing[2].text = Translation.translate(text);
  }
}

var transferByTier = {
	1: 256,
	2: 1024,
	3: 4086,
	4: 16344
}


// BASE

Block.createSpecialType({
  base: 1,
  solid: true,
  destroytime: 5,
  explosionres: 30,
  lightopacity: 15,
  renderlayer: 2,
  sound: "stone"
}, "machine");

// file: core/machine/recipe.js

var MachineRecipeRegistry = {
  recipeData: {},

  registerRecipesFor: function(name, data, validateKeys) {
    if (validateKeys) {
      var newData = {};
      for (var key in data) {
        if (key.indexOf(":") != -1) {
          var keyArray = key.split(":");
          var newKey = eval(keyArray[0]) + ":" + keyArray[1];
        } else {
          var newKey = eval(key);
        }
        newData[newKey] = data[key];
      }
      data = newData;
    }
    this.recipeData[name] = data;
  },

  addRecipeFor: function(name, input, result) {
    var recipes = this.requireRecipesFor(name, true);
    if (Array.isArray(recipes)) {
      recipes.push({ input: input, result: result });
    }
    else {
      recipes[input] = result;
    }
  },

  requireRecipesFor: function(name, createIfNotFound) {
    if (!this.recipeData[name] && createIfNotFound) {
      this.recipeData[name] = {};
    }
    return this.recipeData[name];
  },

  getRecipeResult: function(name, key1, key2) {
    var data = this.requireRecipesFor(name);
    if (data) {
      return data[key1] || data[key1 + ":" + key2];
    }
  },

  hasRecipeFor: function(name, key1, key2) {
    return this.getRecipeResult(name, key1, key2) ? true : false;
  }



}

var UpgradeAPI = {
  data: {},

  getUpgradeData: function(id) {
    return this.data[id];
  },

  isUpgrade: function(id) {
    return UpgradeAPI.data[id] ? true : false;
  },

  isValidUpgrade: function(id, count, data, container) {
    var upgrades = container.tileEntity.upgrades;
    var upgradeData = UpgradeAPI.getUpgradeData(id);
    if (upgradeData && (!upgrades || upgrades.indexOf(upgradeData.type) != -1)) {
      return true;
    }
    return false;
  },

  registerUpgrade: function(id, type, func) {
    this.data[id] = { type: type, func: func };
  },

  callUpgrade: function(item, machine, container, data) {
    var upgrades = machine.upgrades;
    var upgrade = this.getUpgradeData(item.id);
    if (upgrade && (!upgrades || upgrades.indexOf(upgrade.type) != -1)) {
      upgrade.func(item, machine, container, data);
    }
  },

  getUpgrades: function(machine, container) {
    var upgrades = [];
    for (var slotName in container.slots) {
      if (slotName.match(/Upgrade/)) {
        var slot = container.getSlot(slotName);
        if (slot.id > 0) {
          var find = false;
          for (var i in upgrades) {
            var item = upgrades[i];
            if (item.id == slot.id && item.data == slot.data) {
              item.count += slot.count;
              find = true;
              break;
            }
          }
          if (!find) {
            item = { id: slot.id, count: slot.count, data: slot.data };
            upgrades.push(item);
          }
        }
      }
    }
    return upgrades;
  },

  executeUpgrades: function(machine) {
    var container = machine.container;
    var data = machine.data;
    var upgrades = this.getUpgrades(machine, container);
    for (var i in upgrades) {
      this.callUpgrade(upgrades[i], machine, container, data);
    }
    StorageInterface.checkHoppers(machine);
  },
}