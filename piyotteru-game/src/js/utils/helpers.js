// ユーティリティ関数を定義するファイルです。共通の処理やヘルパー関数が含まれています。

export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

export function updateProgressBar(progressBar, value, max) {
    const percentage = (value / max) * 100;
    progressBar.style.width = `${percentage}%`;
}