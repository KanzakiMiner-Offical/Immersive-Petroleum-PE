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
