import { Item } from "./Item";

export class Inventory {
  readonly items: Map<number, Item> = new Map();

  /** アイテムをインベントリに追加する */
  addItem(item: Item): void {
    const existing = this.items.get(item.id);
    if (existing) {
      this.items.set(
        item.id,
        new Item(item.id, item.name, existing.number + item.number),
      );
    } else {
      this.items.set(item.id, item);
    }
  }

  /** アイテムを消費する (数が足りなければfalse) */
  consumeItem(itemId: number, amount: number): boolean {
    const item = this.items.get(itemId);
    if (!item || item.number < amount) return false;
    const newItem = item.consume(amount);
    if (newItem) {
      this.items.set(itemId, newItem);
    } else {
      this.items.delete(itemId);
    }
    return true;
  }

  /** 指定アイテムが必要数あるかチェック */
  hasItems(requirements: Item[]): boolean {
    for (const req of requirements) {
      const item = this.items.get(req.id);
      if (!item || item.number < req.number) return false;
    }
    return true;
  }

  /** 複数アイテムを消費して複数アイテムを獲得する */
  transformItems(consumeItems: Item[], getItems: Item[]): boolean {
    if (!this.hasItems(consumeItems)) return false;
    for (const consume of consumeItems) {
      this.consumeItem(consume.id, consume.number);
    }
    for (const get of getItems) {
      this.addItem(get);
    }
    return true;
  }

  /** シリアライズ用 */
  serialize(): Array<{ id: number; name: string; number: number }> {
    return Array.from(this.items.values()).map((item) => ({
      id: item.id,
      name: item.name,
      number: item.number,
    }));
  }
}
