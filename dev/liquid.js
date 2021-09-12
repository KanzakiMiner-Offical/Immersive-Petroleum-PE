IDRegistry.genItemID ("oilCan");
 Item.createItem ("oilCan", "Oil Can", {name: "oilCan", meta: 0}, {stack: 16});
 
 Item.registerNameOverrideFunction(ItemID.oilCan, function(item, name){
		return name + "\n§7" + Translation.translate("Empty Can !");
	});
	
const PetroLiquid = {
	Liquid: function (ids, name, ima) {
	LiquidRegistry.registerLiquid(ids, name, [ima + "_still"]);

 let id = "oilCan" + ids;
	IDRegistry.genItemID (id);
 Item.createItem (id, "Oil Can", {name: "oilCan", meta: 0}, {stack: 1});
 
 Item.registerNameOverrideFunction(ItemID[id], function(item, name){
		return name + "\n§7" + Translation.translate("Liquid: " + name +"Amount: 1000 mb");
	});
LiquidLib.registerItem(ids, VanillaItemID.bucket, ItemID[id], 1000);
	}
};

PetroLiquid.Liquid("oil", "Oil", "oil");
PetroLiquid.Liquid("diesel", "Diessl", "diesel");
PetroLiquid.Liquid("napalm", "Napalm", "napalm");
PetroLiquid.Liquid("gasoline", "Gasoline", "gasoline");
PetroLiquid.Liquid("lubricant", "Lubricant", "lubricant");