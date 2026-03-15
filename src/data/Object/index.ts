import type { ObjectDef } from "../types";

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
          workload: 20,
        },
        {
          consumeItemIds: [],
          getItemIds: [101],
          requireItemIds: [902],
          workload: 4,
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
          workload: 100,
        },
        {
          consumeItemIds: [],
          getItemIds: [102],
          requireItemIds: [902],
          workload: 20,
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
          getItemIds: [105],
          requireItemIds: [902],
          workload: 50,
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
          getItemIds: [103],
          requireItemIds: [903],
          workload: 30,
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
          getItemIds: [104],
          requireItemIds: [],
          workload: 50,
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
          consumeItemIds: [101, 101, 101, 101, 101],
          getItemIds: [201],
          requireItemIds: [],
          workload: 4,
        },
        {
          consumeItemIds: [101, 101, 101, 101, 101],
          getItemIds: [202],
          requireItemIds: [],
          workload: 4,
        },
        {
          consumeItemIds: [102, 102, 102],
          getItemIds: [204],
          requireItemIds: [],
          workload: 4,
        },
        {
          consumeItemIds: [104, 104, 104],
          getItemIds: [206],
          requireItemIds: [],
          workload: 4,
        },
        {
          consumeItemIds: [104, 104, 104],
          getItemIds: [207],
          requireItemIds: [],
          workload: 4,
        },
        {
          consumeItemIds: [
            201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 202, 202, 202,
            202, 202, 202, 202, 202, 202, 202, 209, 209, 209,
          ],
          getItemIds: [301],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [
            201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 204, 204, 204,
            204, 204, 204, 204, 204, 204, 204, 209, 209, 209,
          ],
          getItemIds: [302],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [
            201, 201, 201, 201, 201, 201, 201, 202, 202, 202, 202, 202, 202,
            202, 206, 206, 206, 206, 207, 207, 207, 207, 209, 209, 209,
          ],
          getItemIds: [303],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [
            201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201,
            201, 201, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202,
            202, 202, 202, 202, 206, 206, 206, 206, 206, 206, 206, 206, 206,
            209, 209, 209, 209, 209, 209, 209, 209, 209,
          ],
          getItemIds: [304],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [
            201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 201,
            201, 201, 201, 201, 201, 201, 201, 202, 202, 202, 202, 202, 202,
            202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202,
            202, 206, 206, 206, 206, 26, 206, 206, 206, 206, 206, 207, 207, 207,
            207, 207, 207, 207, 207, 207, 207, 209, 209, 209, 209, 209,
          ],
          getItemIds: [305],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [
            202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202,
            202, 202, 202, 202, 202, 202, 202, 205, 205, 205, 205, 205, 205,
            209, 209, 209,
          ],
          getItemIds: [306],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [
            201, 201, 201, 201, 201, 201, 201, 201, 201, 201, 206, 206, 206,
            206, 206, 206, 206, 206, 206, 206, 206, 206, 206, 206, 206, 206,
            206, 206, 206, 206, 208, 208, 208,
          ],
          getItemIds: [307],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [],
          getItemIds: [308],
          requireItemIds: [
            201, 201, 201, 201, 201, 205, 205, 205, 205, 205, 205, 205, 205,
            205, 205, 205, 205, 205, 205, 205, 205, 205, 205, 205, 205, 208,
            208, 208,
          ],
          workload: 30,
        },
        {
          consumeItemIds: [
            202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202,
            202, 202, 208, 208, 209,
          ],
          getItemIds: [309],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [
            202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202, 202,
            202, 202, 202, 202, 202, 202, 202, 205, 205, 205, 205, 205, 205,
            209, 209, 209,
          ],
          getItemIds: [310],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [
            205, 205, 205, 104, 104, 104, 104, 104, 104, 104, 104, 104, 104,
            104, 104, 104, 104, 104,
          ],
          getItemIds: [311],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [
            204, 204, 204, 204, 204, 204, 206, 206, 206, 206, 206, 206, 206,
            206, 206, 206, 206, 206, 206, 206, 206, 206, 206, 206, 206, 206,
            206, 206, 206, 206, 206, 206, 206, 206, 206, 206,
          ],
          getItemIds: [312],
          requireItemIds: [],
          workload: 30,
        },
        {
          consumeItemIds: [201, 201, 204, 204],
          getItemIds: [901],
          requireItemIds: [],
          workload: 12,
        },
        {
          consumeItemIds: [201, 201, 204, 204],
          getItemIds: [902],
          requireItemIds: [],
          workload: 12,
        },
        {
          consumeItemIds: [202, 202, 202, 202],
          getItemIds: [903],
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
          consumeItemIds: [101, 101],
          getItemIds: [203],
          requireItemIds: [],
          workload: 9,
        },
        {
          consumeItemIds: [103, 103, 103],
          getItemIds: [205],
          requireItemIds: [],
          workload: 12,
        },
        {
          consumeItemIds: [105],
          getItemIds: [208],
          requireItemIds: [],
          workload: 12,
        },
        {
          consumeItemIds: [105],
          getItemIds: [209],
          requireItemIds: [],
          workload: 12,
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
          consumeItemIds: [201, 201, 202, 202],
          getItemIds: [],
          requireItemIds: [],
          workload: 10,
        },
      ],
    },
  ],

  // ── 道具系オブジェクト ──
]);
