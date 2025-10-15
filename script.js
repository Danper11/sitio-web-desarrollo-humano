// --- 1. Selección de Elementos del HTML ---
const startButton = document.getElementById('start-button');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');

console.log('¡El script se ha cargado correctamente!');
console.log('¡Listo para comenzar la AventuRRRa!');

// --- 2. Eventos ---
// La lógica para iniciar el juego no necesita cambiar.
// Sigue funcionando igual que antes.
startButton.addEventListener('click', () => {
    console.log('¡Botón de inicio presionado! Que comience el juego.');

    // Ocultamos la bienvenida del juego
    startScreen.classList.add('hidden');

    // Mostramos la pantalla principal del juego
    gameScreen.classList.remove('hidden');

    // En el futuro, aquí iniciaremos la lógica del juego
    // startGame();
});

// --- 3. Funciones del Juego ---
/*
    function startGame() {
        // La lógica del juego irá aquí, como se planeó antes.
        // Por ejemplo: crear los contenedores y el primer objeto a reciclar.
    }
*/