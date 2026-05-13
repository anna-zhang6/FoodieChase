class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 700;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -900;

        this.LOOKAHEAD_X = 180;   // how far ahead (px) to shift the camera horizontally
        this.LOOKAHEAD_Y = 60;    // vertical look-ahead (e.g. when falling fast)
        this.CAM_LERP = 0.08;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setScale(2.5);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(game.config.width/4, game.config.height/2, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        const mapW = this.map.widthInPixels * 2.5;
        const mapH = this.map.heightInPixels * 2.5;

        // Resize physics world to match scaled map
        this.physics.world.setBounds(0, 0, mapW, mapH);
        my.sprite.player.setCollideWorldBounds(true);

        this.cameras.main.setBounds(0, 0, mapW, mapH);

        this.cameras.main.startFollow(
            my.sprite.player,
            true,
            0.1,
            0.1
        );

        this.cameras.main.setDeadzone(80, 60);

        this._camOffsetX = 0;
        this._camOffsetY = 0;

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

    }

    update() {
        if(cursors.left.isDown) {
            // TODO: have the player accelerate to the left
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);

            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

        } else if(cursors.right.isDown) {
            // TODO: have the player accelerate to the right
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);

            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

        } else {
            // TODO: set acceleration to 0 and have DRAG take over
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
        my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        let targetOffsetX = 0;
        let targetOffsetY = 0;

        if (my.sprite.player.body.velocity.x > 10) {
            targetOffsetX = this.LOOKAHEAD_X;
        } else if (my.sprite.player.body.velocity.x < -10) {
            targetOffsetX = -this.LOOKAHEAD_X;
        }

        //  move current offset toward target offset
        this._camOffsetX = Phaser.Math.Linear(
            this._camOffsetX,
            targetOffsetX,
            this.CAM_LERP
        );

        this._camOffsetY = Phaser.Math.Linear(
            this._camOffsetY,
            targetOffsetY,
            this.CAM_LERP
        );

        // apply the offset to the camera follow
        this.cameras.main.setFollowOffset(
            -this._camOffsetX,
            -this._camOffsetY
        );
    }
}