document.addEventListener('DOMContentLoaded', () => {
    const alertButton = document.getElementById('alertButton');
    if (alertButton) {
        alertButton.addEventListener('click', () => {
            alert('Thanks for visiting!');
        });
    }
    console.log("Website loaded successfully!");
});