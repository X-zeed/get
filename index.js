(() => {
  const Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Events = Matter.Events,
    Composite = Matter.Composite;

  const parent = document.getElementById("game");
  const canvas = document.getElementById("canva");
  var gameOverlayer = document.getElementById("overlay");
  const floor = document.getElementById("floor");

  const ctx = canvas.getContext("2d");

  const engine = Engine.create();

  const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
      width: 320,
      height: 550,
      wireframes: false,
    },
  });

  const times = [];
  let fps = 100;

  let mousePos;
  let isClicking = false;
  let isMouseOver = false;
  let newSize = 1;

  let isGameOver = false;
  let score = 0;
  let highScore = 0;
  let scoreElement = document.getElementById("score");

  let isLineEnable = false;

  const background = Bodies.rectangle(240, 360, 480, 720, {
    isStatic: true,
    render: { fillStyle: "#fe9" },
  });
  background.collisionFilter = {
    group: 0,
    category: 1,
    mask: -2,
  };
  const ground = Bodies.rectangle(400, 1220, 810, 1340, {
    // 400, 1220, 810, 100
    isStatic: true,
    render: { fillStyle: "transparent" },
  });
  const wallLeft = Bodies.rectangle(-50, 500, 100, 1000, {
    isStatic: true,
    render: { fillStyle: "transparent" },
  });
  const wallRight = Bodies.rectangle(370, 500, 100, 1000, {
    isStatic: true,
    render: { fillStyle: "transparent" },
  });
  World.add(engine.world, [wallLeft, wallRight, ground, background]);

  Engine.run(engine);
  Render.run(render);

  resize();
  // gameOver();
  refreshLoop();

  init();
  window.addEventListener("resize", resize);

  addEventListener("mousedown", () => {
    if (isGameOver) return;

    isClicking = isMouseOver;
  });
  addEventListener("touchstart", (e) => {
    if (isGameOver) return;

    isClicking = true;
    mousePos = e.touches[0].clientX / parent.style.zoom;
  });

  addEventListener("mouseup", () => {
    if (isGameOver) return;

    isClicking = false;
  });
  addEventListener("touchend", () => {
    if (isGameOver) return;

    isClicking = false;

    if (isGameOver) return;

    if (ball != null) {
      ball.createdAt = 0;
      ball.collisionFilter = {
        group: 0,
        category: 1,
        mask: -1,
      };
      Body.setVelocity(ball, { x: 0, y: (100 / fps) * 5.5 });
      ball = null;

      newSize = Math.ceil(Math.random() * 3);

      setTimeout(() => createNewBall(newSize), 500);
    }
  });

  addEventListener("mousemove", (e) => {
    if (isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    mousePos = e.clientX / parent.style.zoom - rect.left;
  });
  addEventListener("touchmove", (e) => {
    if (isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    mousePos = e.touches[0].clientX / parent.style.zoom - rect.left;
  });

  addEventListener("click", () => {
    if (isGameOver || !isMouseOver) return;

    if (ball != null) {
      ball.createdAt = 0;
      ball.collisionFilter = {
        group: 0,
        category: 1,
        mask: -1,
      };
      Body.setVelocity(ball, { x: 0, y: (100 / fps) * 5.5 });
      ball = null;

      newSize = Math.ceil(Math.random() * 3);

      setTimeout(() => createNewBall(newSize), 500);
    }
  });

  canvas.addEventListener("mouseover", () => {
    isMouseOver = true;
  });

  canvas.addEventListener("mouseout", () => {
    isMouseOver = false;
  });

  Events.on(engine, "beforeUpdate", () => {
    if (isGameOver) return;

    if (ball != null) {
      const gravity = engine.world.gravity;
      Body.applyForce(ball, ball.position, {
        x: -gravity.x * gravity.scale * ball.mass,
        y: -gravity.y * gravity.scale * ball.mass,
      });

      if (isClicking && mousePos !== undefined) {
        ball.position.x = mousePos;

        if (mousePos > 455) ball.position.x = 455;
        else if (mousePos < 25) ball.position.x = 25;
      }

      ball.position.y = 50;
    }

    isLineEnable = false;
    const bodies = Composite.allBodies(engine.world);
    for (let i = 4; i < bodies.length; i++) {
      body = bodies[i];

      if (body.position.y < 100) {
        if (
          body !== ball &&
          Math.abs(body.velocity.x) < 0.2 &&
          Math.abs(body.velocity.y) < 0.2
        ) {
          gameOver();
        }
      } else if (body.position.y < 150) {
        if (
          body !== ball &&
          Math.abs(body.velocity.x) < 0.5 &&
          Math.abs(body.velocity.y) < 0.5
        ) {
          isLineEnable = true;
        }
      }
    }
  });

  Events.on(engine, "collisionActive", collisionEvent);
  Events.on(engine, "collisionStart", collisionEvent);

  function collisionEvent(e) {
    if (isGameOver) return;

    e.pairs.forEach((collision) => {
      bodies = [collision.bodyA, collision.bodyB];

      if (bodies[0].size === undefined || bodies[1].size === undefined) return;

      if (bodies[0].size === bodies[1].size) {
        allBodies = Composite.allBodies(engine.world);
        if (allBodies.includes(bodies[0]) && allBodies.includes(bodies[1])) {
          if (
            (Date.now() - bodies[0].createdAt < 100 ||
              Date.now() - bodies[1].createdAt < 100) &&
            bodies[0].createdAt != 0 &&
            bodies[1].createdAt != 0
          ) {
            return;
          }

          World.remove(engine.world, bodies[0]);
          World.remove(engine.world, bodies[1]);

          World.add(
            engine.world,
            newBall(
              (bodies[0].position.x + bodies[1].position.x) / 2,
              (bodies[0].position.y + bodies[1].position.y) / 2,
              bodies[0].size === 11 ? 11 : bodies[0].size + 1
            )
          );

          score += bodies[0].size;

          var audio = new Audio("assets/pop.wav");
          audio.play();
        }
      }
    });
  }

  Events.on(render, "afterRender", () => {
    if (isGameOver) {
      ctx.fillStyle = "#ffffff55";
      ctx.rect(0, 0, 480, 720);
      ctx.fill();

      writeText("Game Over", "center", 219, 280, 50);
      writeText("Score: " + score, "center", 225, 320, 30);
      writeText("Score: " + score, "center", 225, 320, 30);
      updateHighScore();
    } else {
      // writeText(score, "start", 25, 60, 40);
      scoreElement.textContent = score;
      if (isLineEnable) {
        ctx.strokeStyle = "#f55";
        ctx.beginPath();
        ctx.moveTo(0, 100);
        ctx.lineTo(480, 100);
        ctx.stroke();
      }
    }
  });

  function writeText(text, textAlign, x, y, size) {
    const scaledSize = size * parent.style.zoom;  // ปรับขนาดข้อความตาม Zoom
    ctx.font = `${scaledSize}px NanumSquare`;
    ctx.textAlign = textAlign;
    ctx.lineWidth = scaledSize / 8;
  
    ctx.strokeStyle = "#000";
    ctx.strokeText(text, x * parent.style.zoom, y * parent.style.zoom);
  
    ctx.fillStyle = "#fff";
    ctx.fillText(text, x * parent.style.zoom, y * parent.style.zoom);
  }

  function resize() {
    if (isMobile()) {
      canvas.width = window.innerWidth;  // ปรับขนาด Canvas ตามความกว้างของหน้าจอ
      canvas.height = window.innerHeight;  // ปรับขนาด Canvas ตามความสูงของหน้าจอ
      parent.style.zoom = 1; // ไม่ต้อง Zoom ในกรณีมือถือ
      floor.style.height = "0px";  // ไม่ต้องให้พื้นที่สำหรับ Canvas บนมือถือ
    } else {
      canvas.height = 720;
      canvas.width = 320;
      parent.style.zoom = window.innerHeight / 720 / 1.3;
      parent.style.top = `${(canvas.height * parent.style.zoom) / 15}px`;
      floor.style.height = "50px";
    }
  
    Render.setPixelRatio(render, parent.style.zoom * 2);
  }

  function refreshLoop() {
    window.requestAnimationFrame(() => {
      const now = performance.now();
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
      }
      times.push(now);
      fps = times.length;
      refreshLoop();
    });
  }

  function isMobile() {
    return window.innerHeight / window.innerWidth >= 1.49;
  }

  function init() {
    isGameOver = false;
    ball = null;
    engine.timing.timeScale = 1;
    score = 0;

    gameOverlayer.style.display = "none";

    while (engine.world.bodies.length > 4) {
      engine.world.bodies.pop();
    }

    createNewBall(1);
  }

  // หลังจากที่เรียก gameOver()
function gameOver() {
  isGameOver = true;
  engine.timing.timeScale = 0;

  const restartButton = document.getElementById("restartButton");
  restartButton.style.display = "block";

  if (ball != null) World.remove(engine.world, ball);
}

function restartGame() {
  init(); // เรียกใช้ฟังก์ชัน init เพื่อรีเซ็ตสถานะเกม
  gameOverlayer.style.display = "none"; // ซ่อน overlay เมื่อเริ่มเกมใหม่
  canvas.classList.remove("game-over"); // ลบคลาส game-over ออกจาก canvas
  updateHighScore(); // อัปเดตการแสดงคะแนนสูง
}

// window.restartGame = restartGame;
  
  function updateHighScore() {
    if (score > highScore) {
        highScore = score;

        // Update high score to Google Sheets
        fetch('https://script.google.com/macros/s/AKfycbxzOM4Hz2zBcFbgJ2jJMY0gKw5WJ7__ZTzdhhmd2OZ2mXW2hyyysaVfG1DscEMP6rFp/exec', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `score=${highScore}`,
        })
        .then(response => response.text())
        .then(data => {
            console.log(data); // Log the response from the server
        })
        .catch(error => {
            console.error('Error updating high score:', error);
        });
    }

    writeText("High Score: " + highScore, "center", 225, 360, 20);
}


  function createNewBall(size) {
    ball = newBall(render.options.width / 2, 50, size);
    ball.collisionFilter = {
      group: -1,
      category: 2,
      mask: 0,
    };

    World.add(engine.world, ball);
  }

  function newBall(x, y, size) {
    c = Bodies.circle(x, y, size * 10, {
      render: {
        sprite: {
          texture: `assets/${size}.webp`,
          xScale: size / 12.75,
          yScale: size / 12.75,
          // 12.75
        },
      },
    });
    c.size = size;
    c.createdAt = Date.now();
    c.restitution = 0.3;
    c.friction = 0.1;

    return c;
  }
  function getDataFromWebApp() {
    fetch('https://script.google.com/macros/s/AKfycbxT3KOZTLhWOJ-c1vtkXmQsgmFVpljlOPfndpcsbpe9KkhKcDd2fPQwVn9w41HVgjvH/exec')
      .then(response => response.json())
      .then(data => {
        console.log('Data received:', data);
        // You can handle the data as needed
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  // Call the function when the page is loaded
  window.onload = function() {
    getDataFromWebApp();
  };
})();
