IDRegistry.genBlockID("distillationtower");
Block.createBlock("distillationtower", [
	{name: "Distillation Tower", texture: [["distillation_tower", 0]], inCreative: true}]);
var mesh = new RenderMesh();
mesh.setBlockTexture("distillation_tower", 0);
mesh.importFromFile(__dir__ + "assets/models/distillationtower.obj", "obj", null); 
var blockModel = new BlockRenderer.Model(mesh);
var icRenderModel = new ICRender.Model();
icRenderModel.addEntry(blockModel);
BlockRenderer.setStaticICRender(BlockID.distillationtower, -1, icRenderModel);
/*
var uiPump = new UI.StandartWindow({
  standart: {
    header: { text: { text: "Pump Jack" } },
    background: { color: android.graphics.Color.parseColor("#b3b3b3") },
    inventory: { standart: true }
  },
  drawing: [
    { type: "scale", x: 870, y: 120, direction: 0, bitmap: "rf_scale", scale: 3.2, value: 1 },
    { type: "scale", x: 450, y: 130, direction: 0, bitmap: "arrow_bar_scale", scale: 3.2, value: 1 }
],
  elements: {
    "energyScale": { type: "scale", x: 870, y: 120, direction: 0, bitmap: "rf_scale", scale: 3.2, value: 1 },
    //Out
    "slotOil1": { type: "slot", x: 380, y: 250, size: 60, isValid: function() { return false; } },
    "slotDiesel1": { type: "slot", x: 520, y: 250, size: 60, isValid: function() { return false; } },
    "slotGasoline1": { type: "slot", x: 630, y: 250, size: 60, isValid: function() { return false; } },
    "slotLubricant1": { type: "slot", x: 740, y: 250, size: 60, isValid: function() { return false; } },
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
    "slotDiesel2": {
      type: "slot",
      x: 520,
      y: 180,
      size: 60,
      isValid: function(id, count, data) {
        return LiquidLib.getItemLiquid(id, data) == "diesel";
      }
    },
    "slotGasoline2": {
      type: "slot",
      x: 630,
      y: 180,
      size: 60,
      isValid: function(id, count, data) {
        return LiquidLib.getItemLiquid(id, data) == "gasoline";
      }
    },
    "slotLubricant2": {
      type: "slot",
      x: 740,
      y: 180,
      size: 60,
      isValid: function(id, count, data) {
        return LiquidLib.getItemLiquid(id, data) == "lubricant";
      }
    },
    "scale_1": { type: "scale", x: 530, y: 90, direction: 0, bitmap: "diesel_flow", scale: 3.2, value: 1 },
    "scale_2": { type: "scale", x: 750, y: 90, direction: 0, bitmap: "gasoline_flow", scale: 3.2, value: 1 },
    "scale_3": { type: "scale", x: 640, y: 87, direction: 0, bitmap: "lubricant_flow", scale: 3.25, value: 1 },
    "scale_4": { type: "scale", x: 390, y: 90, direction: 0, bitmap: "oil_flow", scale: 3.2, value: 1 },
    "scale_5": { type: "scale", x: 450, y: 130, direction: 0, bitmap: "progress", scale: 3.2, value: 1 }
  }
});
*/