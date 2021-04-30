# JS Battleships 

<div id="top"></div>

JS Battleships brings the fun of the classic, table-top Battleships game to the computer! Play against the computer, or invite a friend for a riveting duel. 

This project builds upon vanilla JavaScript, CSS and HTML with NodeJS, Express and Socket.io to offer two game modes. The build was broken up into three phases: 

| Phases           | Description            |
| ---------------- | ---------------------- |
| <a href="#phaseOne">Phase One</a> | The foundation of the game, in phase one we build the HTML markup and the JS functionality | 
| <a href="#phaseTwo">Phase Two</a> | Multiplayer is added with NodeJS, Express and Socket.io. Socket allows us to set up quick, realtime communication between two players. |
| <a href="#phaseThree">Phase Three</a> | THE FUN PART! In this phase we refactor and modularize some of the code and begin styling it both with CSS and programmatically through the JS. Animations, CSS Grid, hsl/hsla values and more make an appearance. |

![Battleships-box](http://static1.squarespace.com/static/5a0d8676f6576e0f3648d5d2/5a1057c7f9619a64a2b90692/5c5ab434fa0d606e5b74daa0/1549532097388/battleship-game-classic.jpg?format=1500w)

----

<div id="phaseOne"></div>

## Phase One: Single Player (Vanilla JS, HTML & CSS)

![game screenshot](https://i.ibb.co/Jm2Sv5M/jsbattleships-1.jpg)

The body of the document is organized into 3 main containers - `container` (which holds the 2 game boards), `hidden-info` (displays dynamic game updates, like whose turn it is, and what ship has been sunk) & `grid-display` (contains the user's playable ships)

![labeled screenshot](https://i.ibb.co/W6XLnHL/labeled-1.png) 

The game boards, `grid-user` and `grid-computer` (the direct children of the `container` div), contain 100 divs in a 10X10 pattern, generated by the `createBoard` function in app.js. The computer will place its ships randomly after the `createBoard` function has completed using the `generate` function, while the `grid-user` board will allow a player to put their ships down. The ships can be rotated inside of the `grid-display` element. 

![labeled gameplay screenshot](https://i.ibb.co/6wnXVVN/labeled-2.png)

Hidden-info contains 2 buttons (that aren't hidden) for the user to start the game, and rotate their available ships. Both of the h3 spans were built to display real-time information the user needs to know - like whose turn it is, if and what battleship was just sunk, and so on. 

![gameplay screenshot](https://i.ibb.co/rcwWQqr/jsbattleships-4-gameplay-2.jpg) 

Once the user's ships have been placed the game can begin. When you select a square that the computer has a ship in, it will result in a HIT! and the square will turn red. This is the result of the `playGame` and `revealSquare` functions in app.js. Initially it is the user's go. An event listener is attached to each of the computerSquares, when a square is clicked the `revealSquare` function is invoked. This function checks if the computerSquare contains any battleship class name, and increments a count and returns a hit if it does. 

Once all the ships have been sunk, which we decide in the `checkForWins` function, the game will end! 

----

## Phase One: Reflection

### Current Problems: 

- The computer always gets a hit. The logic of the computerGo functions needs refactoring.
> Update 4/30/21: This was solved for - the problem was in the `enemyGo` function. I was never assigning 'miss' or 'boom', just 'boom' 
- The `checkForWins` function doesn't seem to be working. I wonder why 🤔 
> Update 4/26/21: `checkForWins` wasn't working because I didn't call it anywhere.... 🤦‍♀️🤦‍♀️🤦‍♀️
- When the user ships are rotated the stay in a column flow and overflow the parent div. This just looks bad and I should fix it. 
> Update: This was solved for in <a href="#phaseThree">Phase Three</a>

----

<div id="phaseTwo"></div>
<a href="#top">Return to top</a>

## Phase Two: Multiplayer Player (Vanilla JS, Socket.io, Express)

Now the project is multiplayer, and hosted on Heroku [here](https://aberg-battleships.herokuapp.com/)

Minor changes have been made to the HTML markup, adding 2 containers to visually indicate player number and readiness status. With class names `player` and `p1`/`p2` respectively.  When a user arrives at the page they can select the game mode by clicking a `Single Player` or `Multiplayer` button. Single player mode works as Phase One outlines. 

Selecting Multiplayer will trigger a cascade of side effects, instantiating communication through the socket.io API. First a player will be connected by searching the available connections, of which there are only 2 currently. If a connection is free, the player is connected and invited to place their ships. If they fail to place all their ships and press the `Start Game` button they'll be prompted to do so. 

![initial connect screenshot](https://i.ibb.co/yy8dDB3/JSbattleships-initial-connect.jpg)

![gameplay screenshot](https://i.ibb.co/g657SLR/JSbattelships-place-all-ships.jpg)

If Player 1 readies before Player 2 even arrives, there is no problem, this will be checked for in the `playerReady` function. This function parses the `connections` array, updating the UI to visually indicate when players are connected and all their ships have been placed (and they've clicked the `Start Game` button). 

![player 2 initial connect](https://i.ibb.co/0jJC2sn/JSbattleships-player2-initial-connect.jpg)

As the game progresses users will be notified when their ships have been sunk, or when they sink an enemy ship. 

![gameplay screenshot](https://i.ibb.co/Bck4w4V/JSbattleships-game-play.jpg)

Players are connected through Socket.io. Per the docs "Socket.IO is a library that enables real-time, bidirectional and event-based communication between the browser and the server." The library works by utilizing a NodeJS server to achieve fast, turn-based events that update in realtime. These two users will be directly connected through the NodeJS server, and communicating through the use of socket.io's emitters. Emitters allow us to send messages simultaneously to both clients, or selectively to one or the other. 

----

## Phase Two: Reflections 

### Current Problems: 

There are a handful of bugs in the build right now that I need to solve for. 

- In Single Player mode you can see the computer's ships. This is helpful for testing things, but silly in practice.
> Update 4/29/21: This was solved for in <a href="#phaseThree">Phase Three</a>
- There's a bug with the submarine that I can't figure out. The first div of the submarinee doesn't register as a "hit", and the square is green when it should be red. 

![submarine bug 1](https://i.ibb.co/bRD48J7/JSbattleships-submarine-bug.jpg) ![submarine bug 2](https://i.ibb.co/KzcY0C1/JSbattleships-submarine-bug2.jpg)

- 👆 Because the code is such a monolith (solving for this might help me find the answer to my problem 🤔) there's a lot to dig through to solve this one. 
> Update 3/2021: The checkForWins function was the root of the problem in this case. I was not assigning the right count to check for submarine hits (2 not 3)

----

<div id="phaseThree"></div>
<a href="#top">Return to top</a>

## Phase Three: Style 💅😎 

We have functionality, now it's time to make things pretty. Styling the page will remove some concerns for us, like the bugginess of the Single and Multiplayer buttons, by adding a splash page, and separating concerns, i.e. breaking the code up into two separate html files. Now the `gameMode` will be handled *based on URL*

![splash page screenshot](https://i.ibb.co/nry3k4c/battleships-screen.jpg)

index.html is now a splash page was so that the first thing a user must do is select Single Player or Multiplayer, these buttons are essentially the only things on the splash page. 

singlePlayer.html (previously index.html) is refactored: 

    - Since we don't need `socket.io` at all in a Single Player game, we've removed that from the html markup. 

    - A script now sets the `gameMode` (essential for the JS to know what functions to fire and when) at the top of the page and removes need for the Single Player and Multiplayer buttons 
    
    - The Single Player and Multiplayer buttons are removed from the markup 
    
    - Player 1 and Player 2 containers removed from the markup

app.js is refactored: 

    - Removed the `gameMode` variable in app.js - this will no longer be set by the JS found there, but by the URL (the button the user clicks)
    
    - Also removed all places the `gameMode` was being *set* in app.js - in the `startSinglePlayer` and `startMultiPlayer` function
    
    - Event listeners and query selectors for the original buttons are removed 
    
    - `ships` array and `creatBoard` calls had to be moved higher up in the JS (undefined errors!) 

style.css is refactored: 

    - `grid-user` and `grid-computer` are removed, new `battleship-grid` class and rules define the look of these elements 
    
    - CSS Grid introduced to the styles in the `battleship-grid` class, as a result the individual divs in the each player's gameboard no longer need a hardcoded width and height 

---- 

### What I've learned: 

- Programmatically adding class names: 

To be fair, I knew how to do this before, but this project helped me learn a lot about taking advantage of this ability to control and style hard to reason problems. 

For instance, when styling the ships to have a border radius on the first and last children, we add multiple class names to each of the ship divs in the JS programmatically: 

![app.js function dragDrop](https://i.ibb.co/ZN4sfJf/jsbattleships-fn-Drag-Drop.jpg)

When we inspect the elements through the browser, we'll see the classnames added to the correct children: 

![CSS inspect screenshot](https://i.ibb.co/LgzSV8T/jsbattleships-classnames-inspect.png)

- Keyboard Shortcuts: 

These seem like little things, but every keyboard shortcut I learn makes me feel a little more like a wizard 🧙‍♂️ 

When changing a function or variable name: Select the word and press F2 (windows) to update all the references to that object at once! 

Want to move a whole line of code up or down?: Highlight the selected code, then hold ALT and ⬆⬇⬅➡ 

### Current Problems: 

The single player game begins before a user places all of their ships... 🤔 

I think i want to make the theme darker, and add the option to use a light theme for those with halation and other optic problems 


<a href="#top">Return to top</a>