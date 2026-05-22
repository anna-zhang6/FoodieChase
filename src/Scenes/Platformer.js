class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 300;
        this.DRAG = 1500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1050;
        this.JUMP_VELOCITY = -360;

        this.isGameOver = false;
        this.isWin = false;
        this.endScreenShown = false;
        this.controlsLocked = false;
    }

    preload(){
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');

        this.load.audio('bgmusic', 'assets/bgmusic.mp3');
        this.load.audio('lostSfx', 'assets/lost.ogg');
        this.load.audio('jumpSfx', 'assets/jump.ogg');
        this.load.audio('winSfx', 'assets/winning.ogg');
        this.load.audio('foodSfx', 'assets/food.ogg');
        this.load.audio('powerupSfx', 'assets/powerup.ogg');
        this.load.audio('slowdownSfx', 'assets/slowdowns.ogg');

    }

    updateHungerBar() {
        if (!this.hungerBar) return;

        const x = 10;
        const y = 10;
        const width = 300;
        const height = 50;

        const value = Phaser.Math.Clamp(this.HUNGER, 0, this.HUNGER_MAX);
        const percent = value / this.HUNGER_MAX;

        this.hungerBar.clear();

        this.hungerBar.fillStyle(0x000000, 1);
        this.hungerBar.fillRect(x - 2, y - 2, width + 4, height + 4);

        this.hungerBar.fillStyle(0x440000, 1);
        this.hungerBar.fillRect(x, y, width, height);

        let color = 0x00ff00;
        if (percent < 0.6) color = 0xffff00;
        if (percent < 0.3) color = 0xff0000;

        this.hungerBar.fillStyle(color, 1);
        this.hungerBar.fillRect(x, y, width * percent, height);
    }

    create() {
        this.bgmusic = this.sound.add('bgmusic', {
            loop: true,
            volume: 0.4
        });
        if (!this.bgmusic.play()){
            this.bgmusic.play();
        }

        // SFX
        this.jumpSound = this.sound.add('jumpSfx', { volume: 0.5 });
        this.winSound = this.sound.add('winSfx', { volume: 0.7 });
        this.lostSound = this.sound.add('lostSfx', { volume: 0.7 });
        this.foodSound = this.sound.add('foodSfx', { volume: 0.6 });
        this.powerupSound = this.sound.add('powerupSfx', { volume: 0.6 });
        this.slowdownSound = this.sound.add('slowdownSfx', { volume: 0.6 });

        this.cameras.main.setZoom(2.5);
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 120, 25);
        this.animatedTiles.init(this.map);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");

        //backdrop
        this.backdropLayer = this.map.createLayer("background", this.tileset, 0, 0);
        //this.backdropLayer.setScale(2.5);

        // Create a layer
        this.groundLayer = this.map.createLayer("ground-n-platform", this.tileset, 0, 0);
        //this.groundLayer.setScale(2.5);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        //moving platforms
        this.movingPlatforms = this.physics.add.group({
            immovable: true,
            allowGravity: false
        });

        const movingTiles = this.groundLayer.filterTiles(tile => {
            return tile.properties.moving === true;
        });

        movingTiles.forEach(tile => {

            // hide original tile
            this.groundLayer.removeTileAt(tile.x, tile.y);

            const platform = this.movingPlatforms.create(
                tile.getCenterX(),
                tile.getCenterY(),
                'tilemap_tiles',
                tile.index - 1
            );

            platform.body.setAllowGravity(false);
            platform.body.setImmovable(true);

            // move up/down forever
            this.tweens.add({
                targets: platform,
                y: platform.y - 48,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Linear'
            });
        });

        ////////////////
        //collectibles//
        ////////////////
        // setting up powerups
        this.powerups = this.map.createFromObjects("powerups", {
            name: "powerup",
        });

        //this.powerups.forEach(p => p.setScale(2.5));
        this.physics.world.enable(this.powerups, Phaser.Physics.Arcade.STATIC_BODY);
        this.powerupGroup = this.add.group(this.powerups);

        this.anims.create({
            key: 'powerAnim', // Animation key
            frames: this.anims.generateFrameNumbers('tilemap_tiles', 
                {start: 107, end: 108}
            ),
            frameRate: 8,  // Higher is faster
            repeat: -1      // Loop the animation indefinitely
        });

        this.powerups.forEach(p => p.play('powerAnim'));

        // setting up slows
        this.slowdowns = this.map.createFromObjects("slowdowns", {
            name: "slowdowns",
        });
        this.physics.world.enable(this.slowdowns, Phaser.Physics.Arcade.STATIC_BODY);
        this.slowdownGroup = this.add.group(this.slowdowns);
        this.anims.create({
            key: 'slowAnim',
            frames: this.anims.generateFrameNumbers('tilemap_tiles',
                {start: 90, end: 92}
            ),
            frameRate: 8,
            repeat: -1
        });
        this.slowdowns.forEach(p => p.play('slowAnim'));

        // setting up food
        this.food = this.map.createFromObjects("food", {
            name: "food",
        });
        this.physics.world.enable(this.food, Phaser.Physics.Arcade.STATIC_BODY);
        this.foodGroup = this.add.group(this.food);
        this.anims.create({
            key: 'foodAnim',
            frames: this.anims.generateFrameNumbers('tilemap_tiles',
                {start: 13, end: 15}
            ),
            frameRate: 8,
            repeat: -1
        });
        this.food.forEach(p => p.play('foodAnim'));

        this.goalZone = this.map.createFromObjects("goal", {
            name: "goal"
        });

        this.physics.world.enable(this.goalZone, Phaser.Physics.Arcade.STATIC_BODY);

        this.goalGroup = this.add.group(this.goalZone);

        // optional: hide it visually
        this.goalZone.forEach(zone => zone.setVisible(false));
    
        
        ////////////////////////
        // set up player avatar
        my.sprite.player = this.physics.add.sprite(game.config.width/13, game.config.height/5, "myAtlas", "character_beige_idle")
        my.sprite.player.setScale(0.11);
        my.sprite.player.setOrigin(0.5, 0.5);

        my.sprite.player.body.setSize(150, 210, true);
        my.sprite.player.setCollideWorldBounds(true);

        my.sprite.player.setMaxVelocity(300, 1000);
        my.sprite.player.setDragX(this.DRAG);

        /////////////////////////////
        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.movingPlatforms);

        // collision with powerup
        this.physics.add.overlap(my.sprite.player, this.powerupGroup, (obj1, obj2) => {
            obj2.destroy(); // remove powerup on overlap
            this.powerupSound.play();
            const originalJUMP = this.JUMP_VELOCITY;
            this.JUMP_VELOCITY = -600
            this.time.delayedCall(1500, () => {
                this.JUMP_VELOCITY = originalJUMP;
            });
        });

        //collision with slowdown
        this.physics.add.overlap(my.sprite.player, this.slowdownGroup, (obj1, obj2) => {
            obj2.destroy(); // remove powerup on overlap
            this.slowdownSound.play();
            const originalAcceleration = this.ACCELERATION;
            const originalDRAG = this.DRAG
            this.ACCELERATION = 100;
            this.DRAG = 1000;
            this.time.delayedCall(1300, () => {
                this.ACCELERATION = originalAcceleration;
                my.sprite.player.setDragX(originalDRAG);
                my.sprite.player.setMaxVelocity(300, 1000); // reset to normal
            });
        });

        //collision with food
        this.physics.add.overlap(my.sprite.player, this.foodGroup, (obj1, obj2) => {
            obj2.destroy(); // remove powerup on overlap
            this.HUNGER = Math.min(this.HUNGER_MAX, this.HUNGER + 12);
            this.foodSound.play();
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.on('keydown-R', () => {
            this.scene.restart();
        });

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        my.vfx.walking = this.add.particles(10, 100, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.02, end: 0.08},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            gravityY: -200,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

        ////////////////
        // hunger bar //
        this.HUNGER_MAX = 100;
        this.HUNGER = 100;

        this.hungerBar = this.add.graphics();
        this.hungerBar.setScrollFactor(0);
        this.hungerBar.setDepth(9999);

        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.HUNGER = Math.max(0, this.HUNGER - 3);
            }
        });

        this.hungerBar.setVisible(true);

        this.updateHungerBar();

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(10, 10);

        this.uiCamera = this.cameras.add(0, 0, game.config.width, game.config.height);
        this.uiCamera.setScroll(0, 0);

        this.uiCamera.ignore([
            this.backdropLayer,
            this.groundLayer,
            my.sprite.player,
            my.vfx.walking,
            ...this.powerups,
            ...this.slowdowns,
            ...this.food,
            ...this.movingPlatforms.getChildren()
        ]);

        this.cameras.main.ignore(this.hungerBar);

        this.endText = this.add.text(
            game.config.width / 2,
            game.config.height / 2 - 20,
            "",
            {
                fontSize: "12px",
                color: "#ffffff",
                align: "center"
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(10000);

        this.restartText = this.add.text(
            game.config.width / 2,
            game.config.height / 2 + 30,
            "Press R to play again",
            {
                fontSize: "12px",
                color: "#ffff00"
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(10000);

        this.endText.setVisible(false);
        this.restartText.setVisible(false);

        this.physics.add.overlap(my.sprite.player, this.goalGroup, (player, goal) => {

            if (this.isWin || this.isGameOver) return;

            this.isWin = true;
            this.controlsLocked = true;

            this.physics.pause();

            const px = goal.x;
            const py = goal.y;

            

            this.tweens.add({
                targets: player,
                scale: 0,
                duration: 700,
                ease: "Back.In",
                onComplete: () => {
                    player.setPosition(px, py);
                    this.showEndScreen("You win!");
                    this.winSound.play();
                }
            });

        });

    }

    showEndScreen(message) {
        if (this.endScreenShown) return;

        this.endScreenShown = true;

        this.physics.pause();

        this.endText.setText(message);
        this.endText.setVisible(true);
        this.restartText.setVisible(true);
    }


    update() {

        if (this.HUNGER <= 0 && !this.isGameOver && !this.isWin) {
            this.isGameOver = true;
            this.lostSound.play();
            this.showEndScreen("Your stomach is empty!");
        }

        this.updateHungerBar();

        const onGround = my.sprite.player.body.blocked.down;
        const accel = onGround ? this.ACCELERATION : this.ACCELERATION * 0.4;

        if(cursors.left.isDown) {
            // TODO: have the player accelerate to the left
            my.sprite.player.body.setAccelerationX(-accel);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                my.vfx.walking.setPosition(
                    my.sprite.player.x + 5,
                    my.sprite.player.y + my.sprite.player.displayHeight / 2
                );
            }

        } else if(cursors.right.isDown) {
            // TODO: have the player accelerate to the right
            my.sprite.player.body.setAccelerationX(accel);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                my.vfx.walking.setPosition(
                    my.sprite.player.x - 5,
                    my.sprite.player.y + my.sprite.player.displayHeight / 2
                );
            }

        } else {
            // TODO: set acceleration to 0 and have DRAG take over
            my.sprite.player.body.setAccelerationX(0);
            //my.sprite.player.body.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }

        //player duck
        if(cursors.down.isDown) {
            my.sprite.player.anims.play('duck', true);
            my.sprite.player.body.setSize(150, 140, true);
            my.sprite.player.setOrigin(0.5, 0.5);
        }
        else {
            my.sprite.player.setOrigin(0.5, 0.5);
            my.sprite.player.body.setSize(150, 210, true);
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
            my.vfx.walking.stop();
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpSound.play();

            const vx = Phaser.Math.Clamp(
                my.sprite.player.body.velocity.x,
                -400,
                400
            );
            my.sprite.player.setVelocityX(vx);
        }
        if (my.sprite.player.body.touching.down) {
            this.movingPlatforms.children.iterate(platform => {
                if (!platform) return;
                if (my.sprite.player.body.touching.down &&
                    my.sprite.player.body.blocked.down &&
                    Phaser.Geom.Intersects.RectangleToRectangle(
                        my.sprite.player.getBounds(),
                        platform.getBounds()
                    )) {
                    my.sprite.player.y += platform.body.velocity.y * (1/60);
                }
            });
        }
    }
}