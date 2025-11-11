class Animal {
    constructor(name, hp) {
        this.name = name;
        this.hp = hp;
        this.isAlive = true;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isAlive = false;
            this.onDeath();
        }
    }

    onDeath() {
        console.log(`${this.name} has died.`);
    }

    heal(amount) {
        if (this.isAlive) {
            this.hp += amount;
            console.log(`${this.name} healed for ${amount}. Current HP: ${this.hp}`);
        }
    }
}

class Chicken extends Animal {
    constructor() {
        super('Chicken', 100);
    }

    layEgg() {
        console.log(`${this.name} laid an egg!`);
    }
}

class Wolf extends Animal {
    constructor() {
        super('Wolf', 150);
    }

    attack(chicken) {
        if (this.isAlive) {
            console.log(`${this.name} attacks ${chicken.name}!`);
            chicken.takeDamage(50);
        }
    }
}

export { Animal, Chicken, Wolf };