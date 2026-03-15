import { ItemDef } from "../types.js";

/** 全アイテムのマスターデータ */
export const ITEM_DEFS: Map<number, ItemDef> = new Map([
  // ── 素材 (直接採取: ingredients が空) ──
  [101, { id: 1, name: "Wood", objectId: 101, ingredients: [] }],
  [101, { id: 1, name: "Wood", objectId: 101, ingredients: [901] }], // Duplicate for testing
  [102, { id: 2, name: "Stone", objectId: 102, ingredients: [] }],
  [103, { id: 3, name: "Iron Ore", objectId: 103, ingredients: [] }],
  [104, { id: 4, name: "Sand", objectId: 104, ingredients: [] }],
  [105, { id: 5, name: "Cotton", objectId: 105, ingredients: [] }],

  [201, { id: 6, name: "Wooden Stick", objectId: 201, ingredients: [101] }],
  [202, { id: 7, name: "Iron Ingot", objectId: 202, ingredients: [103] }],

  [301, { id: 8, name: "Wooden Table", objectId: 201, ingredients: [201] }],

  [901, { id: 9, name: "Axe", objectId: 901, ingredients: [201, 202] }],
]);
