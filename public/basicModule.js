            function loadImage(path) {
              return new Promise((resolve, reject) => {
                // Create a new image element
                const img = new Image();
            
                // Set up the event listener for a successful load
                img.onload = () => {
                  console.log(`Image loaded successfully from: ${path}`);
                  resolve(img); // Fulfill the promise with the image object
                };
            
                // Set up the event listener for a failure
                img.onerror = () => {
                  const errorMsg = `Failed to load image at: ${path}`;
                  console.error(errorMsg);
                  reject(new Error(errorMsg)); // Reject the promise with an error
                };
            
                // Start loading the image by setting its source
                img.src = path;
              });
            }

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


