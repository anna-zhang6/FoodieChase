class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlasXML("myAtlas", "spritesheet-characters-double.png", "spritesheet-characters-double.xml");

        // Load tilemap information
        this.load.spritesheet("tilemap_tiles", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.tilemapTiledJSON("platformer-level-1", "Game3.tmj");   // Tilemap in JSON
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('myAtlas', {
            frames: ["character_beige_walk_a", "character_beige_walk_b"]
        }),
        frameRate: 10,
        repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNames('myAtlas', {
                frames: ["character_beige_idle"]
            }),
            repeat: -1
        });

        this.anims.create({
            key: 'duck',
            frames: this.anims.generateFrameNames('myAtlas', {
                frames: ["character_beige_duck"]
            }),
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNames('myAtlas',{
                frames: ["character_beige_jump"]
            }),
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}