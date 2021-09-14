IDRegistry.genBlockID("pumpJack");
Block.createBlock("pumpJack", [
  { name: "Pump Jack", texture: [["pumpjack", 0]], inCreative: true }]);
var mesh = new RenderMesh();
mesh.setBlockTexture("pumpjack", 0);
mesh.importFromFile(__dir__ + "assets/models/pumpjack_mirrored.obj", "obj", null);
var blockModel = new BlockRenderer.Model(mesh);
var icRenderModel = new ICRender.Model();
icRenderModel.addEntry(blockModel);
BlockRenderer.setStaticICRender(BlockID.pumpJack, -1, icRenderModel);

var uiPump = new UI.StandartWindow({
  standart: {
    header: { text: { text: "Pump Jack" } },
    background: { color: android.graphics.Color.parseColor("#b3b3b3") },
    inventory: { standart: true }
  },
  drawing: [
    { type: "scale", x: 500, y: 120, direction: 0, bitmap: "rf_scale", scale: 3.2 },
    { type: "scale", x: 450, y: 130, direction: 0, bitmap: "arrow_bar_scale", scale: 3.2 }
],
  elements: {
    "energyScale": { type: "scale", x: 870, y: 120, direction: 0, bitmap: "rf_scale", scale: 3.2, value: 1 },
    //Out
    "slotOil1": { type: "slot", x: 380, y: 250, size: 60, isValid: function() { return false; } },
    //In
    "slotOil2": {
      type: "slot",
      x: 380,
      y: 180,
      size: 60,
      isValid: function(id, count, data) {
        return LiquidLib.getFullItem(id, data, "oil") ? true : false;
      }
    },
    "scale_4": { type: "scale", x: 500, y: 90, direction: 0, bitmap: "oil_flow", scale: 3.2, value: 1 },
    "scale_5": { type: "scale", x: 450, y: 130, direction: 0, bitmap: "progress", scale: 3.2, value: 1 }
  }
});

/*
checkBiomes: function(){
		if(World.getBiome(this.x, this.z) == 0 || World.getBiome(this.x, this.z) == 24 || World.getBiome(this.x, this.z) == 2 || World.getBiome(this.x, this.z) == 2 || World.getBiome(this.x, this.z) == 17 || World.getBiome(this.x, this.z) == 130 ||World.getBiome(this.x, this.z) == 9){
		return true;
		} else {
		return false;
		}
	}
*/

MachineRegistry.registerElectricMachine(BlockID.pumpJack, {
  defaultValues: {
    power_tier: 1,
    energy_storage: 16000,
    energy_consumption: 1024,
    work_time: 1,
    progress: 0,
    isActive: false,
  },

  getGuiScreen: function() {
    return uiPump;
  },

  init: function() {
    this.liquidStorage.setLimit("oil", 10);
    this.renderModel();
  },

  checkBiomes: function() {
    if (World.getBiome(this.x, this.z) == 0 || World.getBiome(this.x, this.z) == 24 || World.getBiome(this.x, this.z) == 2 || World.getBiome(this.x, this.z) == 2 || World.getBiome(this.x, this.z) == 17 || World.getBiome(this.x, this.z) == 130 || World.getBiome(this.x, this.z) == 9) {
      return true;
    } else {
      return false;
    }
  },

  getLiquidFromItem: MachineRegistry.getLiquidFromItem,

  tick: function() {
    StorageInterface.checkHoppers(this);

    var newActive = false;
    if (this.checkHoppers == true) {
      if (this.data.energy >= this.data.energy_consumption) {
        this.data.energy -= this.data.energy_consumption;
        this.data.progress += 1 / this.data.work_time;
        newActive = true;
        this.startPlaySound();
      }
      if (this.data.progress >= 1) {
        this.liquidStorage.getLiquid("oil", 0.015);
        this.data.progress = 0;
      }
    }
    else {
      this.data.progress = 0;
    }
    if (!newActive)
      this.stopPlaySound(true);
    this.setActive(newActive);


    var slot1 = this.container.getSlot("slotOil1");
    var slot2 = this.container.getSlot("slotOil2");
    this.getLiquidFromItem("oil", slot1, slot2);
    var energyStorage = this.getEnergyStorage();
    this.data.energy = Math.min(this.data.energy, energyStorage);

    this.container.setScale("scale_5", this.data.progress);
    this.liquidStorage.updateUiScale("scale_4", "oil");

    this.container.setScale("energyScale", this.data.energy / energyStorage);
  },

  getEnergyStorage: function() {
    return this.data.energy_storage;
  },

  getStartSoundFile: function() {
    return "Machines/TurnOn.ogg";
  },
  getInterruptSoundFile: function() {
    return "Machines/TurnOff.ogg";
  },

  energyReceive: MachineRegistry.basicEnergyReceiveFunc

});

TileRenderer.setRotationPlaceFunction(BlockID.pumpJack, true);

StorageInterface.createInterface(BlockID.pumpJack, {
  slots: {
    "slotOil1": { input: true },
    "slotOil2": { output: true }
  },
  isValidInput: function(item) {
    return LiquidLib.getFullItem(item.id, item.data, "oil") ? true : false;
  },
  canReceiveLiquid: function(liquid, side) { return false; },
  canTransportLiquid: function(liquid, side) { return true; }
});