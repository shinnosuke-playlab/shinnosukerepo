// mikey.js
class Mikey {
    constructor() {
        this.hp = 1000;
        this.speechElement = document.getElementById('mikey-speech');
        this.hpFillElement = document.getElementById('hp-fill');
        this.hpTextElement = document.getElementById('hp-text');
    }

    updateSpeech(message) {
        this.speechElement.textContent = message;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.updateHpDisplay();
        if (this.hp <= 0) {
            this.gameOver();
        }
    }

    updateHpDisplay() {
        this.hpFillElement.style.width = (this.hp / 1000) * 100 + '%';
        this.hpTextElement.textContent = `${this.hp}/1000`;
    }

    gameOver() {
        document.getElementById('game-over').style.display = 'block';
    }

    spawnMeat() {
        const meat = new Meat();
        meat.render();
    }
}

const mikey = new Mikey();
window.mikey = mikey;