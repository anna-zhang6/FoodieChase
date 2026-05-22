class OpeningPage extends Phaser.Scene {
    constructor() {
        super("openingPage");
    }

    preload() {
        this.load.spritesheet("tilemap_tiles", "assets/tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        
    }

    create() {

        this.cameras.main.setBackgroundColor('#9b48b1');

        // title
        this.add.text(
            game.config.width / 2,
            60,
            'FOODIE CHASE',
            {
                fontSize: '40px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // subtitle
        this.add.text(
            game.config.width / 2,
            110,
            'Survive hunger and reach the portal!',
            {
                fontSize: '18px',
                color: '#dddddd'
            }
        ).setOrigin(0.5);

        /////////
        // FOOD
        const foodIcon = this.add.sprite(180, 220, 'tilemap_tiles', 13);
        foodIcon.setScale(2.5);

        this.add.text(250, 200, 'FOOD', {
            fontSize: '24px',
            color: '#00ff88',
            fontStyle: 'bold'
        });

        this.add.text(250, 235,
            'Restores hunger meter\nKeeps you alive longer',
            {
                fontSize: '16px',
                color: '#ffffff'
            }
        );

        ///////////
        // POWERUP
        const powerIcon = this.add.sprite(180, 360, 'tilemap_tiles', 107);
        powerIcon.setScale(2.5);

        this.add.text(250, 340, 'POWERUP', {
            fontSize: '24px',
            color: '#00ccff',
            fontStyle: 'bold'
        });

        this.add.text(250, 375,
            'Temporarily boosts jump height',
            {
                fontSize: '16px',
                color: '#ffffff'
            }
        );

        ////////////
        // SLOWDOWN
        const slowIcon = this.add.sprite(180, 500, 'tilemap_tiles', 90);
        slowIcon.setScale(2.5);

        this.add.text(250, 480, 'SLOWDOWN', {
            fontSize: '24px',
            color: '#ff5555',
            fontStyle: 'bold'
        });

        this.add.text(250, 515,
            'Reduces movement speed\nand acceleration',
            {
                fontSize: '16px',
                color: '#ffffff'
            }
        );

        ////////////
        // CONTROLS
        this.add.text(
            game.config.width / 2,
            640,
            'Arrow Keys to Move and Jump',
            {
                fontSize: '18px',
                color: '#ffff00'
            }
        ).setOrigin(0.5);

        ///////////////
        // START BUTTON
        const startText = this.add.text(
            game.config.width / 2,
            720,
            'PRESS SPACE TO START',
            {
                fontSize: '28px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: {
                    x: 20,
                    y: 10
                }
            }
        ).setOrigin(0.5);

        // blinking effect
        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        ///////////////////
        // START GAME INPUT
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('loadScene');
        });
    }
}
