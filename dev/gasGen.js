IDRegistry.genBlockID("gasGenerator");
Block.createBlock("gasGenerator", [
	{name: "Portable Generator", texture: [["metalGasgenerator", 0]], inCreative: true}]);
var mesh = new RenderMesh();
mesh.setBlockTexture("metalGasgenerator", 0);
mesh.importFromFile(__dir__ + "assets/models/gasGenerator.obj", "obj", null); 
var blockModel = new BlockRenderer.Model(mesh);
var icRenderModel = new ICRender.Model();
icRenderModel.addEntry(blockModel);
BlockRenderer.setStaticICRender(BlockID.gasGenerator, -1, icRenderModel);

MachineRecipeRegistry.registerRecipesFor("gasGen", {
	"Gasoline": {power: 256, amount: 5},
	"Diesel": {power: 300, amount: 5},
});

var guiGasgen = new UI.StandartWindow({
	standart: {
		header: {text: {text: Translation.translate("Portable Generator")}},
		inventory: {standart: true},
		background: {standart: true}
	},
	
	drawing: [
		{type: "bitmap", x: 702, y: 91, bitmap: "rf_scale", scale: 0.6},
		{type: "bitmap", x: 479, y: 160, bitmap: "gui_liquid_storage_overlay", scale: 4.3}
	],
	
	elements: {
		"energyScale": {type: "scale", x: 702 + 4*GUI_SCALE, y: 91, direction: 0, value: 0.5, bitmap: "rf_scale_full", scale: 0.6},
		"liquidScale": {type: "scale", x: 482, y: 169, direction: 0, value: 0.5, bitmap: "liquid_gasoline", scale: 0.15},
		"slot1": {type: "slot", x: 408, y: 156},
		"slot2": {type: "slot", x: 408, y: 80, isValid: function(){return false;}},
		"slotEnergy": {type: "slot", x: 725, y: 165, isValid: function(id){return ChargeItemRegistry.isValidItem(id, "Rf", 1);}}
	}
});

MachineRegistry.registerGenerator(BlockID.gasGenerator, {
	defaultValues: {
		meta: 0,
		fuel: 0,
		liquid: null,
		isActive: false
	},
	
	getGuiScreen: function(){
		return guiGasgen;
	},
	
	init: function(){
		this.liquidStorage.setLimit(null, 8);
		this.renderModel();
	},
	
	getLiquidFromItem: MachineRegistry.getLiquidFromItem,
	
	click: function(id, count, data, coords){
		if(Entity.getSneaking(player)){
			var liquid = this.liquidStorage.getLiquidStored();
			return this.getLiquidFromItem(liquid, {id: id, count: count, data: data}, null, true);
		}
	},
	
	tick: function(){
		StorageInterface.checkHoppers(this);
		var energyStorage = this.getEnergyStorage();
		var liquid = this.liquidStorage.getLiquidStored();
		var slot1 = this.container.getSlot("slot1");
		var slot2 = this.container.getSlot("slot2");
		this.getLiquidFromItem(liquid, slot1, slot2);
		
		if(this.data.fuel <= 0){
			var fuel = MachineRecipeRegistry.getRecipeResult("gasGen", liquid);
			if(fuel && this.liquidStorage.getAmount(liquid).toFixed(3) >= fuel.amount/1000 && this.data.energy + fuel.power * fuel.amount <= energyStorage){
				this.liquidStorage.getLiquid(liquid, fuel.amount/1000);
				this.data.fuel = fuel.amount;
				this.data.liquid = liquid;
			}
		}
		if(this.data.fuel > 0){
			var fuel = MachineRecipeRegistry.getRecipeResult("gasGen", this.data.liquid);
			this.data.energy += fuel.power;
			this.data.fuel -= fuel.amount/20;
			this.activate();
			this.startPlaySound("Gen/diesel_generator.ogg");
		}
		else {
			this.data.liquid = null;
			this.stopPlaySound();
			this.deactivate();
		}
    
		this.data.energy -= ChargeItemRegistry.addEnergyTo(this.container.getSlot("slotEnergy"), "Rf", this.data.energy, 1);
		
		this.liquidStorage.updateUiScale("liquidScale", liquid);
		this.container.setScale("energyScale", this.data.energy / energyStorage);
	},
	
	getEnergyStorage: function(){
		return 10000000;
	},
	
	energyTick: function(type, src){
		var output = Math.min(256, this.data.energy);
		this.data.energy += src.add(output) - output;
	},
	
	renderModel: MachineRegistry.renderModelWithRotation
});

TileRenderer.setRotationPlaceFunction(BlockID.gasGenerator);

