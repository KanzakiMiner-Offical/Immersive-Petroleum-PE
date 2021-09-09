// file: lib.js
 IMPORT ("ToolLib");
 IMPORT ("flags");
 IMPORT ("ToolType");
 IMPORT ("energylib");
 IMPORT ("ChargeItem");
 IMPORT ("MachineRender");
 IMPORT ("TileRender");
 IMPORT ("LiquidLib");

// file: API/machine.js
// energy (Eu)
 // file: core/StLib.js
const StructureLib = {
	getStructure: function(cx, cy, cz, structure){
		let t=0;
		for(let i in structure){
			t++;
			var block = World.getBlock(cx + structure[i].x, cy + structure[i].y, cz + structure[i].z).id === structure[i].id;
			if(!block){t=0; return false;}
			if(structure.length == t){return true;}
			//Game.message(block);
		}
	},
	getModdedStructure: function(cx, cy, cz, structure){
		let t=0;
		var isValid = false;
		bl: for(let i in structure){
			var list = modifierAugmentApi.getList();
			var block = World.getBlock(cx + structure[i].x, cy + structure[i].y, cz + structure[i].z).id === structure[i].id;
			if(structure[i].id === BlockID.null_modifier){
				for(let u in list){
					block = World.getBlock(cx + structure[i].x, cy + structure[i].y, cz + structure[i].z).id === list[u];
					if(!block && u == list.length){t=0; break bl;}
				}
			}else{
			if(!block){t=0; break bl;}}
			if(structure.length == t){isValid = true; break bl;}
			//Game.message(block);
			t++;
		}
		return isValid;
	},
	
           // Unused
setStructure: function(coords, structure){
		let c = coords;
		let p = 0;
		str: for(let i in structure){
			if(World.getBlock(c.x + structure[i].x, c.y + structure[i].y, c.z + structure[i].z).id !== structure[i].id){
			for(let u = 9; u<45; u++){
				let item = Player.getInventorySlot(u);
				if(item.id === structure[i].id){
					Player.setInventorySlot(u, structure[i].id, item.count-1, 0);
					World.setBlock(c.x + structure[i].x, c.y + structure[i].y, c.z + structure[i].z, structure[i].id, 0);
					//break str;
				}else if(u==45){p=1; Game.message("Not Enough (> "+structure[i].id+" <) for assemble structure"); break str;}
			}
			}
			if(i==structure.length){if(p == 0){Game.message("Structure Assembler finished work");}else if(p == 1){Game.message("Structure Assembler finished work with error");}}
		}
	},
	breakStructure: function(coords, structure){
		let c = coords;
		//modifierApi.getModifier(structure, c);
		for(let i in structure){
			for(let u = 9; u<45; u++){
				let item = Player.getInventorySlot(u);
				if(item.id === structure[i].id){
					if(item.count<64){
						Player.setInventorySlot(u, structure[i].id, item.count+1, 0); World.setBlock(structure[i].x+c.x, structure[i].y+c.y, structure[i].z+c.z, 0); break;}
					}else if(item.id == 0){Player.setInventorySlot(u, structure[i].id, item.count+1, 0); World.setBlock(structure[i].x+c.x, structure[i].y+c.y, structure[i].z+c.z, 0); break;
				}else if(u==45){World.drop(c.x, c.y+1, c.z, structure[i].id, 1, 0); World.setBlock(structure[i].x+c.x, structure[i].y+c.y, structure[i].z+c.z, 0);}
			}
		}
	},
	structureAssembler: function(structure, coords){
		let c = coords;
		let destroy = false;
		destroy = StructureLib.getStructure(c.x, c.y, c.z, structure);
		//Game.message(destroy);
		if(destroy){
			Game.message("Structure Destroyed");
			StructureLib.breakStructure(c, structure);
		}else{
			StructureLib.setStructure(coords, structure);
		}
	},
}
let slots = 0;


 // file: config.js
let Config = {
	reload: function(){
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
Callback.addCallback("LevelLoaded", function(){
	Config.reload();
	player = Player.get();
});

isLevelDisplayed = false;
Callback.addCallback("LevelDisplayed", function(){
	isLevelDisplayed = true;
});
Callback.addCallback("LevelLeft", function(){
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

	isMachine: function(id){
		return this.machineIDs[id];
	},
	
	// Machine Base
	registerPrototype: function(id, Prototype){
		// register ID
		this.machineIDs[id] = true;
		
		// audio
		if(Prototype.getStartSoundFile){
			if(!Prototype.getStartingSoundFile){
				Prototype.getStartingSoundFile = function(){return null;}
			}
			if(!Prototype.getInterruptSoundFile){
				Prototype.getInterruptSoundFile = function(){return null;}
			}
			Prototype.startPlaySound = Prototype.startPlaySound || function(){
				if(!Config.machineSoundEnabled){return;}
				let audio = this.audioSource;
				if(audio && audio.isFinishing){
					audio.stop();
					audio.media = audio.startingSound || audio.startSound;
					audio.start();
					audio.isFinishing = false;
				}
				else if(!this.remove && (!audio || !audio.isPlaying()) && this.dimension == Player.getDimension()){
					this.audioSource = SoundAPI.createSource([this.getStartingSoundFile(), this.getStartSoundFile(), this.getInterruptSoundFile()], this, 16);
				}
			}
			Prototype.stopPlaySound = Prototype.stopPlaySound || function(playInterruptSound){
				let audio = this.audioSource;
				if(audio){
					if(!audio.isPlaying()){
						this.audioSource = null;
					}
					else if(!audio.isFinishing){
						audio.stop();
						if(playInterruptSound){
							audio.playFinishingSound();
						}
					}
				}
			}
		} 
		else {
			Prototype.startPlaySound = Prototype.startPlaySound || function(name){
				if(!Config.machineSoundEnabled){return;}
				let audio = this.audioSource;
				if(!this.remove && (!audio || !audio.isPlaying()) && this.dimension == Player.getDimension()){
					let sound = SoundAPI.playSoundAt(this, name, true, 16);
					this.audioSource = sound;
				}
			}
			Prototype.stopPlaySound = Prototype.stopPlaySound || function(){
				if(this.audioSource && this.audioSource.isPlaying()){
					this.audioSource.stop();
					this.audioSource = null;
				}
			}
		}
		
		
		// machine activation
		if(Prototype.defaultValues && Prototype.defaultValues.isActive !== undefined){
			if(!Prototype.renderModel){
				Prototype.renderModel = this.renderModelWithRotation;
			}
			
			Prototype.setActive = Prototype.setActive || this.setActive;
			
			Prototype.activate = Prototype.activate || function(){
				this.setActive(true);
			}
			Prototype.deactivate = Prototype.deactivate || function(){
				this.setActive(false);
			}
			Prototype.destroy = Prototype.destroy || function(){
				BlockRenderer.unmapAtCoords(this.x, this.y, this.z);
				this.stopPlaySound();
			}
		}
		
		if(!Prototype.init && Prototype.renderModel){
			Prototype.init = Prototype.renderModel;
		}
		
		ToolAPI.registerBlockMaterial(id, "stone", 1, true);
		Block.setDestroyTime(id, 3);
		TileEntity.registerPrototype(id, Prototype);
	},
	
	// RF machines
	registerElectricMachine: function(id, Prototype){
		// wire connection
		ICRender.getGroup("rf-wire").add(id, -1);
		//ICRender.getGroup("ic-wire").add(id, -1);
		
		// setup energy values
		if (Prototype.defaultValues){
			Prototype.defaultValues.energy = 0;
			Prototype.defaultValues.energy_receive = 0;
			Prototype.defaultValues.last_energy_receive = 0;
			Prototype.defaultValues.voltage = 0;
			Prototype.defaultValues.last_voltage = 0;
		}
		else{
			Prototype.defaultValues = {
				energy: 0,
				energy_receive: 0,
				last_energy_receive: 0,
				voltage: 0,
				last_voltage: 0
			};
		}
		
		Prototype.getTier = Prototype.getTier || function(){
			return 1;
		}
		
		if(!Prototype.getEnergyStorage){
			Prototype.getEnergyStorage = function(){
				return 0;
			};
		}
		
		if(!Prototype.energyTick){
			Prototype.energyTick = function(){
				this.data.last_energy_receive = this.data.energy_receive;
				this.data.energy_receive = 0;
				this.data.last_voltage = this.data.voltage;
				this.data.voltage = 0;
			};
		}
		
		if (!Prototype.getMaxPacketSize) {
			Prototype.getMaxPacketSize = function(tier){
				return 8 << this.getTier()*2;
			}
		}
		
		Prototype.energyReceive = Prototype.energyReceive || this.basicEnergyReceiveFunc;
		
		this.registerPrototype(id, Prototype);
		// register for energy net
		EnergyTileRegistry.addEnergyTypeForId(id, RF);
	},
	
	registerGenerator(id, Prototype){
		Prototype.canReceiveEnergy = function(){
			return false;
		},
	
		Prototype.isEnergySource = function(){
			return true;
		},
		
		Prototype.energyTick = Prototype.energyTick || this.basicEnergyOutFunc;
		
		this.registerElectricMachine(id, Prototype);
	},
	
	registerRFStorage(id, Prototype){
		Prototype.isEnergySource = function(){
			return true;
		},
		
		Prototype.energyReceive = Prototype.energyReceive || this.basicEnergyReceiveFunc;
		
		Prototype.energyTick = Prototype.energyTick || this.basicEnergyOutFunc;
		
		Prototype.isTeleporterCompatible = true;
		
		this.registerElectricMachine(id, Prototype);
	},
	
	// standard functions
	setStoragePlaceFunction: function(id, fullRotation){
		Block.registerPlaceFunction(BlockID[id], function(coords, item, block){
			var place = World.canTileBeReplaced(block.id, block.data) ? coords : coords.relative;
			World.setBlock(place.x, place.y, place.z, item.id, 0);
			World.playSound(place.x, place.y, place.z, "dig.stone", 1, 0.8)
			var rotation = TileRenderer.getBlockRotation(fullRotation);
			var tile = World.addTileEntity(place.x, place.y, place.z);
			tile.data.meta = rotation;
			TileRenderer.mapAtCoords(place.x, place.y, place.z, item.id, rotation);
			if(item.extra){
				tile.data.energy = item.extra.getInt("energy");
			}
		});
	},
	
	setFacing: function(coords){
		if(Entity.getSneaking(player)){
			var facing = coords.side ^ 1;
		} else {
			var facing = coords.side;
		}
		if(facing != this.data.meta){
			this.data.meta = facing;
			this.renderModel();
			return true;
		}
		return false;
	},
	
	renderModel: function(){
		if(this.data.isActive){
			TileRenderer.mapAtCoords(this.x, this.y, this.z, this.blockID, 0);
		} else {
			BlockRenderer.unmapAtCoords(this.x, this.y, this.z);
		}
	},
	
	renderModelWithRotation: function(){
		TileRenderer.mapAtCoords(this.x, this.y, this.z, this.blockID, this.data.meta + (this.data.isActive? 4 : 0));
	},
	
	renderModelWith6Sides: function(){
		TileRenderer.mapAtCoords(this.x, this.y, this.z, this.blockID, this.data.meta + (this.data.isActive? 6 : 0));
	},
	
	setActive: function(isActive){
		if(this.data.isActive != isActive){
			this.data.isActive = isActive;
			this.renderModel();
		}
	},
	
	basicEnergyOutFunc: function(type, src){
		this.data.last_energy_receive = this.data.energy_receive;
		this.data.energy_receive = 0;
		this.data.last_voltage = this.data.voltage;
		this.data.voltage = 0;
		var output = this.getMaxPacketSize();
		if(this.data.energy >= output){
			this.data.energy += src.add(output) - output;
		}
	},
	
	basicEnergyReceiveFunc: function(type, amount, voltage) {
		var maxVoltage = this.getMaxPacketSize();
		if(voltage > maxVoltage){
			if(Config.voltageEnabled){
				World.setBlock(this.x, this.y, this.z, 0);
				World.explode(this.x + 0.5, this.y + 0.5, this.z + 0.5, 1.2, true);
				var sound = SoundAPI.playSound("Machines/MachineOverload.ogg", false, true);
				if(sound && !sound.source){
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
	
	getLiquidFromItem: function(liquid, inputItem, outputItem, hand){
		if(hand) outputItem = {id: 0, count: 0, data: 0};
		var empty = LiquidLib.getEmptyItem(inputItem.id, inputItem.data);
		if(empty && (!liquid && this.interface.canReceiveLiquid(empty.liquid) || empty.liquid == liquid) && !this.liquidStorage.isFull(empty.liquid)){
			if(outputItem.id == empty.id && outputItem.data == empty.data && outputItem.count < Item.getMaxStack(empty.id) || outputItem.id == 0){
				var liquidLimit = this.liquidStorage.getLimit(empty.liquid);
				var storedAmount = this.liquidStorage.getAmount(liquid).toFixed(3);
				var count = Math.min(hand? inputItem.count : 1, parseInt((liquidLimit - storedAmount) / empty.amount));
				if(count > 0){
					this.liquidStorage.addLiquid(empty.liquid, empty.amount * count);
					inputItem.count -= count;
					outputItem.id = empty.id;
					outputItem.data = empty.data;
					outputItem.count += count;
					if(!hand) this.container.validateAll();
				}
				else if(inputItem.count == 1 && empty.storage){
					var amount = Math.min(liquidLimit - storedAmount, empty.amount);
					this.liquidStorage.addLiquid(empty.liquid, amount);
					inputItem.data += amount * 1000;
				}
				if(hand){
					if(outputItem.id){
						Player.addItemToInventory(outputItem.id, outputItem.count, outputItem.data);
					}
					if(inputItem.count == 0) inputItem.id = inputItem.data = 0;
					Player.setCarriedItem(inputItem.id, inputItem.count, inputItem.data);
					return true;
				}
			}
		}
	},
	
	addLiquidToItem: function(liquid, inputItem, outputItem){
		var amount = this.liquidStorage.getAmount(liquid).toFixed(3);
		if(amount > 0){
			var full = LiquidLib.getFullItem(inputItem.id, inputItem.data, liquid);
			if(full && (outputItem.id == full.id && outputItem.data == full.data && outputItem.count < Item.getMaxStack(full.id) || outputItem.id == 0)){
				if(amount >= full.amount){
					this.liquidStorage.getLiquid(liquid, full.amount);
					inputItem.count--;
					outputItem.id = full.id;
					outputItem.data = full.data;
					outputItem.count++;
					this.container.validateAll();
				}
				else if(inputItem.count == 1 && full.storage){
					if(inputItem.id == full.id){
						amount = this.liquidStorage.getLiquid(liquid, full.amount);
						inputItem.data -= amount * 1000;
					} else {
						amount = this.liquidStorage.getLiquid(liquid, full.storage);
						inputItem.id = full.id;
						inputItem.data = (full.storage - amount)*1000;
					}
				}
			}
		}
	},
	
	isValidRFItem: function(id, count, data, container){
		var level = container.tileEntity.getTier();
		return ChargeItemRegistry.isValidItem(id, "Rf", level);
	},
	
	isValidRFStorage: function(id, count, data, container){
		var level = container.tileEntity.getTier();
		return ChargeItemRegistry.isValidStorage(id, "Rf", level);
	},
	
	updateGuiHeader: function(gui, text){
		var header = gui.getWindow("header");
		header.contentProvider.drawing[2].text = Translation.translate(text);
	}
}

var transferByTier = {
	1: 32,
	2: 256,
	3: 2048,
	4: 8192
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
	
	registerRecipesFor: function(name, data, validateKeys){
		if(validateKeys){
			var newData = {};
			for(var key in data){
				if(key.indexOf(":") != -1){
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
	
	addRecipeFor: function(name, input, result){
		var recipes = this.requireRecipesFor(name, true);
		if(Array.isArray(recipes)){
			recipes.push({input: input, result: result});
		}
		else {
			recipes[input] = result;
		}
	},
	
	requireRecipesFor: function(name, createIfNotFound){
		if(!this.recipeData[name] && createIfNotFound){
			this.recipeData[name] = {};
		}
		return this.recipeData[name];
	},
	
	getRecipeResult: function(name, key1, key2){
		var data = this.requireRecipesFor(name);
		if(data){
			return data[key1] || data[key1+":"+key2];
		}
	},
	
	hasRecipeFor: function(name, key1, key2){
		return this.getRecipeResult(name, key1, key2)? true : false;
	}
	

	
}

var UpgradeAPI = {
	data: {},
	
	getUpgradeData: function(id){
		return this.data[id];
	},
	
	isUpgrade: function(id){
		return UpgradeAPI.data[id]? true : false;
	},
	
	isValidUpgrade: function(id, count, data, container){
		var upgrades = container.tileEntity.upgrades;
		var upgradeData = UpgradeAPI.getUpgradeData(id);
		if(upgradeData && (!upgrades || upgrades.indexOf(upgradeData.type) != -1)){
			return true;
		}
		return false;
	},

	registerUpgrade: function(id, type, func){
		this.data[id] = {type: type, func: func};
	},

	callUpgrade: function(item, machine, container, data){
		var upgrades = machine.upgrades;
		var upgrade = this.getUpgradeData(item.id);
		if(upgrade && (!upgrades || upgrades.indexOf(upgrade.type) != -1)){
			upgrade.func(item, machine, container, data);
		}
	},
	
	getUpgrades: function(machine, container){
		var upgrades = [];
		for(var slotName in container.slots){
			if(slotName.match(/Upgrade/)){
				var slot = container.getSlot(slotName);
				if(slot.id > 0){
					var find = false;
					for(var i in upgrades){
						var item = upgrades[i];
						if(item.id == slot.id && item.data == slot.data){
							item.count += slot.count;
							find = true;
							break;
						}
					}
					if(!find){
						item = {id: slot.id, count: slot.count, data: slot.data};
						upgrades.push(item);
					}
				}
			}
		}
		return upgrades;
	},

	executeUpgrades: function(machine){
		var container = machine.container;
		var data = machine.data;
		var upgrades = this.getUpgrades(machine, container);
		for(var i in upgrades){
			this.callUpgrade(upgrades[i], machine, container, data);
		}
		StorageInterface.checkHoppers(machine);
	},
}



// file: item/up.js

IDRegistry.genItemID("upgradeSpeed");
Item.createItem("upgradeSpeed", "Speed Upgrade", {name: "upgradespeed", meta: 0});

UpgradeAPI.registerUpgrade(ItemID.upgradeSpeed, "speed", function(item, machine, container, data){
	if(data.work_time){
		data.energy_consumption = Math.round(data.energy_consumption * Math.pow(1.6, item.count));
		data.work_time = Math.round(data.work_time * Math.pow(0.7, item.count));
	}
});

// file: Machine/gasgenerator.js
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
		return 100000;
	},
	
	energyTick: function(type, src){
		var output = Math.min(256, this.data.energy);
		this.data.energy += src.add(output) - output;
	},
	
	renderModel: MachineRegistry.renderModelWithRotation
});

TileRenderer.setRotationPlaceFunction(BlockID.gasGenerator);


// file: Machine/distillationtower.js
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

// file: Machine/pump.js
IDRegistry.genBlockID("pumpJack");
Block.createBlock("pumpJack", [
	{name: "Pump Jack", texture: [["pumpjack", 0]], inCreative: true}]);
var mesh = new RenderMesh();
mesh.setBlockTexture("pumpjack", 0);
mesh.importFromFile(__dir__ + "assets/models/pumpjack_mirrored.obj", "obj", null); 
var blockModel = new BlockRenderer.Model(mesh);
var icRenderModel = new ICRender.Model();
icRenderModel.addEntry(blockModel);
BlockRenderer.setStaticICRender(BlockID.pumpJack, -1, icRenderModel);




// file: RES/ore.js

Block.createSpecialType({
	base: 1,
	solid: true,
	destroytime: 3,
	explosionres: 15,
	lightopacity: 15,
	renderlayer: 2,
	translucency: 0
}, "ore");

IDRegistry.genBlockID("dummyoilore");
Block.createBlock("dummyoilore", [
	{name: "Oil Ore", texture: [["dummyoilore", 0]], inCreative: true}
], "ore");
ToolAPI.registerBlockMaterial(BlockID.dummyoilore, "stone", 2, true);
Block.setDestroyLevel("dummyoilore", 2);
ToolLib.addBlockDropOnExplosion("dummyoilore");

IDRegistry.genBlockID("asphalt");
Block.createBlock("asphalt", [
	{name: "Asphalt Concrete", texture: [["asphalt", 0]], inCreative: true}
], "ore");
ToolAPI.registerBlockMaterial(BlockID.asphalt, "stone", 2, true);
Block.setDestroyLevel("asphalt", 1);
ToolLib.addBlockDropOnExplosion("asphalt");

// file: Energy/cable.js

IDRegistry.genBlockID("dummypipe");
Block.createBlock("dummypipe", [
    {name: "Dummy Pipe", texture: [["pipe", 0]], inCreative: true}
]);

// file: RES/liquidformachine.js 
 IDRegistry.genItemID ("oilCan");
 Item.createItem ("oilCan", "Oil Can", {name: "oilCan", meta: 0}, {stack: 16});
 
 Item.registerNameOverrideFunction(ItemID.oilCan, function(item, name){
		return name + "\n§7" + Translation.translate("Empty Can !");
	});
	
const PetroLiquid = {
	Liquid: function (ids, name, ima) {
	LiquidRegistry.registerLiquid(ids, name, [ima]);

 let id = "oilCan" + ids;
	IDRegistry.genItemID (id);
 Item.createItem (id, "Oil Can", {name: "oilCan", meta: 0}, {stack: 1});
 
 Item.registerNameOverrideFunction(ItemID[id], function(item, name){
		return name + "\n§7" + Translation.translate("Liquid: " + name +"Amount: 1000 mb");
	});
LiquidLib.registerItem(ids, VanillaItemID.bucket, ItemID[id], 1000);
	}
};

PetroLiquid.Liquid("Oil", "Oil", "oil_still");
PetroLiquid.Liquid("Diesel", "Diessl", "diesel_still");
PetroLiquid.Liquid("Napalm", "Napalm", "napalm_still");
PetroLiquid.Liquid("Gasoline", "Gasoline", "gasoline_still");
PetroLiquid.Liquid("Lubricant", "Lubricant", "lubricant_still");
// file: RES/liquid.js
Block.createSpecialType({
	//base: 8, renderlayer: 1, rendertype: 4, translucency: 1, lightopacity: 2
	base: 10, renderlayer: 2, rendertype: 4, translucency: 1, lightopacity: 14, lightlevel: 15
}, "liquid");

IDRegistry.genBlockID("oilLiquid");
Block.createBlock("oilLiquid", [
	{name: "Oil Liquid", texture: [["oil_still", 0]], inCreative: true},
], "liquid");
TileRenderer.setEmptyCollisionShape(BlockID.oilLiquid);
Block.registerDropFunction("oilLiquid", function(coords, blockID, blockData, level){
	return [];
});

var blocksToUpdate = [];
var nextBlocksToUpdate;
var blocksToRemove = [];
var nextBlocksToRemove = [];
Block.registerPlaceFunction(BlockID.oilLiquid, function(coords, item, block){
	var c = coords.relative;
	var blockID = World.getBlockID(c.x, c.y, c.z);
	if(blockID == 0 || blockID == item.id){
		World.setBlock(c.x, c.y, c.z, item.id, 0);
		blocksToUpdate.push(c);
	}
});

Callback.addCallback("tick", function(){
	if(World.getThreadTime()%5 > 0) return;
	nextBlocksToUpdate = [];
	for(var i in blocksToUpdate){
		var c = blocksToUpdate[i];
		var block = World.getBlock(c.x, c.y, c.z) 
		if(block.id == BlockID.oilLiquid){
			var bottomTile = World.getBlockID(c.x, c.y-1, c.z);
			if(bottomTile == 0 || bottomTile == block.id){
				checkBlock(c.x, c.y-1, c.z, block.id, 1);
			} else {
				if(bottomTile == 8 || bottomTile == 9){
					World.setBlock(c.x, c.y-1, c.z, 1, 0);
				}
				checkBlock(c.x+1, c.y, c.z, block.id, block.data + 1);
				checkBlock(c.x-1, c.y, c.z, block.id, block.data + 1);
				checkBlock(c.x, c.y, c.z+1, block.id, block.data + 1);
				checkBlock(c.x, c.y, c.z-1, block.id, block.data + 1);
			}
		}
	}
	blocksToUpdate = nextBlocksToUpdate;
});

function checkBlock(x, y, z, id, data, mode){
	var block = World.getBlock(x, y, z);
	if(data < 8 && (block.id == 0 || block.id == id && block.data > data)){
		World.setBlock(x, y, z, id, data);
		nextBlocksToUpdate.push({x: x, y: y, z: z});
	}
}

Callback.addCallback("DestroyBlock", function(coords, block, player){
	for(var side = 0; side < 6; side++){
		var c = World.getRelativeCoords(coords.x, coords.y, coords.z, side);
		if(World.getBlockID(c.x, c.y, c.z) == BlockID.oilLiquid){
			blocksToUpdate.push(c);
		}
	}
});


// file: RES/liquidbucket.js
IDRegistry.genItemID("oilBucket");
Item.createItem("oilBucket", "Oil Bucket", {name: "bucketOil"});

Item.registerUseFunction(VanilaItemID.bucket,function(coords, item, block){
	if(block.id > 7 && block.id < 12 && block.data == 0){
		World.setBlock(coords.x, coords.y, coords.z, 0);
		if(block.id == BlockID.oilLiquid){
		Player.addItemToInventory(ItemID.oilBucket, 1);}
		Player.decreaseCarriedItem(1);
	}
});

Item.registerUseFunction("oilBucket", function(coords, item, block){
	var x = coords.relative.x
	var y = coords.relative.y
	var z = coords.relative.z
	var block = World.getBlockID(x,y,z)
	if(block == 0 || block > 7 && block < 12){
		World.setBlock(x, y, z, BlockID.oilLiquid);
		Player.addItemToInventory(325, 1);
		Player.decreaseCarriedItem(1);
	}
});



