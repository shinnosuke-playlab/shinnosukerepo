class Meat {
    constructor() {
        this.count = 0;
        this.progress = 0;
        this.maxProgress = 100; // Maximum progress before disappearing
        this.isActive = false; // Indicates if the meat is currently active
    }

    // Method to collect meat
    collect() {
        if (!this.isActive) {
            this.isActive = true;
            this.count++;
            this.updateUI();
            this.startProgress();
        }
    }

    // Method to update the UI with the current count of meat
    updateUI() {
        const meatCountElement = document.getElementById('meat-count');
        if (meatCountElement) {
            meatCountElement.textContent = this.count;
        }
    }

    // Method to start the progress of the meat
    startProgress() {
        this.progress = 0;
        const progressInterval = setInterval(() => {
            this.progress += 1;
            this.updateProgressBar();

            if (this.progress >= this.maxProgress) {
                clearInterval(progressInterval);
                this.resetMeat();
            }
        }, 100); // Update progress every 100ms
    }

    // Method to update the progress bar UI
    updateProgressBar() {
        const progressBarElement = document.getElementById('meat-progress-bar');
        if (progressBarElement) {
            progressBarElement.style.width = (this.progress / this.maxProgress) * 100 + '%';
        }
    }

    // Method to reset the meat after max progress is reached
    resetMeat() {
        this.isActive = false;
        this.progress = 0;
        this.updateProgressBar();
        // Optionally, you can add logic to remove the meat from the game
    }
}

export default Meat;