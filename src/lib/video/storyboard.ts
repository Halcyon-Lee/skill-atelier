export type Scene = { headline:string; body:string; composition:"grid"|"bars"|"steps"|"orbit"|"focus"; elements:number[] };
export type Storyboard = { title:string; accent:string; scenes:Scene[] };
export const STORYBOARD_SCHEMA = {
  type:"object",additionalProperties:false,required:["title","accent","scenes"],
  properties:{title:{type:"string",minLength:2,maxLength:28},accent:{type:"string",pattern:"^#[0-9a-fA-F]{6}$"},scenes:{type:"array",minItems:5,maxItems:5,items:{
    type:"object",additionalProperties:false,required:["headline","body","composition","elements"],properties:{
      headline:{type:"string",minLength:1,maxLength:16},body:{type:"string",minLength:1,maxLength:20},
      composition:{type:"string",enum:["grid","bars","steps","orbit","focus"]},elements:{type:"array",minItems:4,maxItems:8,items:{type:"number",minimum:0.1,maximum:1}},
    },
  }}},
};
export function storyboardSchema(count=5) {
  return { ...STORYBOARD_SCHEMA, properties: { ...STORYBOARD_SCHEMA.properties,
    scenes: { ...STORYBOARD_SCHEMA.properties.scenes, minItems: count, maxItems: count },
  } };
}
export function validateStoryboard(value:unknown,count=5):Storyboard {
  if(!value||typeof value!=="object")throw new Error("Agent returned an invalid storyboard");
  const obj=value as Record<string,unknown>;
  if(typeof obj.title!=="string"||!obj.title.trim()||Array.from(obj.title).length>28||typeof obj.accent!=="string"||!/^#[\da-f]{6}$/i.test(obj.accent)||!Array.isArray(obj.scenes)||obj.scenes.length!==count)throw new Error("Agent returned an invalid storyboard");
  const scenes=obj.scenes.map((item:unknown)=>{
    if(!item||typeof item!=="object")throw new Error("Invalid scene");
    const scene=item as Record<string,unknown>;
    if(typeof scene.headline!=="string"||!scene.headline.trim()||Array.from(scene.headline).length>16||typeof scene.body!=="string"||!scene.body.trim()||Array.from(scene.body).length>20||typeof scene.composition!=="string"||!["grid","bars","steps","orbit","focus"].includes(scene.composition)||!Array.isArray(scene.elements)||scene.elements.length<4||scene.elements.length>8||scene.elements.some(x=>typeof x!=="number"||!Number.isFinite(x)||x<0.1||x>1))throw new Error("Invalid scene");
    return {headline:scene.headline.trim(),body:scene.body.trim(),composition:scene.composition as Scene["composition"],elements:scene.elements as number[]};
  });
  return {title:obj.title.trim(),accent:obj.accent,scenes};
}
