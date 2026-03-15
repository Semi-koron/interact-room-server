import { ObjectDef } from "../types";

/** 全WorldObjectのマスターデータ */
export const OBJECT_DEFS: Map<number, ObjectDef> = new Map([
  // ── 採取系オブジェクト ──
  [
    101,
    {
      id: 101,
      name: "Tree",
      reach: 3,
      processes: [
        {
          consumeItemIds: [],
          getItemIds: [101],
          requireItemIds: [],
          workload: 10,
        },
      ],
    },
  ],
  [
    102,
    {
      id: 102,
      name: "Rock",
      reach: 3,
      processes: [
        {
          consumeItemIds: [],
          getItemIds: [102],
          requireItemIds: [],
          workload: 6,
        },
      ],
    },
  ],
  [
    103,
    {
      id: 103,
      name: "Iron Vein",
      reach: 3,
      processes: [
        {
          consumeItemIds: [],
          getItemIds: [103],
          requireItemIds: [],
          workload: 9,
        },
      ],
    },
  ],
  [
    104,
    {
      id: 104,
      name: "Sand Pit",
      reach: 3,
      processes: [
        {
          consumeItemIds: [],
          getItemIds: [104],
          requireItemIds: [],
          workload: 3,
        },
      ],
    },
  ],
  [
    105,
    {
      id: 105,
      name: "Cotton Plant",
      reach: 3,
      processes: [
        {
          consumeItemIds: [],
          getItemIds: [105],
          requireItemIds: [],
          workload: 3,
        },
      ],
    },
  ],

  // ── 加工系オブジェクト (常に真ん中に配置) ──
  [
    201,
    {
      id: 201,
      name: "Crafting Table",
      reach: 3,
      processes: [
        {
          consumeItemIds: [101],
          getItemIds: [201],
          requireItemIds: [],
          workload: 6,
        },
        {
          consumeItemIds: [201],
          getItemIds: [301],
          requireItemIds: [],
          workload: 12,
        },
      ],
    },
  ],
  [
    202,
    {
      id: 202,
      name: "Smelter",
      reach: 3,
      processes: [
        {
          consumeItemIds: [103],
          getItemIds: [202],
          requireItemIds: [],
          workload: 9,
        },
      ],
    },
  ],

  // ── 川系オブジェクト ──
  [
    301,
    {
      id: 301,
      name: "Bridge Post",
      reach: 3,
      processes: [
        {
          consumeItemIds: [201, 201, 201, 201, 201],
          getItemIds: [],
          requireItemIds: [],
          workload: 10,
        },
      ],
    },
  ],

  // ── 道具系オブジェクト ──
  [
    901,
    {
      id: 901,
      name: "Tool Bench",
      reach: 3,
      processes: [
        {
          consumeItemIds: [201, 202],
          getItemIds: [901],
          requireItemIds: [],
          workload: 12,
        },
      ],
    },
  ],
]);
