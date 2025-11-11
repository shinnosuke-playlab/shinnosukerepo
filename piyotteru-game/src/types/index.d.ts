// TypeScriptの型定義ファイルです。

declare module "items/Meat" {
    export interface Meat {
        id: number;
        quantity: number;
        progress: number;
        maxProgress: number;
        collected: boolean;
        collect(): void;
        updateProgress(): void;
    }
}

declare module "shop/Shop" {
    export interface ShopItem {
        id: number;
        name: string;
        effect: string;
        cost: number;
    }

    export interface Shop {
        items: ShopItem[];
        purchaseItem(itemId: number): void;
    }
}

declare module "shop/shopItems" {
    export const shopItems: ShopItem[];
}