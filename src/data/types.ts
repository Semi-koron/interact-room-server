/** アイテムのマスターデータ定義 */
export interface ItemDef {
  id: number;
  name: string;
  /** 入手/加工に使うWorldObjectのID */
  objectId: number;
  /** 必要な原材料のitemID一覧 (空 = 直接採取) */
  ingredients: number[];
}

/** Processのマスターデータ定義 */
export interface ProcessDef {
  /** 消費するアイテムID一覧 */
  consumeItemIds: number[];
  /** 獲得するアイテムID一覧 */
  getItemIds: number[];
  /** 必要だが消費しないアイテムID一覧 */
  requireItemIds: number[];
  /** 作業完了までの時間 */
  workload: number;
}

/** オブジェクトのマスターデータ定義 */
export interface ObjectDef {
  id: number;
  name: string;
  /** インタラクト可能な距離 */
  reach: number;
  /** このオブジェクトで実行可能なProcess一覧 */
  processes: ProcessDef[];
}

/** 家具のマスターデータ定義 */
export interface FurnitureDef {
  id: number;
  name: string;
  /** 完成に必要なアイテムのitemID一覧 */
  recipe: number[];
  /** クラフト時にインタラクトするWorldObjectのID */
  requiredObjectId: number;
}
