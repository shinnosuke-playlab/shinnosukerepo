class Shop {
    constructor() {
        this.items = [];
        this.meatCount = 0;
    }

    addItem(item) {
        this.items.push(item);
    }

    purchaseItem(itemName) {
        const item = this.items.find(i => i.name === itemName);
        if (item && item.price <= this.meatCount) {
            this.meatCount -= item.price;
            item.effect();
            console.log(`${itemName}を購入しました！`);
        } else {
            console.log(`購入できません。肉が不足しています。`);
        }
    }

    addMeat(count) {
        this.meatCount += count;
        console.log(`肉が${count}個追加されました。現在の肉の数: ${this.meatCount}`);
    }

    getMeatCount() {
        return this.meatCount;
    }

    displayItems() {
        this.items.forEach(item => {
            console.log(`アイテム名: ${item.name}, 価格: ${item.price}`);
        });
    }
}

export default Shop;