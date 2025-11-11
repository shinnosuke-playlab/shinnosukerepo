class Meat {
    constructor() {
        this.count = 0;
        this.progress = 0;
        this.maxProgress = 100; // Maximum progress before disappearing
    }

    collect() {
        this.count++;
        this.progress = 0; // Reset progress on collection
        this.updateUI();
    }

    updateProgress() {
        if (this.progress < this.maxProgress) {
            this.progress++;
            this.updateUI();
        } else {
            this.resetProgress();
        }
    }

    resetProgress() {
        this.progress = 0; // Reset progress after reaching max
        // Additional logic can be added here if needed
    }

    updateUI() {
        const meatCountElement = document.getElementById('meat-count');
        const meatProgressBar = document.getElementById('meat-progress-bar');

        if (meatCountElement) {
            meatCountElement.textContent = this.count;
        }

        if (meatProgressBar) {
            meatProgressBar.style.width = `${(this.progress / this.maxProgress) * 100}%`;
        }
    }
}

export { Meat };