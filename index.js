function Game() {
    this.width = 40;
    this.height = 24;
    this.map = [];
    this.player = {
        health: 100,
        damage: 10
    };
    this.enemies = [];
    
 
    this.lastPlayerMove = 0; 
    this.lastPlayerAttack = 0; 
    this.moveCooldown = 300;
    this.attackCooldown = 1000;
}





Game.prototype.getRandomPosition = function(min, max, forbiddenPositions) {
    var position;
    do {
        position = min + Math.floor(Math.random() * (max - min + 1));
    } while (forbiddenPositions[position] !== undefined);
    return position;
};

Game.prototype.generateCorridors = function() {
    var forbiddenPositions = {}; 

    // Генерация горизонтальных проходов
    var hCount = 3 + Math.floor(Math.random() * 3);
    
    for (var i = 0; i < hCount; i++) {
        var y = this.getRandomPosition(1, this.height - 2, forbiddenPositions);
        
        for (var x = 0; x < this.width; x++) {
            this.map[y][x] = '.';
        }
        
        // Блокируем текущую координату и соседние
        forbiddenPositions[y] = true;
        if (y - 1 >= 1) forbiddenPositions[y - 1] = true;
        if (y + 1 < this.height) forbiddenPositions[y + 1] = true;
    }

    // Генерация вертикальных проходов
    var vCount = 3 + Math.floor(Math.random() * 3);
    
    for (var i = 0; i < vCount; i++) {
        var x = this.getRandomPosition(1, this.width - 2, forbiddenPositions);
        
        for (var y = 0; y < this.height; y++) {
            this.map[y][x] = '.';
        }
        
        // Блокируем текущую координату и соседние
        forbiddenPositions[x] = true;
        if (x - 1 >= 1) forbiddenPositions[x - 1] = true;
        if (x + 1 < this.width) forbiddenPositions[x + 1] = true;
    }
};

Game.prototype.generateRooms = function() {
    var roomCount = 5 + Math.floor(Math.random() * 6); 
    for (var i = 0; i < roomCount; i++) {
        var roomWidth = 3 + Math.floor(Math.random() * 6); 
        var roomHeight = 3 + Math.floor(Math.random() * 6); 
        var roomX = Math.floor(Math.random() * (this.width - roomWidth - 1)) + 1; 
        var roomY = Math.floor(Math.random() * (this.height - roomHeight - 1)) + 1; 

        // Проверка на пересечение с коридорами
        var canPlaceRoom = false;
        for (var y = roomY; y < roomY + roomHeight; y++) {
            for (var x = roomX; x < roomX + roomWidth; x++) {
                if (this.map[y][x] === '.') { // Проверяем, есть ли коридор
                    canPlaceRoom = true; // Если хотя бы одна клетка занята коридором, можем разместить
                }
            }
        }

        // Если место свободно, и комната не изолирована, размещаем комнату
        if (canPlaceRoom || this.isAreaFree(roomX, roomY, roomWidth, roomHeight)) {
            this.placeRoom(roomX, roomY, roomWidth, roomHeight);
        } else {
            i--; // Если комната не прошла проверку, уменьшаем счетчик, чтобы попробовать снова
        }
    }
};

// Вспомогательная функция для размещения комнаты
Game.prototype.placeRoom = function(roomX, roomY, roomWidth, roomHeight) {
    for (var y = roomY; y < roomY + roomHeight; y++) {
        for (var x = roomX; x < roomX + roomWidth; x++) {
            this.map[y][x] = '.'; // Заменяем на проход
        }
    }
};


Game.prototype.isAreaFree = function(roomX, roomY, roomWidth, roomHeight) {
    for (var y = roomY; y < roomY + roomHeight; y++) {
        for (var x = roomX; x < roomX + roomWidth; x++) {
            if (this.map[y][x] !== 'W') { // Если хотя бы одна клетка занята, не можем разместить
                return true;
            }
        }
    }
    return false; // Область свободна
};


Game.prototype.placeItems = function() {
    var itemsToPlace = [
        { className: 'tileSW', count: 2 }, 
        { className: 'tileHP', count: 10 } 
    ];

    itemsToPlace.forEach(item => {
        var placedCount = 0;
        while (placedCount < item.count) {
            var x = Math.floor(Math.random() * this.width);
            var y = Math.floor(Math.random() * this.height);
            // Проверяем, что клетка пустая
            if (this.map[y][x] === '.') {
                this.map[y][x] = item.className;
                placedCount++;
            }
        }
    });
};

Game.prototype.generateEnemies = function(enemyCount, health, damage) {
    enemyCount = enemyCount || 10;
    health = health || 50;
    damage = damage || 8;
    
    for (var i = 0; i < enemyCount; i++) {
        this.enemies.push(this.createEnemy(health, damage));
    }
};

Game.prototype.createEnemy = function(health, damage) {
    return {
        health: health,
        maxHealth: health,
        damage: damage,
        x: -1, // Позиция будет установлена при размещении
        y: -1
    };
};

Game.prototype.placeEnemies = function() {
    this.generateEnemies(); 
    var placedCount = 0;

    while (placedCount < this.enemies.length) {
        var x = Math.floor(Math.random() * this.width);
        var y = Math.floor(Math.random() * this.height);
        // Проверяем, что клетка пустая и находится в коридоре или комнате
        if (this.map[y][x] === '.') {
            this.map[y][x] = 'tileE'; 
            // Сохраняем позицию врага
            this.enemies[placedCount].x = x;
            this.enemies[placedCount].y = y;
            placedCount++;
        }
    }
};

Game.prototype.placePlayer = function() {
    var placed = false;
    var attempts = 0;

    while (!placed && attempts < 1000) {
        var x = Math.floor(Math.random() * this.width);
        var y = Math.floor(Math.random() * this.height);
        
        if (this.map[y][x] === '.') {
            this.map[y][x] = 'tileP';
            placed = true;
        }
        attempts++;
    }
};


Game.prototype.moveEntity = function(entityType, direction, currentX, currentY) {
    var newX = currentX;
    var newY = currentY;

    switch (direction) {
        case 'w': newY = currentY - 1; break;
        case 's': newY = currentY + 1; break;
        case 'a': newX = currentX - 1; break;
        case 'd': newX = currentX + 1; break;
    }

    if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
        var canMove = false;
        
        if (entityType === 'player') {
            canMove = this.map[newY][newX] === '.' || 
                this.map[newY][newX] === 'tileHP' || 
                this.map[newY][newX] === 'tileSW';
        } else if (entityType === 'enemy') {
            canMove = this.map[newY][newX] === '.';
        }

        if (canMove) {
            var oldContent = this.map[currentY][currentX];
            this.map[currentY][currentX] = '.';
            this.map[newY][newX] = oldContent;
            return { success: true, newX: newX, newY: newY };
        }
    }
    
    return { success: false };
};

Game.prototype.movePlayer = function(direction) {
    if (this.player.health <= 0) {
        return;
    }

    var currentTime = Date.now();
    
    if (currentTime - this.lastPlayerMove < this.moveCooldown) {
        return;
    }
    
    this.lastPlayerMove = currentTime;
    
    var playerX, playerY;
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            if (this.map[y][x] === 'tileP') {
                playerX = x;
                playerY = y;
                break;
            }
        }
    }

    var newX = playerX;
    var newY = playerY;

    switch (direction) {
        case 'w': newY--; break;
        case 's': newY++; break;
        case 'a': newX--; break;
        case 'd': newX++; break;
    }

    if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
        if (this.map[newY][newX] === 'tileE') {
            return;
        } else if (this.map[newY][newX] === 'tileSW') {
            this.pickupSword(newX, newY);
            this.moveEntity('player', direction, playerX, playerY);
            this.render();
        } else if (this.map[newY][newX] === 'tileHP') {
            this.pickupHealthPotion(newX, newY);
            this.moveEntity('player', direction, playerX, playerY);
            this.render();
        } else {
            this.moveEntity('player', direction, playerX, playerY);
            this.render();
        }
    }
};

Game.prototype.moveEnemies = function() {
    var directions = ['w', 'a', 's', 'd'];
    
    for (var i = 0; i < this.enemies.length; i++) {
        var enemy = this.enemies[i];
        
        if (enemy.x >= 0 && enemy.y >= 0) {
            if (this.canEnemyAttackPlayer(enemy.x, enemy.y)) {
                this.enemyAttackPlayer(enemy.x, enemy.y);
            } else {
                var randomDirection = directions[Math.floor(Math.random() * directions.length)];
                var result = this.moveEntity('enemy', randomDirection, enemy.x, enemy.y);
                if (result.success) {
                    enemy.x = result.newX;
                    enemy.y = result.newY;
                }
            }
        }
    }
};

Game.prototype.playerAttack = function() {
    if (this.player.health <= 0) {
        return;
    }

    var currentTime = Date.now();
    
    if (currentTime - this.lastPlayerAttack < this.attackCooldown) {
        return;
    }
    
    this.lastPlayerAttack = currentTime;
    
    var playerX, playerY;
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            if (this.map[y][x] === 'tileP') {
                playerX = x;
                playerY = y;
                break;
            }
        }
    }

    var attackedEnemies = 0;
    var directions = [
        {dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1},
        {dx: -1, dy: 0},                    {dx: 1, dy: 0},
        {dx: -1, dy: 1},  {dx: 0, dy: 1},  {dx: 1, dy: 1}
    ];
    
    for (var i = 0; i < directions.length; i++) {
        var newX = playerX + directions[i].dx;
        var newY = playerY + directions[i].dy;
        
        if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
            if (this.map[newY][newX] === 'tileE') {
                if (this.damageEnemy(newX, newY, this.player.damage)) {
                    attackedEnemies++;
                }
            }
        }
    }
    
    if (attackedEnemies > 0) {
        this.render();
    }
};

Game.prototype.canEnemyAttackPlayer = function(enemyX, enemyY) {
    var playerX, playerY;
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            if (this.map[y][x] === 'tileP') {
                playerX = x;
                playerY = y;
                break;
            }
        }
    }
    
    var directions = [
        {dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1},
        {dx: -1, dy: 0},                    {dx: 1, dy: 0},
        {dx: -1, dy: 1},  {dx: 0, dy: 1},  {dx: 1, dy: 1}
    ];
    
    for (var i = 0; i < directions.length; i++) {
        var checkX = enemyX + directions[i].dx;
        var checkY = enemyY + directions[i].dy;
        
        if (checkX === playerX && checkY === playerY) {
            return true;
        }
    }
    
    return false;
};

Game.prototype.enemyAttackPlayer = function(enemyX, enemyY) {
    var enemy = this.enemies.find(function(e) { return e.x === enemyX && e.y === enemyY; });
    if (enemy) {
        this.player.health -= enemy.damage;
        
        if (this.player.health <= 0) {
            this.player.health = 0;
            this.showGameOver();
        }
        
        this.render();
    }
};

Game.prototype.damageEnemy = function(x, y, damage) {
    var enemyIndex = this.enemies.findIndex(e => e.x === x && e.y === y);
    if (enemyIndex !== -1) {
        this.enemies[enemyIndex].health -= damage;

        if (this.enemies[enemyIndex].health <= 0) {
            // Враг умер - убираем с карты
            this.map[y][x] = '.';
            this.enemies.splice(enemyIndex, 1); // Удаляем врага из массива
        }
        return true; 
    }
    return false; // Враг не найден
};

Game.prototype.init = function() {
    if (this.enemyMoveInterval) {
        clearInterval(this.enemyMoveInterval);
    }
    
    // Генерация карты
    for (var y = 0; y < this.height; y++) {
        this.map[y] = [];
        for (var x = 0; x < this.width; x++) {
            this.map[y][x] = 'W';
        }
    }

    this.generateCorridors(); 
    this.generateRooms();     
    this.placeItems(); 
    this.placeEnemies(); 
    this.placePlayer(); 
    this.render();

    // Обработчики событий
    if (this.keyHandler) {
        window.removeEventListener('keydown', this.keyHandler);
    }

    var self = this;
    this.keyHandler = function(event) {
        var direction = null;
        
        if (event.code === 'Space') {
            event.preventDefault();
            self.playerAttack();
            return;
        }
        
        switch(event.code) {
            case 'KeyW':
            case 'KeyЦ': direction = 'w'; break;
            case 'KeyA':
            case 'KeyФ': direction = 'a'; break;
            case 'KeyS':
            case 'KeyЫ': direction = 's'; break;
            case 'KeyD':
            case 'KeyВ': direction = 'd'; break;
        }
        
        if (direction) {
            self.movePlayer(direction);
        }
    };

    window.addEventListener('keydown', this.keyHandler);
    
    this.enemyMoveInterval = setInterval(function() {
        self.moveEnemies();
        self.render();
    }, 1000);
    
    // Инициализируем обработчики Game Over
    this.initGameOverHandlers();
};

Game.prototype.render = function() {
    var field = document.querySelector('.field');
    field.innerHTML = '';
    
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            var type = this.map[y][x];
            var tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.left = (x * 25) + 'px';
            tile.style.top = (y * 25) + 'px';
            
            if (type === 'W') {
                tile.classList.add('tileW');
            } else if (type === '.') {
                tile.classList.add('tile');
            } else if (type === 'tileSW') {
                tile.classList.add('tileSW');
            } else if (type === 'tileHP') {
                tile.classList.add('tileHP');
            } else if (type === 'tileE') {
                tile.classList.add('tileE');
                var enemy = this.enemies.find(e => e.x === x && e.y === y);
                if (enemy) {
                    var healthDiv = document.createElement('div');
                    healthDiv.className = 'health';
                    healthDiv.style.width = (enemy.health / enemy.maxHealth) * 100 + '%';
                    tile.appendChild(healthDiv);
                }
            } else if (type === 'tileP') {
                tile.classList.add('tileP');
                var healthDiv = document.createElement('div');
                healthDiv.className = 'health';
                healthDiv.style.width = this.player.health + '%';
                tile.appendChild(healthDiv);
            }
            field.appendChild(tile);
        }
    }
};

Game.prototype.pickupSword = function() {
    this.player.damage += 5;
};

Game.prototype.pickupHealthPotion = function() {
    this.player.health = Math.min(100, this.player.health + 30);
};


Game.prototype.showGameOver = function() {
    var gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) {
        gameOverScreen.style.display = 'flex';
    } 
};


Game.prototype.hideGameOver = function() {
    var gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) {
        gameOverScreen.style.display = 'none';
    }
};


Game.prototype.restartGame = function() {
    this.hideGameOver();
    
    // Очищаем старые данные
    this.enemies = [];
    this.map = [];
    this.player.health = 100;
    this.player.damage = 10;
    this.lastPlayerMove = 0;
    this.lastPlayerAttack = 0;
    
    // Очищаем интервалы
    if (this.enemyMoveInterval) {
        clearInterval(this.enemyMoveInterval);
    }
    
    // Очищаем обработчики событий
    if (this.keyHandler) {
        window.removeEventListener('keydown', this.keyHandler);
    }
    
    // Запускаем игру заново
    this.init();
};

// Инициализация обработчиков Game Over
Game.prototype.initGameOverHandlers = function() {
    var self = this;
    var restartButton = document.getElementById('restart-button');
    
    if (restartButton) {
        restartButton.addEventListener('click', function() {
            self.restartGame();
        });
    }
    
};

