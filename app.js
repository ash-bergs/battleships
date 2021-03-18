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
    // Variables to help the game logic at the bottom 
    let isGameOver = false; 
    let currentPlayer = 'user'; 

    // Creates Boards 
    const width = 10; 

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

    // Calling the function we built to make a grid, passing in the arguments we need! 
    createBoard(userGrid, userSquares, width); 
    createBoard(computerGrid, computerSquares, width); 

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

    // could I just do a MAP to generate a ship for each ship in the shipsArray?
    generate(shipArray[0]);
    generate(shipArray[1]);
    generate(shipArray[2]);
    generate(shipArray[3]);
    generate(shipArray[4]); 

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
                // handling adding the 'taken' and proper class names to the userGrid when we drop a new ship onto them
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', shipClass); 
            }
        } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
            for (let i=0; i<draggedShipLength; i++) {
                // we're not incrementing by one this time... these ships stack
                // so we increment by TEN - the number we already set in the WIDTH variable - a handy way to remember its purpose 
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', shipClass); 
            }
        } else return; 
        
        // Now that a ship has been moved, we want to remove it from the display grid 👇
        displayGrid.removeChild(draggedShip); 
    }

    function dragEnd() {
    
    }

    //! Game Logic 

    function playGame() {
        if (isGameOver) return
        if (currentPlayer === 'user') {
            // we're grabbing the element with class name WHOSE-GO (which is an empty div), that is isolated with a query selector and stored in turnDisplay above 
            turnDisplay.innerHTML = "Your Go!"; 
            computerSquares.forEach(square => square.addEventListener('click', function(e) {
                revealSquare(square); 
            }))
        } if (currentPlayer === 'computer') {
            turnDisplay.innerHTML = "Computer's Turn"; 
            // we used a setTimeout function, passing in the computerGo function to be invoked with a delay 1000 milliseconds 
            // this is just done to give a smooth, realistic feel to the turn change 
            setTimeout(computerGo, 1000); 
        }
    }

    // Attach the playGame function to the start button! 
    startButton.addEventListener('click', playGame); 

    // Variables to hold the count of "hits" on different classes 
    let destroyerCount = 0; 
    let submarineCount = 0; 
    let cruiserCount = 0; 
    let battleshipCount = 0; 
    let carrierCount = 0; 

    function revealSquare(square) {
        // ! We have a problem - if a square that has already been selected is clicked, it counts as another turn. Let's disable that.
        if (!square.classList.contains('boom')) {
            // if the square has a given ship name among its class names, increment the hit count
            if (square.classList.contains('destroyer')) destroyerCount++; 
            console.log(destroyerCount)
            if (square.classList.contains('submarine')) submarineCount++;
            if (square.classList.contains('cruiser')) cruiserCount++;
            if (square.classList.contains('battleship')) battleshipCount++;
            if (square.classList.contains('carrier')) carrierCount++;
        }

        if (square.classList.contains('taken')) {
            // any ship, from any category, will also add "taken" to the list of class names for a square 
            // if the square is taken, then the user successfully hit a ship
            // add classname BOOM 
            square.classList.add('boom'); 
            //* now we want to add a way to visualize a "miss" (otherwise how will we remember?)
        } else {
            square.classList.add('miss'); 
        }
        // now we need to pass the turn to the computer 
        // then call the playGame function again... 
        //TODO write the logic for the computer's go! 
        checkForWins(); 
        currentPlayer = 'computer'; 
        playGame();
    }

    // we need to basically recreate the logic we used for the User's turn 
    // ? how can I make this more DRY? 
    let npcDestroyerCount = 0; 
    let npcSubmarineCount = 0; 
    let npcCruiserCount = 0; 
    let npcBattleshipCount = 0; 
    let npcCarrierCount = 0; 

    function computerGo() {
        let random = Math.floor(Math.random() * userSquares.length); 
        // if the userSquare at the random number DOESNT contain "boom", then....
        if (!userSquares[random].classList.contains('boom')) {  
            userSquares[random].classList.add('boom')
            if (userSquares[random].classList.contains('destroyer')) npcDestroyerCount++; 
            if (userSquares[random].classList.contains('submarine')) npcSubmarineCount++;
            if (userSquares[random].classList.contains('cruiser')) npcCruiserCount++;
            if (userSquares[random].classList.contains('battleship')) npcBattleshipCount++;
            if (userSquares[random].classList.contains('carrier')) npcCarrierCount++;
        } else computerGo(); 
        currentPlayer = 'user'; 
        turnDisplay.innerHTML = "Your Go"; 
    }

    //* Check for wins! 
    // We know how many squares make up each battleship - so we'll check for that amount in each of the counts we set up. 
    // If the count is a certain number, then that ship must have been sunk. 
    // 10 points are given per sunk ship
    // Total points needed to win: 50 
    function checkForWins() {
        //* user logic 
        if (destroyerCount === 2) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = "You sank the computer's destroyer!"
            destroyerCount = 10; 
        }
        if (submarineCount === 3) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = "You sank the computer's submarine!"
            submarineCount = 10; 
        }
        if (cruiserCount === 3) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = "You sank the computer's cruiser!"
            cruiserCount = 10; 
        }
        if (battleshipCount === 4) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = "You sank the computer's battleship!"
            battleshipCount = 10; 
        }
        if (carrierCount === 2) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = "You sank the computer's carrier!"
            carrierCount = 10; 
        }

        //* computer logic 
        if (npcDestroyerCount === 2) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = "The computer sunk your destroyer!"
            npcDestroyerCount = 10; 
        }
        if (npcSubmarineCount === 3) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = "The computer sunk your submarine!"
            submarineCount = 10; 
        }
        if (npcCruiserCount === 3) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = "The computer sunk your cruiser!"
            npcCruiserCount = 10; 
        }
        if (npcBattleshipCount === 4) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = "The computer sunk your battleship!"
            npcBattleshipCount = 10; 
        }
        if (npcCarrierCount === 2) {
            // infoDisplay is simply an element in the "hidden-info" div. This will let user's know information about the game as it progresses 
            infoDisplay.innerHTML = "The computer sunk your carrier!"
            npcCarrierCount = 10; 
        }

        // Add the numbers for a total of 50 to announce a winner! 
        if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
            infoDisplay.innerHTML = "You Win!"; 
            // call the gameOver function, which set isGameOver to true and resets the game boards 
            gameOver(); 
        }
        if ((npcDestroyerCount + npcSubmarineCount + npcCruiserCount + npcBattleshipCount + npcCarrierCount) === 50) {
            infoDisplay.innerHTML = "You Win!"; 
            // call the gameOver function, which set isGameOver to true and resets the game boards 
            gameOver(); 
        }
    }

    function gameOver() {
        isGameOver = true; 
        startButton.removeEventListener('click', playGame); 
    }

}); 