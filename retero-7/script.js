(function() {
            // Prevents the script from running in non-browser environments or if it's already been loaded.
            if (typeof window === 'undefined' || window.gameWidgetLoaded) {
                return;
            }
            window.gameWidgetLoaded = true;

            // --- GAME STATE & LOGIC ---
            let canvas, ctx, player, camera, controls, gameLoopId;
            

            //official
            var playerState = {
                x: 250,
                y: 250,
                width: 48,
                height: 48,
                speed: 3,
                color: '#3498db',
                currentSpriteState: [0,0,48,48]
            };
            var bro = {
                x: 350,
                y: 250,
                width: 48,
                height: 48,
                speed: 3,
                color: '#3498db',
                currentSpriteState: [144,0,48,48]
            };
            var cameraState = {
                x: 0,
                y: 0,
            };
            var controlState = {
                up: false,
                down: false,
                left: false,
                right: false,
                select: false
            };
            var entities=[playerState, bro]

            function update(controlState, playerState, cameraState) {
                if (controlState.up) playerState.y -= playerState.speed;
                if (controlState.down) playerState.y += playerState.speed;
                if (controlState.left) playerState.x -= playerState.speed;
                if (controlState.right) playerState.x += playerState.speed;
                
                // Update camera to follow the player, centering them on screen
                cameraState.x = playerState.x - canvas.width / 2;
                cameraState.y = playerState.y - canvas.height / 2;

                if (controlState.select) {
                    // Flash color on select press
                    playerState.color = playerState.color === '#e74c3c' ? '#3498db' : '#e74c3c';
                    controlState.select = false; // Reset after one action
                }
                return [controlState, playerState, cameraState]
            }//0 dependencies

            
            function draw(ctx, canvas, entities, cameraState, baseImage) {
                // Clear the entire canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // --- Draw world elements relative to the camera ---
                ctx.save();
                ctx.translate(-cameraState.x, -cameraState.y);

                // Draw a simple grid for visual reference (optional, kept from original)
                ctx.strokeStyle = '#404040';
                ctx.lineWidth = 1;
                const gridSize = 50;
                const startX = Math.floor(cameraState.x / gridSize) * gridSize;
                const startY = Math.floor(cameraState.y / gridSize) * gridSize;
                const endX = startX + canvas.width + gridSize;
                const endY = startY + canvas.height + gridSize;

                for (let x = startX; x < endX; x += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(x, startY);
                    ctx.lineTo(x, endY);
                    ctx.stroke();
                }
                for (let y = startY; y < endY; y += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(startX, y);
                    ctx.lineTo(endX, y);
                    ctx.stroke();
                }

                // --- Draw all entities ---
                entities.forEach(entity => {

                    if (entity.currentSpriteState) {

                        const [sx, sy, sWidth, sHeight] = entity.currentSpriteState;
                        //console.log('eee')
                        // The destination properties are on the entity itself
                        const { x, y, width, height } = entity;

                        // Use the 9-argument version of drawImage to render the cropped sprite
                        ctx.drawImage(
                            baseImage,    // The source spritesheet image
                            sx,           // The x-coordinate of the top-left corner of the sub-rectangle in the source image
                            sy,           // The y-coordinate of the top-left corner of the sub-rectangle in the source image
                            sWidth,       // The width of the sub-rectangle in the source image
                            sHeight,      // The height of the sub-rectangle in the source image
                            // Use Math.floor() or Math.round() on destination coordinates
                            Math.floor(x),
                            Math.floor(y), // The y-coordinate in the destination canvas where the image will be placed
                            width,        // The width to draw the image in the destination canvas (allows for scaling)
                            height        // The height to draw the image in the destination canvas (allows for scaling)
                        );
                    } else {
                         if(!baseImage.complete){
                            console.error('fail')
                        }
                         ctx.fillStyle = entity.color || 'red'; // Default to red if no color
                         ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
                    }
                });

                ctx.restore();
            }//0 dependencies

            
            
            
            
            function handleKeyDown(e) {
                if (e.key === 'ArrowUp') controlState.up = true;
                if (e.key === 'ArrowDown') controlState.down = true;
                if (e.key === 'ArrowLeft') controlState.left = true;
                if (e.key === 'ArrowRight') controlState.right = true;
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    controlState.select = true;
                }
            }
            
            function handleKeyUp(e) {
                if (e.key === 'ArrowUp') controlState.up = false;
                if (e.key === 'ArrowDown') controlState.down = false;
                if (e.key === 'ArrowLeft') controlState.left = false;
                if (e.key === 'ArrowRight') controlState.right = false;
            }
            
            /**
             * Handles touch/mouse events for on-screen controls.
             */
            function handleControlButton(button, state) {
                return (e) => {
                    e.preventDefault();
                    controlState[button] = state;
                    e.currentTarget.classList.toggle('active', state);
                };
            }
            function handleResize() {
                const container = document.querySelector('.game-widget-container');
                if (!container || !canvas) return;

                const isPortrait = window.innerHeight > window.innerWidth;

                if (isPortrait && window.innerWidth < 768) { // Simple mobile check
                    container.className = 'game-widget-container mobile-portrait';
                } else {
                    container.className = 'game-widget-container desktop-mode';
                }
                
                // To maintain crisp pixels, we set the canvas internal resolution
                // and let CSS handle the scaling. A fixed internal resolution can
                // create a retro feel.
                canvas.width = 480; 
                canvas.height = 270;
            }
            function initializeGame() {
                canvas = document.getElementById('gameCanvas');
                ctx = canvas.getContext('2d');
                const SPRITESHEET_PATH = 'assets/People1.png';
                
                handleResize(); // Set initial size and layout
                ctx.imageSmoothingEnabled = false;


                // --- ASSET LOADER (using the Promise function) ---
                
                // Add all event listeners
                window.addEventListener('resize', handleResize);
                document.addEventListener('keydown', handleKeyDown);
                document.addEventListener('keyup', handleKeyUp);
                
                // On-screen controls
                const dpadUp = document.querySelector('.dpad-up');
                const dpadDown = document.querySelector('.dpad-down');
                const dpadLeft = document.querySelector('.dpad-left');
                const dpadRight = document.querySelector('.dpad-right');
                const selectBtn = document.querySelector('.game-widget-select-btn');

                if (dpadUp) {
                    dpadUp.addEventListener('mousedown', handleControlButton('up', true));
                    dpadUp.addEventListener('mouseup', handleControlButton('up', false));
                    dpadUp.addEventListener('mouseleave', handleControlButton('up', false));
                    dpadUp.addEventListener('touchstart', handleControlButton('up', true), { passive: false });
                    dpadUp.addEventListener('touchend', handleControlButton('up', false));
                    
                    dpadDown.addEventListener('mousedown', handleControlButton('down', true));
                    dpadDown.addEventListener('mouseup', handleControlButton('down', false));
                    dpadDown.addEventListener('mouseleave', handleControlButton('down', false));
                    dpadDown.addEventListener('touchstart', handleControlButton('down', true), { passive: false });
                    dpadDown.addEventListener('touchend', handleControlButton('down', false));
                    
                    dpadLeft.addEventListener('mousedown', handleControlButton('left', true));
                    dpadLeft.addEventListener('mouseup', handleControlButton('left', false));
                    dpadLeft.addEventListener('mouseleave', handleControlButton('left', false));
                    dpadLeft.addEventListener('touchstart', handleControlButton('left', true), { passive: false });
                    dpadLeft.addEventListener('touchend', handleControlButton('left', false));
                    
                    dpadRight.addEventListener('mousedown', handleControlButton('right', true));
                    dpadRight.addEventListener('mouseup', handleControlButton('right', false));
                    dpadRight.addEventListener('mouseleave', handleControlButton('right', false));
                    dpadRight.addEventListener('touchstart', handleControlButton('right', true), { passive: false });
                    dpadRight.addEventListener('touchend', handleControlButton('right', false));

                    // A simple handler for the release event that just affects UI
                    const handleSelectRelease = (e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('active');
                    };
                    
                    selectBtn.addEventListener('mousedown', handleControlButton('select', true));
                    selectBtn.addEventListener('mouseup', handleSelectRelease);
                    selectBtn.addEventListener('mouseleave', handleSelectRelease);
                    selectBtn.addEventListener('touchstart', handleControlButton('select', true), { passive: false });
                    selectBtn.addEventListener('touchend', handleSelectRelease);
                }
                
                // Start the game loop
                loadImage(SPRITESHEET_PATH).then(spritesheetImage => {
                    function gameLoop() {
                        [controlState, playerState, cameraState]=update(controlState, playerState, cameraState);
                        draw(ctx, canvas, entities, cameraState, spritesheetImage);

                        gameLoopId = requestAnimationFrame(gameLoop);
                    }
                    gameLoop();

                }).catch(error => {
                    // FAILURE! This code runs if the image path was wrong or another error occurred.
                    console.error(error);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'red';
                    ctx.fillText("Error: Could not load assets. Check console.", 50, 50);
                });
                
            }
            function closeGame() {
                cancelAnimationFrame(gameLoopId);
                
                // Remove event listeners
                window.removeEventListener('resize', handleResize);
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('keyup', handleKeyUp);
                
                // Remove modal from DOM
                const modal = document.querySelector('.game-widget-modal-overlay');
                if (modal) {
                    modal.remove();
                }
                
                // Reset state
                Object.keys(controlState).forEach(key => controlState[key] = false);
            }
            function createGameWindow() {
                const modalOverlay = document.createElement('div');
                modalOverlay.className = 'game-widget-modal-overlay';
                modalOverlay.innerHTML = `
                    <div class="game-widget-container">
                        <button class="game-widget-close-button">&times;</button>
                        <canvas id="gameCanvas" class="game-widget-canvas"></canvas>
                        <div class="game-widget-controls">
                            <div class="game-widget-dpad">
                                <div class="game-widget-dpad-btn dpad-up">&#9650;</div>
                                <div class="game-widget-dpad-btn dpad-down">&#9660;</div>
                                <div class="game-widget-dpad-btn dpad-left">&#9664;</div>
                                <div class="game-widget-dpad-btn dpad-right">&#9654;</div>
                            </div>
                            <div class="game-widget-action-buttons">
                                <div class="game-widget-select-btn">SELECT</div>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(modalOverlay);
                modalOverlay.querySelector('.game-widget-close-button').addEventListener('click', closeGame);

                initializeGame();
            }
            function createPlayButton() {
                const playButton = document.createElement('button');
                playButton.textContent = 'Play Game';
                playButton.className = 'game-widget-play-button';
                playButton.addEventListener('click', createGameWindow);
                document.body.appendChild(playButton);
            }

            // --- SCRIPT ENTRY POINT ---
            // Wait for the DOM to be fully loaded before adding the button.
            document.addEventListener('DOMContentLoaded', () => {
                createPlayButton();
            });

        })();