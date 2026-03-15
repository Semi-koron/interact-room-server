export class Item {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly number: number,
  ) {}

  consume(amount: number): Item | null {
    if (amount >= this.number) {
      return null;
    }
    return new Item(this.id, this.name, this.number - amount);
  }
}
