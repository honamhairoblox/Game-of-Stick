let phase = 'waiting';
let lastTimestamp;
let CharacterX;
let CharacterY;
let sceneOffset;
let GamePlatform = [];
let bridges = [];
let tree = [];
let score = 0;
const canvasWidth = 375;
const canvasHeight = 375;
const GamePlatformHeight = 100;
const CharacterDistanceEdge = 10;
const paddingX = 100;
const perfectAreaSize = 10;
const backgroundSpeedMultiplier = 0.2;
const hill1BaseHight = 100;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHight = 70;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;
const stretchingSpeed = 4;
const turningSpeed = 4;
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 1;
const CharacterWidth = 17;
const CharacterHeight = 30;
const canvas = document.getElementById('game');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');
const introductionElement = document.getElementById('introduction');
const perfectElement = document.getElementById('perfect');
const restartButton = document.getElementById('restart');
const scoreElement = document.getElementById('score');
Array.prototype.last = function(){
    return this[this.length - 1];
};

Math.sinus = function (degree){
    return Math.sin((degree / 180) * Math.PI);
};


resetGame();
function resetGame(){
    phase = 'waiting';
    lastTimestamp = undefined;
    sceneOffset = 0;
    score = 0;
    introductionElement.style.opacity = 1;
    perfectElement.style.opacity = 0;
    restartButton.style.display = 'none';
    scoreElement.innerText = score;
    GamePlatform = [{x: 50, w: 50}];
    generatePlatform();
    generatePlatform();
    generatePlatform();
    generatePlatform();
    bridges = [{x: GamePlatform[0].x + GamePlatform[0].w, length: 0, rotation: 0}];
    tree = [];
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    CharacterX = GamePlatform[0].x + GamePlatform[0].w - CharacterDistanceEdge;
    CharacterY = 0;
    draw()
}

function generateTree(){
    const minimumGap = 50;
    const maximumGap = 170;

    const lastTree = tree[tree.length - 1];
    let furthestX = lastTree ? lastTree.x : 0;

    const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
    const treeColors = ["#558b2f", "#43a047", "#76ff03"];
    const color = treeColors[Math.floor(Math.random() * 3)];
    tree.push({ x, color});
}

function generatePlatform(){
    const minimumGap = 40;
    const maximumGap = 200;
    const minimumWidth = 20;
    const maximumWidth = 100;

    const lastPlatform = GamePlatform[GamePlatform.length - 1];
    let furthestX = lastPlatform.x + lastPlatform.w;

    const x = 
    furthestX + 
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
    const w = 
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

    GamePlatform.push({x, w});
}

resetGame();

window.addEventListener('keydown', function (event){
    if (event.key == " "){
        event.preventDefault();
        resetGame();
        return;
    }
});

window.addEventListener('mousedown', function (event){
    if (phase == "waiting"){
        lastTimestamp = undefined;
        introductionElement.style.opacity = 0;
        phase = 'stretching';
        window.requestAnimationFrame(animate);
    }
});


window.addEventListener('mouseup', function (event){
    if (phase == "stretching"){
        phase = "turning";
    }
});

window.addEventListener('resize', function(event){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
});


window.requestAnimationFrame(animate);

function animate(timestamp){
    if (!lastTimestamp){
        lastTimestamp = timestamp;
        window.requestAnimationFrame(animate);
        return;
    }

    switch (phase){
        case "waiting":
            return;
        case "stretching":{
            bridges.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
            break;
        }

        case 'turning': {
            bridges.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

            if (bridges.last().rotation > 90){
                bridges.last().rotation = 90;

                const [nextPlatform, perfectHit] = thePlatformTheStickHits();
                if (nextPlatform){
                    score += perfectHit ? 2 : 1;
                    scoreElement.innerText = score;

                    if ( perfectHit){
                        perfectElement.style.opacity = 1;
                        setTimeout(() => (perfectElement.style.opacity = 0), 1000);
                    }
                    generatePlatform();
                    generateTree();
                    generateTree();
                }
                phase = 'walking';
            }
            break;
        }
        case 'walking': {
            CharacterX += (timestamp - lastTimestamp) / walkingSpeed;
            const [nextPlatform] = thePlatformTheStickHits();
            if(nextPlatform){
                const maxHeroX = nextPlatform.x + nextPlatform.w - CharacterDistanceEdge;
                if(CharacterX > maxHeroX){
                    CharacterX = maxHeroX;
                    phase = "transitioning";
                }
            } else {
                const maxHeroX = bridges.last().x + bridges.last().length + CharacterWidth;
                if (CharacterX > maxHeroX){
                    CharacterX = maxHeroX;
                    phase = 'falling';
                }
            }
            break;
        }
        case "transitioning": {
            sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;
            const [nextPlatform] = thePlatformTheStickHits();
            if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX){
                bridges.push({
                    x: nextPlatform.x + nextPlatform.w,
                    length: 0,
                    rotation: 0
                });
                phase = "waiting";
            }
            break;
        }
        case "falling": {
            if(bridges.last().rotation < 180)
            bridges.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
            CharacterY += (timestamp - lastTimestamp) / fallingSpeed;
            const maxHeroY =
            GamePlatformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
            if(CharacterY > maxHeroY){
                restartButton.style.display = "block";
                return;
            }
            break;
        }
        default:
            throw Error("wrong phase");
    }
    draw();
    window.requestAnimationFrame(animate);
    lastTimestamp = timestamp;
}

function thePlatformTheStickHits(){
    const stickRotation = bridges.last().rotation;
    if (stickRotation !== 90){
        throw new Error(`Stick is ${stickRotation}°`);
    }

    const stickFarX = bridges.last().x + bridges.last().length;
    const platformTheStickHits = GamePlatform.find((platform) => {
        const platformFarX = platform.x + platform.w;
        return platform.x < stickFarX && stickFarX < platformFarX;
    });

    if (
        platformTheStickHits &&
        isStickWithinPerfectArea(platformTheStickHits, stickFarX)
    ) {
        return [platformTheStickHits, true];
    }
    return [platformTheStickHits, false];
}

function isStickWithinPerfectArea(platform, stickFarX){
    const perfectAreaStartX = platform.x + platform.w / 2 - perfectAreaSize / 2;
    const perfectAreaEndX = platform.x + platform.w / 2 + perfectAreaSize / 2;
    return perfectAreaStartX < stickFarX && stickFarX < perfectAreaEndX;
}

function draw(){
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    drawBackground();
    ctx.translate(
        (window.innerWidth - canvasWidth) / 2 - sceneOffset,
        (window.innerHeight - canvasHeight) / 2
    );
    drawPlatforms();
    drawCharacter();
    drawBridges();
    ctx.restore();
}

restartButton.addEventListener('click', function(event){
    event.preventDefault();
    resetGame();
    restartButton.style.display = 'none';
});

function drawPlatforms(){
    GamePlatform.forEach(({ x, w}) =>{
        ctx.fillStyle = '#222222';
        ctx.fillRect(
            x,
            canvasHeight - GamePlatformHeight,
            w,
            GamePlatformHeight + (window.innerHeight - canvasHeight) / 2

        );
        if (bridges.last().x < x){
            ctx.fillStyle = 'red';
            ctx.fillRect(
                x + w / 2 - perfectAreaSize / 2,
                canvasHeight - GamePlatformHeight,
                perfectAreaSize,
                perfectAreaSize
            );
        }
    });
}

function drawCharacter(){
    ctx.save();
    ctx.fillStyle = "#01579b";
    ctx.translate(
        CharacterX - CharacterWidth / 2 ,
        CharacterY + canvasHeight - GamePlatformHeight - CharacterHeight / 2
    );

    drawRoundeRect(
        -CharacterWidth / 2,
        -CharacterHeight / 2,
        CharacterWidth,
        CharacterHeight - 4,
        5
    );
    const legDistance = 5;
    ctx.beginPath();
    ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#ffff00";
    ctx.arc(5, -7, 3, 0, Math.PI * 2 , false);
    ctx.fill()
    ctx.fillStyle = "red";
    ctx.fillRect(-CharacterWidth / 2 - 1, -12, CharacterWidth + 2, 4.5);
    ctx.beginPath();
    ctx.moveTo(-9, -14.5);
    ctx.lineTo(-17, -18.5);
    ctx.lineTo(-14, -8.5);
    ctx.fill()
    ctx.beginPath();
    ctx.moveTo(-10, -10.5);
    ctx.lineTo(-15, -3.5);
    ctx.lineTo(-5, -7);
    ctx.fill();
    ctx.restore();
}

function drawRoundeRect(x, y, width, height, radius){
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    ctx.lineTo(x + width - radius, y + height);
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    ctx.lineTo(x + width, y + radius)
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.fill();
}

function drawBridges(){
    bridges.forEach((stick) =>{
        ctx.save();

        ctx.translate(stick.x, canvasHeight - GamePlatformHeight);
        ctx.rotate((Math.PI / 180) * stick.rotation);

        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stick.length);
        ctx.stroke();
        ctx.restore();
    });
}

function drawBackground(){
    var gradient = ctx.createLinearGradient(0,0,0, window.innerHeight);
    gradient.addColorStop(0, "#81d4fa");
    gradient.addColorStop(1, "#b2ebf2");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    drawHill(hill1BaseHight, hill1Amplitude, hill1Stretch, "#64dd17");
    drawHill(hill2BaseHight, hill2Amplitude, hill2Stretch, "#388e3c");

    tree.forEach((tree) => drawTree(tree.x, tree.color));
}

function drawHill(baseHight, amplitude, stretch, color){
    ctx.beginPath();
    ctx.moveTo(0, window.innerHeight);
    ctx.lineTo(0, getHillY(0, baseHight, amplitude, stretch));
    for (let i = 0; i < window.innerWidth; i++){
        ctx.lineTo(i, getHillY(i, baseHight, amplitude, stretch));
    }
    ctx.lineTo(window.innerWidth, window.innerHeight);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawTree(x, color){
    ctx.save();
    ctx.translate(
        (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
        getTreeY(x, hill1BaseHight, hill1Amplitude)
    );

    const treeTrunkHeight = 10;
    const treeTrunkWidth = 3;
    const treeCrownHeight = 55;
    const treeCrownWidth = 25;

    ctx.fillStyle = "#7d833c";
    ctx.fillRect(
        -treeTrunkWidth / 2,
        -treeTrunkHeight,
        treeTrunkWidth,
        treeTrunkHeight
    );

    ctx.beginPath();
    ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
    ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
    ctx.lineTo(treeCrownWidth /2, -treeTrunkHeight);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function getHillY(windowX, baseHight, amplitude, stretch){
    const sineBaseY = window.innerHeight - baseHight;
    return(
        Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch)*
        amplitude +
        sineBaseY
    );
}

function getTreeY(x, baseHight, amplitude){
    const sineBaseY = window.innerHeight - baseHight;
    return Math.sinus(x) * amplitude + sineBaseY;
}

