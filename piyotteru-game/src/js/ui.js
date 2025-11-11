const ui = {
    eggCount: 0,
    chickCount: 0,
    chickenCount: 0,
    meatCount: 0,
    meatProgress: 0,
    maxMeatProgress: 100,

    updateStats() {
        document.getElementById('egg-count').innerText = this.eggCount;
        document.getElementById('chick-count').innerText = this.chickCount;
        document.getElementById('chicken-count').innerText = this.chickenCount;
        document.getElementById('meat-count').innerText = this.meatCount;
        this.updateMeatProgressBar();
    },

    updateMeatProgressBar() {
        const progressBar = document.getElementById('meat-progress');
        progressBar.style.width = `${(this.meatProgress / this.maxMeatProgress) * 100}%`;
        if (this.meatProgress >= this.maxMeatProgress) {
            this.resetMeatProgress();
        }
    },

    resetMeatProgress() {
        this.meatProgress = 0;
        // Additional logic for removing meat from the game can be added here
    },

    collectMeat() {
        this.meatCount++;
        this.meatProgress += 10; // Increment progress by 10 for each meat collected
        this.updateStats();
    },

    purchaseItem(item) {
        // Logic for purchasing items from the shop
        // This will depend on the item and its effects
    },

    // Additional UI update methods can be added here
};

document.getElementById('meat-btn').addEventListener('click', () => {
    ui.collectMeat();
});

// Initial UI update
ui.updateStats();