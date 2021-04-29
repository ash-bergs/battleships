document.addEventListener("DOMContentLoaded", () => {
    // Now we're going to use class names from elements, to check that they're loaded before continuing 
    const userGrid = document.querySelector('.grid-user');
    // userSquares & computerSquares are used to keep track of the available squares in the game boards 
    const userSquares = []; 
    const computerGrid = document.querySelector('.grid-computer');
    const computerSquares = []; 
    const displayGrid = document.querySelector('.grid-display');
    // hardcoding all the user ships to start off in horizontal position 👇
    let isHorizontal = true; 
    // Selecting all the ships we'll need later in the JS 
    const ships = document.querySelectorAll('.ship');
    const destroyer = document.querySelector('.destroyer-container');
    const submarine = document.querySelector('.submarine-container');
    const cruiser = document.querySelector('.cruiser-container');
    const battleship = document.querySelector('.battleship-container');
    const carrier = document.querySelector('.carrier-container');
    // Selecting the buttons we'll need 
    const startButton = document.querySelector('#start');
    const rotateButton = document.querySelector('#rotate');
    // Div to see whose turn it is & info
    const turnDisplay = document.querySelector('#whose-go');
    const infoDisplay = document.querySelector('#info');
    //* game mode buttons 
    // Variables to help the game logic at the bottom 
    let isGameOver = false; 
    let currentPlayer = 'user'; 

    // Creates Boards 
    const width = 10; 

    //! start socket.io actions
    // tracking several game properties/assigning default values
    let playerNum = 0; 
    let ready = false; 
    let enemyReady = false; 
    // we want to check that all ships are placed before the game starts, to prevent cheating 🚫
    let allShipsPlaced = false; 
    let shotFired = -1; 

    // Ships 
    // This array contains all of the ships in the game, and their possible position depending on if they are rotated or not
    // directions are given as if 'painting' onto the screen using the 10X10 grid we created in the displays 
    const shipArray = [
        {
            name: 'destroyer', 
            directions: [
                [0, 1], // vertical - stacked NEXT to each other
                [0, width] // horizontal - 10 would be the first square in the next row - stack ON TOP of each other
            ]   
        }, 
        {
            name: 'submarine', 
            directions: [
                [0, 1, 2], 
                [0, width, width*2]
            ]
        }, 
        {
            name: 'cruiser', 
            directions: [
                [0, 1, 2], 
                [0, width, width*2]
            ]
        }, 
        {
            name: 'battleship', 
            directions: [
                [0, 1, 2, 3], 
                [0, width, width*2, width*3]
            ]
        }, 
        {
            name: 'carrier', 
            directions: [
                [0, 1, 2, 3, 4], 
                [0, width, width*2, width*3, width*4]
            ]
        }
    ];
    
    // Calling the function we built to make a grid, passing in the arguments we need! 
    createBoard(userGrid, userSquares, width); 
    createBoard(computerGrid, computerSquares, width); 

    // Previously we had event listeners on two buttons that were always present 
    // now game mode will be selected and set by the user from the splash page (index.html)
    // here we'll just check for whatever it is set to to continue 
    if (gameMode === 'singlePlayer') {
        startSinglePlayer(); 
    } else {
        startMultiPlayer(); 
    }

    // Multiplayer 
    function startMultiPlayer() {
        // socket comes from the script that we load in index.html (below the stylesheet link)
        const socket = io(); 
 
        // get player # 
        // when a message is transmitted, we can 'find' it and read it by giving it's name - "player-number" //! see server.js line 51
        socket.on("player-number", num => {
        if (num === -1) {
            infoDisplay.innerHTML = "Sorry the server is full"; 
            } else {
                // the data being sent to us from socket.io is a string, we need to parse that here into a number 
                // assigning that to playerNum (defined above, line 34)
                playerNum = parseInt(num);
                // the message indicates we are player 1 (not player 0) then we are the secondary player 
                if (playerNum === 1) currentPlayer = "enemy"
                console.log(playerNum);

                // ? What if we're ready before a second player even connects? How can we alert them that we're ready?
                // get other player status 
                socket.emit("check-players"); 
            }
        })

        // alert that another player has connected or disconnected 
        socket.on("player-connection", num => {
            console.log(`Player number ${num} has connected or disconnected`); 
            // playerConnectedOrDisconnected helper fn below 
            playerConnectedOrDisconnected(num); 
        })

        // On enemy ready 
        socket.on("enemy-ready", num => {
            enemyReady = true; 
            playerReady(num); 
            if (ready) playGameMulti(socket)
        })

        // Check player status 
        // function invoked when user first connects (checking if any other players are already connected and ready)
        socket.on("check-players", players => {
            players.forEach((player, index) => {
                if (player.connected) playerConnectedOrDisconnected(index);
                if (player.ready) {
                    playerReady(index); 
                    if (index !== playerNum) enemyReady = true; 
                }
            });
        })

        // On timeout 
        socket.on("timeout", () => {
            infoDisplay.innerHTML = "You have reached the 10 minute turn limit!"
        })

        // Ready button click 
        //TODO review what's going on here... how is socket working in this instance? 
        startButton.addEventListener("click", () => {
            if (allShipsPlaced) {
                playGameMulti(socket); 
            } else {
                infoDisplay.innerHTML = "Please place all ships 🚢"; 
            }
        })

        // Setup event listener for firing 
        // ? we're using computerSquares? is that effectively now the "enemySquares"?
        computerSquares.forEach(square => {
            // adding an event listener on each square to check for a few things 
            square.addEventListener('click', () => {
                if (currentPlayer === 'user' && ready && enemyReady) {
                    // if the current turn is ours, and both players are ready (all ships are placed) then...
                    shotFired = square.dataset.id; 
                    // we assigned a number to the dataset of each square in the CREATEBOARD function (how both player games boards are painted programmatically)
                    // pass the server a notification and the shotFired data 
                    socket.emit('fire', shotFired); 
                }
            }); 
        })

        // On fire RECEIVED 
        socket.on('fire', id => {
            enemyGo(id); 
            // isolate the selected square (the one fired upon)
            const square = userSquares[id]; 
            // and emit its class list, that way we can see if it contains any of the 'cruiser-' 'submarine-' etc class names
            socket.emit('fire-reply', square.classList); 
            playGameMulti(socket); 
        })

        // on fire REPLY 
        socket.on("fire-reply", classList => {
            revealSquare(classList); 
            playGameMulti(socket);
        })


        function playerConnectedOrDisconnected(num) {
            //? What are we doing here? 
            // player is assigned a value, that we obtain with the resolution of the expression passed into the string template literal -> meaning the final result will be a string 
            // the expression ${parseInt(num) + 1} will grab the users playerNum, assigned to them from the connections array. 
            // This is ZERO indexed, and the two HTML elements we made (divs with class "player p1" or "player p2") are first indexed
            // depending on what connection in the `connections` array that player is occupying, their 'ready' status will be displayed in the correct html element
            let player = `.p${parseInt(num) + 1}`; 
            // use the captured string to isolate the <span> element inside the element with classname "connected" and classname "p1" or "p2" in the body 
            document.querySelector(`${player} .connected span`).classList.toggle('green'); 
            // to let the the player know which player they are (1 or 2), make the font style bold
            if (parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold';  
        }
    }

    // Single player 
    function startSinglePlayer() {
        // generate computer ships
        generate(shipArray[0]);
        generate(shipArray[1]);
        generate(shipArray[2]);
        generate(shipArray[3]);
        generate(shipArray[4]);
        startButton.addEventListener('click', playGameSingle); 
    }

    function createBoard(grid, squares, width) {
        for (let i=0; i<width * width; i++) {
            const square = document.createElement('div'); 
            // giving the square an id, the id is its place in the iteration 👇
            square.dataset.id = i; 
            // creating the grid squares, but we need to do something with it 👇
            // Targeting the display grid, we append the squares there 
            grid.appendChild(square); 
            // we're using this array (userSquares) to keep track of the squares 
            squares.push(square); 
        }
    }; 

    // Draws the computer's ships in "random" locations 
    function generate(ship) {
        // this floored, random number is used to pick between the two possible directions a ship can be facing
        let randomDirection = Math.floor(Math.random() * ship.directions.length); 
        // and this assigns the direction to a ship using bracket notation and the result of the above calculation 
        let current = ship.directions[randomDirection]; 
        if (randomDirection === 0) direction = 1;
        if (randomDirection === 1) direction = 10;
        // Now to assign a random start point in our grid 
        // Had to add the Math abs method, flooring wasn't enough to define a proper start space for the Carrier ships
        let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction))); 

        // Check to make sure that squares aren't taken, or are at the edges 
        const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'))
        const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1); 
        const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0); 

        // IF a square is not taken, not at the right edge, and not at the left edge... then
        if (!isTaken && !isAtRightEdge && !isAtLeftEdge){
            current.forEach((index) => {
                // here we actually add the 'taken' class name to be checked for 
                // also adds the ship NAME - i.e. carrier, submarine, etc 
                computerSquares[randomStart + index].classList.add('taken', ship.name)
            })
        } else {
            // otherwise one of the squares must be taken, or the ship is at the edge...
            // so RUN IT AGAIN!
            // Does this count as recursion? 
            generate(ship)
        }
    };  

    // USER FUNCTIONALITY 
    // rotate user ships
    //! There's a lot of repition here - I can refactor this to be more DRY later.
    function rotate() {
        if (isHorizontal) {
            destroyer.classList.toggle('destroyer-container-vertical');
            submarine.classList.toggle('submarine-container-vertical');
            cruiser.classList.toggle('cruiser-container-vertical');
            battleship.classList.toggle('battleship-container-vertical');
            carrier.classList.toggle('carrier-container-vertical'); 
            isHorizontal = false;
            return
        }
        if (!isHorizontal) {
            //! 👇 Previously, I was having some buggy behavior... I didn't have "-vertical" at the end of the toggle parameter
            //? I think I'm conceptualizing the .toggle method incorrectly, and I have to use the same class name as above?
            // This was completely the problem! //TODO Research more about the JS toggle method! 
            destroyer.classList.toggle('destroyer-container-vertical');
            submarine.classList.toggle('submarine-container-vertical');
            cruiser.classList.toggle('cruiser-container-vertical');
            battleship.classList.toggle('battleship-container-vertical');
            carrier.classList.toggle('carrier-container-vertical'); 
            isHorizontal = true;
            // console.log(isHorizontal); 
            return
        }
    }
    // attaches the 👆 function to the rotate button 👇
    rotateButton.addEventListener('click', rotate); 

    
    //! 🦄 Drag events 
/* -------------------------------------------------------------------------- */
/*                       About the HTML Drag & Drop API                       */
/* 
    We're using DRAGGABLE elements in this project. 
    These elements are provided to us by the HTML Drag and Drop API 

    The API uses the DOM event model - and the drag events available to us are inherited from mouse events 
    * Each even has an associated GLOBAL EVENT HANDLER - below we are using those globally available handlers 
    Assigning them to the interact-able squares 
    ? Learn more here: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
*/
/* -------------------------------------------------------------------------- */

    ships.forEach(ship => ship.addEventListener('dragstart', dragStart)); 
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart));
    userSquares.forEach(square => square.addEventListener('dragover', dragOver));
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter)); 
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave));
    userSquares.forEach(square => square.addEventListener('drop', dragDrop));
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd));

    // First we want to grab the id of the ship INDEX that's currently picked up by the user 
    let selectedShipNameWithIndex 
    let draggedShip
    let draggedShipLength

    ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
        // this grabs the id of the square we actually select... so for longer ships that could be 0, 1, 2, 3 etc
        selectedShipNameWithIndex = e.target.id; 
        // testing 
        // console.log(selectedShipNameWithIndex); 
    })); 

    // * Now that we have that index, we use the build functionality with event handlers below

    function dragStart() {
        draggedShip = this;
        draggedShipLength = this.childNodes.length
        // testing
        // console.log('dragged ship:', draggedShip); 
    }

    function dragOver(e) {
        e.preventDefault(); 
    }
    
    function dragEnter(e) {
        e.preventDefault(); 
    }
    
    function dragLeave() {
        console.log('drag leave'); 
    }
    
    //* Here is where the most stuff is going to happen! 

    //! Phase Three (styles) note: We want the ships to be curved at the ends like they appear on the user's grid (before placing)
    // to do that we need to know if a ship is vertical or horizontal 
    // We'll assign those classes (that will tell us the orientation of ship) programmatically here in the JS 
    function dragDrop() {
        let shipNameWithLastId = draggedShip.lastChild.id; 
        // we are slicing the id we just grabbed 👆 
        // so that we can just get "submarine" "carrier" and so on! 
        let shipClass = shipNameWithLastId.slice(0, -2); 
        // Un-comment to see the result 👇
        // console.log('last id slice:', shipClass, shipNameWithLastId); 
        
        // * To make sure that we can place the ship where we are in the grid
        // we have to find what square of the USERGRID the LAST ELEMENT of our DRAGGEDSHIP is going to be in
        // we need to parse the substring we pull from shipNameWithLastId into an integer - so it can be used to place ships in the numbered userGrid
        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1)); 
        let shipLastId = lastShipIndex + parseInt(this.dataset.id); 
        // an array of indexes that a user is not allowed to have their last ship index in 
        const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93];
        const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60];

        // using the currently dragged ship's LASTSHIPINDEX (the id of the LAST child), and if it increments by 10, then it is clipping onto the next row - i.e. wrapping 
        let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex);
        let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex); 

        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1)); 
        // testing - console.log(shipLastId, selectedShipIndex); 
        shipLastId = shipLastId - selectedShipIndex

        // IF the ship is horizontal, and the LASTSHIPID of the selected ship doesn't include (i.e. fall into) the NOT ALLOWED squares, then....
        if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
            for (let i=0; i<draggedShipLength; i++) {
                // to figure out if the div is the first or last child (so we know which divs to add border radius to) init directionClass variable
                let directionClass; 
                if (i === 0) directionClass = "start"; 
                if (i === draggedShipLength - 1) directionClass = "end"; 
                // handling adding the 'taken' and proper class names to the userGrid when we drop a new ship onto them
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', directionClass, shipClass); 
            }
        } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
            for (let i=0; i<draggedShipLength; i++) {
                 // to figure out if the div is the first or last child (so we know which divs to add border radius to) init directionClass variable
                 let directionClass; 
                 if (i === 0) directionClass = "start"; 
                 if (i === draggedShipLength - 1) directionClass = "end"; 
                // we're not incrementing by one this time... these ships stack
                // so we increment by TEN - the number we already set in the WIDTH variable - a handy way to remember its purpose 
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', 'vertical', directionClass, shipClass); 
            }
        } else return; 
        
        // Now that a ship has been moved, we want to remove it from the display grid 👇
        displayGrid.removeChild(draggedShip); 
        // Once there are no ships in the displayGrid, then we can start the game (verifies no one is cheating by leaving ships on the board)
        // allShipsPlaced is a boolean value, init at false 
        if (!displayGrid.querySelector(".ship")) allShipsPlaced = true; 
    }

    function dragEnd() {
    
    }

    //! Game Logic 
    // Single player game logic
    function playGameSingle() {
        if (isGameOver) return
        if (currentPlayer === 'user') {
            // we're grabbing the element with class name WHOSE-GO (which is an empty div), that is isolated with a query selector and stored in turnDisplay above 
            turnDisplay.innerHTML = "Your Go!"; 
            computerSquares.forEach(square => square.addEventListener('click', function(e) {
                shotFired = square.dataset.id; 
                revealSquare(square.classList); 
            }))
        } if (currentPlayer === 'enemy') {
            turnDisplay.innerHTML = "Enemy's Turn"; 
            // we used a setTimeout function, passing in the computerGo function to be invoked with a delay 1000 milliseconds 
            // this is just done to give a smooth, realistic feel to the turn change 
            setTimeout(enemyGo, 1000); 
        }
    }
    
    // Multiplayer game logic 
    // This is what happens when someone indicates they're ready to begin a multiplayer game 
    // function is called several times, in different places, 
    function playGameMulti(socket) {
        // if game is over, return from the function 
        if (isGameOver) return; 
        if (!ready) {
            // send a message to others that a player is ready 
            socket.emit("player-ready"); 
            // update local ready boolean to true 
            ready = true; 
            // playerReady will visually indicate readiness
            playerReady(playerNum); 
        }

        if (enemyReady) {
            if (currentPlayer === "user") {
                turnDisplay.innerHTML = "Your Go"; 
            } 
            if (currentPlayer === "enemy") {
                turnDisplay.innerHTML = "Enemy's Go"; 
            }
        }
    }

    function playerReady(num) {
        let player = `.p${parseInt(num) + 1}`; 
        //! start debug here
        // console.log("check here", player);
        // we did this at the top of the document on the .connected instead of .ready class 
        // document.querySelector(`${player} .connected span`).classList.toggle('green'); 
        document.querySelector(`${player} .ready span`).classList.toggle('green'); 
    }

    // Variables to hold the count of "hits" on different classes 
    let destroyerCount = 0; 
    let submarineCount = 0; 
    let cruiserCount = 0; 
    let battleshipCount = 0; 
    let carrierCount = 0; 

    function revealSquare(classList) {
        const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`); 
        const obj = Object.values(classList); 
        if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
            // if the square has a given ship name among its class names, increment the hit count
            if (obj.includes('destroyer')) destroyerCount++; 
            if (obj.includes('submarine')) submarineCount++;
            if (obj.includes('cruiser')) cruiserCount++;
            if (obj.includes('battleship')) battleshipCount++;
            if (obj.includes('carrier')) carrierCount++;
        }

        if (obj.includes('taken')) {
            // any ship, from any category, will also add "taken" to the list of class names for a square 
            // if the square is taken, then the user successfully hit a ship
            // add classname BOOM 
            enemySquare.classList.add('boom'); 
            //* now we want to add a way to visualize a "miss" (otherwise how will we remember?)
        } else {
            enemySquare.classList.add('miss'); 
        }
        // now we need to pass the turn to the computer 
        // then call the playGame function again... 
        //TODO write the logic for the computer's go! 
        checkForWins(); 
        currentPlayer = 'enemy'; 
        if (gameMode === "singlePlayer") playGameSingle();
    }

    // we need to basically recreate the logic we used for the User's turn 
    // ? how can I make this more DRY? 
    let npcDestroyerCount = 0; 
    let npcSubmarineCount = 0; 
    let npcCruiserCount = 0; 
    let npcBattleshipCount = 0; 
    let npcCarrierCount = 0; 

    function enemyGo(square) {
        //! If we're in singlePlayer mode, then the squares/ships for the enemy (i.e. the computer) need to be generated - the 'SQUARE' param will be UNDEFINED 
        // so to solve for that, we'll define it, with the random number generator we built before 
        if (gameMode === "singlePlayer") square = Math.floor(Math.random() * userSquares.length); 
        // if the userSquare at the random number DOESNT contain "boom", then....
        if (!userSquares[square].classList.contains('boom')) {  
            userSquares[square].classList.add('boom')
            if (userSquares[square].classList.contains('destroyer')) npcDestroyerCount++; 
            if (userSquares[square].classList.contains('submarine')) npcSubmarineCount++;
            if (userSquares[square].classList.contains('cruiser')) npcCruiserCount++;
            if (userSquares[square].classList.contains('battleship')) npcBattleshipCount++;
            if (userSquares[square].classList.contains('carrier')) npcCarrierCount++;
            checkForWins(); 
        } else if (gameMode === "singlePlayer") enemyGo(); 
        currentPlayer = "user"; 
        turnDisplay.innerHTML = "Your Go"; 
    }

    //* Check for wins! 
    // We know how many squares make up each battleship - so we'll check for that amount in each of the counts we set up. 
    // If the count is a certain number, then that ship must have been sunk. 
    // 10 points are given per sunk ship
    // Total points needed to win: 50 
    function checkForWins() {
        let enemy = 'computer'; 
        if (gameMode === "multiPlayer") enemy = "enemy"; 
        if (destroyerCount === 2) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = `You sank the ${enemy}'s destroyer!`
            destroyerCount = 10; 
        }
        if (submarineCount === 3) {
            // infoDisplay is simply an element in the `hidden-info` div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = `You sank the ${enemy}'s submarine!`
            submarineCount = 10; 
        }
        if (cruiserCount === 3) {
            // infoDisplay is simply an element in the `hidden-info` div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = `You sank the ${enemy}'s cruiser!`
            cruiserCount = 10; 
        }
        if (battleshipCount === 4) {
            // infoDisplay is simply an element in the `hidden-info` div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = `You sank the ${enemy}'s battleship!`
            battleshipCount = 10; 
        }
        if (carrierCount === 5) {
            // infoDisplay is simply an element in the `hidden-info` div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = `You sank the ${enemy}'s carrier!`
            carrierCount = 10; 
        }

        //* computer logic 
        if (npcDestroyerCount === 2) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = `The ${enemy} sunk your destroyer!`
            npcDestroyerCount = 10; 
        }
        if (npcSubmarineCount === 3) {
            // infoDisplay is simply an element in the `hidden-info` div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = `The ${enemy} sunk your submarine!`
            submarineCount = 10; 
        }
        if (npcCruiserCount === 3) {
            // infoDisplay is simply an element in the `hidden-info` div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = `The ${enemy} sunk your cruiser!`
            npcCruiserCount = 10; 
        }
        if (npcBattleshipCount === 4) {
            // infoDisplay is simply an element in the `hidden-info` div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = `The ${enemy} sunk your battleship!`
            npcBattleshipCount = 10; 
        }
        if (npcCarrierCount === 5) {
            // infoDisplay is simply an element in the `hidden-info` div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = `The ${enemy} sunk your carrier!`
            npcCarrierCount = 10; 
        }

        // Add the numbers for a total of 50 to announce a winner! 
        if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
            infoDisplay.innerHTML = "YOU WIN!"; 
            // call the gameOver function, which set isGameOver to true and resets the game boards 
            gameOver(); 
        }
        if ((npcDestroyerCount + npcSubmarineCount + npcCruiserCount + npcBattleshipCount + npcCarrierCount) === 50) {
            infoDisplay.innerHTML = `${enemy.toUpperCase()} WINS`; 
            // call the gameOver function, which set isGameOver to true and resets the game boards 
            gameOver(); 
        }
    }

    function gameOver() {
        isGameOver = true; 
        startButton.removeEventListener('click', playGameSingle); 
    }

}); 