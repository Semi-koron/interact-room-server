import { supabase } from "../supabase.js";

/** Supabaseから取得するレシピ情報 */
export interface RecipeRequirement {
  materialId: number;
  materialName: string;
  requiredCount: number;
}

export interface RecipeInfo {
  id: number;
  name: string;
  goalItemId: number;
  requirements: RecipeRequirement[];
}

/** ロビーで待機中のプレイヤー */
export interface WaitingPlayer {
  socketId: string;
  userId: string;
  materialId: number;
}

/** 合言葉で管理されるロビールーム */
interface LobbyRoom {
  passphrase: string;
  recipeId: number;
  recipeName: string;
  hostSocketId: string;
  players: Map<string, WaitingPlayer>;
}

/** マッチング結果 */
export interface MatchResult {
  recipeId: number;
  recipeName: string;
  goalItemId: number;
  players: WaitingPlayer[];
}

export class Lobby {
  /** recipeId → レシピ情報 (キャッシュ) */
  private recipes: Map<number, RecipeInfo> = new Map();
  /** materialId → 素材名 (キャッシュ) */
  private materialNames: Map<number, string> = new Map();
  /** passphrase → LobbyRoom */
  private rooms: Map<string, LobbyRoom> = new Map();
  /** socketId → passphrase (逆引き) */
  private playerRooms: Map<string, string> = new Map();

  /** Supabaseからレシピデータを読み込む */
  async loadRecipes(): Promise<void> {
    // 素材名を取得
    const { data: materials, error: matError } = await supabase
      .from("material")
      .select("id, material_name");

    if (matError || !materials) {
      console.error("[Lobby] Failed to load materials:", matError);
      return;
    }

    for (const m of materials) {
      this.materialNames.set(m.id as number, m.material_name as string);
    }

    const { data: recipes, error: recipeError } = await supabase
      .from("recipe")
      .select("id, name");

    if (recipeError || !recipes) {
      console.error("[Lobby] Failed to load recipes:", recipeError);
      return;
    }

    const { data: ingredients, error: ingError } = await supabase
      .from("recipe_ingredient")
      .select("recipe_id, material_id, required_count");

    if (ingError || !ingredients) {
      console.error("[Lobby] Failed to load recipe_ingredients:", ingError);
      return;
    }

    // サーバー用アイテムIDを取得
    const { data: furnitureIds, error: fIdError } = await supabase
      .from("server_funiture_id")
      .select("recipe_id, server_funiture_id");

    if (fIdError || !furnitureIds) {
      console.error("[Lobby] Failed to load server_funiture_id:", fIdError);
      return;
    }

    // recipe_id → server_funiture_id のマップ
    const goalItemMap = new Map<number, number>();
    for (const f of furnitureIds) {
      goalItemMap.set(f.recipe_id as number, f.server_funiture_id as number);
    }

    for (const recipe of recipes) {
      const reqs = ingredients
        .filter((i) => i.recipe_id === recipe.id)
        .map((i) => ({
          materialId: i.material_id as number,
          materialName: this.materialNames.get(i.material_id as number) ?? `素材#${i.material_id}`,
          requiredCount: i.required_count as number,
        }));

      const goalItemId = goalItemMap.get(recipe.id as number) ?? recipe.id as number;

      this.recipes.set(recipe.id as number, {
        id: recipe.id as number,
        name: recipe.name as string,
        goalItemId,
        requirements: reqs,
      });
    }

    console.log(`[Lobby] Loaded ${this.recipes.size} recipes, ${this.materialNames.size} materials`);
  }

  /** レシピ一覧を返す */
  getRecipes(): RecipeInfo[] {
    return Array.from(this.recipes.values());
  }

  /** ユーザーのmaterialIdをSupabaseから取得 */
  async getUserMaterial(userId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from("user_data")
      .select("item_id")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.error("[Lobby] Failed to get user material:", error);
      return null;
    }

    return data.item_id as number;
  }

  /** JWTからユーザーIDを取得 */
  async authenticateUser(accessToken: string): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      console.error("[Auth] Failed to authenticate:", error?.message);
      return null;
    }
    return data.user.id;
  }

  /** ホストがレシピを選んでロビーを作成 */
  createRoom(
    passphrase: string,
    recipeId: number,
    hostSocketId: string,
    hostUserId: string,
    hostMaterialId: number,
  ): { ok: boolean; message: string } {
    if (this.rooms.has(passphrase)) {
      return { ok: false, message: "Passphrase already in use" };
    }

    const recipe = this.recipes.get(recipeId);
    if (!recipe) {
      return { ok: false, message: "Invalid recipe" };
    }

    // ホストの素材がレシピに必要か確認
    const needed = recipe.requirements.some((r) => r.materialId === hostMaterialId);
    if (!needed) {
      return { ok: false, message: "Your material is not required for this recipe" };
    }

    const room: LobbyRoom = {
      passphrase,
      recipeId,
      recipeName: recipe.name,
      hostSocketId,
      players: new Map(),
    };

    // ホストを追加
    room.players.set(hostSocketId, {
      socketId: hostSocketId,
      userId: hostUserId,
      materialId: hostMaterialId,
    });

    this.rooms.set(passphrase, room);
    this.playerRooms.set(hostSocketId, passphrase);

    console.log(
      `[Lobby] Room created: "${passphrase}" (recipe: ${recipe.name}, host: ${hostSocketId})`,
    );

    return { ok: true, message: "Room created" };
  }

  /** 合言葉でロビーに参加 */
  joinRoom(
    passphrase: string,
    socketId: string,
    userId: string,
    materialId: number,
  ): { ok: boolean; message: string } {
    const room = this.rooms.get(passphrase);
    if (!room) {
      return { ok: false, message: "Room not found" };
    }

    // 参加者の素材がレシピに必要か確認
    const recipe = this.recipes.get(room.recipeId);
    if (recipe) {
      const needed = recipe.requirements.some((r) => r.materialId === materialId);
      if (!needed) {
        return { ok: false, message: "Your material is not required for this recipe" };
      }
    }

    room.players.set(socketId, { socketId, userId, materialId });
    this.playerRooms.set(socketId, passphrase);

    console.log(`[Lobby] Player joined: ${socketId} → "${passphrase}"`);
    return { ok: true, message: "Joined room" };
  }

  /** プレイヤーをロビーから削除 */
  removePlayer(socketId: string): void {
    const passphrase = this.playerRooms.get(socketId);
    if (!passphrase) return;

    const room = this.rooms.get(passphrase);
    if (room) {
      room.players.delete(socketId);
      // 全員いなくなったらルーム削除
      if (room.players.size === 0) {
        this.rooms.delete(passphrase);
        console.log(`[Lobby] Room deleted: "${passphrase}"`);
      }
    }
    this.playerRooms.delete(socketId);
  }

  /** ロビールームの状況を返す */
  getRoomStatus(passphrase: string): {
    recipeName: string;
    players: Array<{ socketId: string; materialId: number; materialName: string }>;
    requirements: RecipeRequirement[];
    ready: boolean;
  } | null {
    const room = this.rooms.get(passphrase);
    if (!room) return null;

    const recipe = this.recipes.get(room.recipeId);
    if (!recipe) return null;

    const ready = this.checkReady(room, recipe);

    return {
      recipeName: room.recipeName,
      players: Array.from(room.players.values()).map((p) => ({
        socketId: p.socketId,
        materialId: p.materialId,
        materialName: this.materialNames.get(p.materialId) ?? `素材#${p.materialId}`,
      })),
      requirements: recipe.requirements,
      ready,
    };
  }

  /** マッチング条件を満たしているか確認 */
  private checkReady(room: LobbyRoom, recipe: RecipeInfo): boolean {
    const materialCounts = new Map<number, number>();
    for (const p of room.players.values()) {
      materialCounts.set(p.materialId, (materialCounts.get(p.materialId) ?? 0) + 1);
    }

    for (const req of recipe.requirements) {
      const count = materialCounts.get(req.materialId) ?? 0;
      if (count < req.requiredCount) return false;
    }

    return true;
  }

  /** マッチング試行 → 成功ならMatchResultを返す */
  tryMatch(passphrase: string): MatchResult | null {
    const room = this.rooms.get(passphrase);
    if (!room) return null;

    const recipe = this.recipes.get(room.recipeId);
    if (!recipe) return null;

    if (!this.checkReady(room, recipe)) return null;

    const players = Array.from(room.players.values());

    // ロビールーム削除
    for (const p of players) {
      this.playerRooms.delete(p.socketId);
    }
    this.rooms.delete(passphrase);

    return {
      recipeId: room.recipeId,
      recipeName: room.recipeName,
      goalItemId: recipe.goalItemId,
      players,
    };
  }

  /** socketIdが属するpassphraseを返す */
  getPlayerRoom(socketId: string): string | undefined {
    return this.playerRooms.get(socketId);
  }
}
