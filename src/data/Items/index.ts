import type { ItemDef } from "../types";

/** 全アイテムのマスターデータ */
export const ITEM_DEFS: Map<number, ItemDef> = new Map([
  // ── 素材 (直接採取: ingredients が空) ──
  [101, { id: 1, name: "Wood", objectId: 101, ingredients: [] }],
  [101, { id: 2, name: "Wood", objectId: 101, ingredients: [901] }],
  [102, { id: 3, name: "Stone", objectId: 102, ingredients: [] }],
  [102, { id: 4, name: "Stone", objectId: 102, ingredients: [902] }],
  [103, { id: 6, name: "Sand", objectId: 104, ingredients: [903] }],
  [104, { id: 7, name: "Cotton Plant", objectId: 105, ingredients: [] }],
  [105, { id: 8, name: "Iron Ore", objectId: 103, ingredients: [902] }],

  [201, { id: 9, name: "Wooden Stick", objectId: 201, ingredients: [101,101,101,101,101] }],
  [202, { id: 10, name: "Wooden Plate", objectId: 201, ingredients: [101,101,101,101,101] }],
  [203, { id: 11, name: "Charcoal", objectId: 202, ingredients: [101,101] }],
  [204, { id: 12, name: "Stone Ingot", objectId: 201, ingredients: [102,102,102] }],
  [205, { id: 13, name: "Glass", objectId: 202, ingredients: [103,103,103] }],
  [206, { id: 14, name: "Cloth", objectId: 201, ingredients: [104,104,104] }],
  [207, { id: 15, name: "Cotton", objectId: 201, ingredients: [104,104,104] }],
  [208, { id: 16, name: "Iron Ingot", objectId: 202, ingredients: [105] }],
  [209, { id: 17, name: "Iron Nail", objectId: 202, ingredients: [105] }],
 

  [301, { id: 18, name: "Wooden Table", objectId: 201, ingredients: [201,201,201,201,201,201,201,201,201,201,202,202,202,202,202,202,202,202,202,202,209,209,209] }],
  [302, { id: 19, name: "Stone Table", objectId: 201, ingredients: [201,201,201,201,201,201,201,201,201,201,204,204,204,204,204,204,204,204,204,204,209,209,209] }],
  [303, { id: 20, name: "Chair", objectId: 201, ingredients: [201,201,201,201,201,201,201,202,202,202,202,202,202,202,206,206,206,206,207,207,207,207,209,209,209] }],
  [304, { id: 21, name: "Sofa", objectId: 201, ingredients: [201,201,201,201,201,201,201,201,201,201,201,201,201,201,201,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,206,206,206,206,206,206,206,206,206,209,209,209,209,209,209,209,209,209] }],
  [305, { id: 22, name: "Bed", objectId: 201, ingredients: [201,201,201,201,201,201,201,201,201,201,201,201,201,201,201,201,201,201,201,201,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,206,206,206,206,26,206,206,206,206,206,207,207,207,207,207,207,207,207,207,207,209,209,209,209,209] }],
  [306, { id: 23, name: "Bookshelf", objectId: 201, ingredients: [202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,205,205,205,205,205,205,209,209,209] }],
  [307, { id: 24, name: "Curtain", objectId: 201, ingredients: [201,201,201,201,201,201,201,201,201,201,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,208,208,208] }],
  [308, { id: 25, name: "Window Grass", objectId: 201, ingredients: [201,201,201,201,201,205,205,205,205,205,205,205,205,205,205,205,205,205,205,205,205,205,205,205,205,208,208,208] }],
  [309, { id: 26, name: "Door", objectId: 201, ingredients: [202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,208,208,209] }],
  [310, { id: 27, name: "Shelf", objectId: 201, ingredients: [202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,205,205,205,205,205,205,209,209,209] }],
  [311, { id: 28, name: "Vase", objectId: 201, ingredients: [205,205,205,104,104,104,104,104,104,104,104,104,104,104,104,104,104,104] }],
  [312, { id: 29, name: "Carpet", objectId: 201, ingredients: [204,204,204,204,204,204,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206,206] }],


  [901, { id: 30, name: "Pickaxe", objectId: 201, ingredients: [201, 201, 204, 204] }],
  [902, { id: 31, name: "Axe", objectId: 201, ingredients: [201, 201, 204, 204] }],
  [903, { id: 32, name: "Bucket", objectId: 201, ingredients: [202,202,202,202] }],
]);
