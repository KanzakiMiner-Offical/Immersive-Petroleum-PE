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
