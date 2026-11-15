import Phaser from 'phaser';

export class CricketScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CricketScene' });
    this.isAnimating = false;
    this.onDeliveryFinished = null;
    this.tacticalPositions = null;
  }

  init(data) {
    this.tacticalPositions = data.tacticalPositions || null;
    this.onDeliveryFinished = data.onDeliveryFinished || null;
    this.strikerData = data.striker || { name: 'Virat Kohli', role: 'Batter', ovr: 115 };
    this.bowlerData = data.bowler || { name: 'Jasprit Bumrah', role: 'Bowler', ovr: 118 };
  }

  preload() {
    // Generate procedural textures using Graphics & Canvas to ensure 100% offline self-contained rendering
    this.createProceduralTextures();
  }

  createProceduralTextures() {
    // 1. Stadium Grass Pitch Oval
    const gGrass = this.make.graphics({ x: 0, y: 0, add: false });
    gGrass.fillStyle(0x0e2417, 1);
    gGrass.fillEllipse(480, 270, 920, 500);

    // Mowing pattern rings
    gGrass.lineStyle(16, 0x143522, 0.4);
    gGrass.strokeEllipse(480, 270, 780, 420);
    gGrass.strokeEllipse(480, 270, 580, 310);

    // Boundary rope
    gGrass.lineStyle(4, 0xffffff, 0.9);
    gGrass.strokeEllipse(480, 270, 900, 480);
    gGrass.generateTexture('field_ground', 960, 540);

    // 2. 30-Yard Circle
    const gCircle = this.make.graphics({ x: 0, y: 0, add: false });
    gCircle.lineStyle(2, 0xffffff, 0.6);
    gCircle.strokeEllipse(240, 150, 440, 270);
    gCircle.generateTexture('inner_circle', 480, 300);

    // 3. Pitch Clay Strip
    const gPitch = this.make.graphics({ x: 0, y: 0, add: false });
    gPitch.fillStyle(0xb89768, 1);
    gPitch.fillRoundedRect(0, 0, 80, 260, 6);
    gPitch.lineStyle(2, 0x7c5831, 1);
    gPitch.strokeRoundedRect(0, 0, 80, 260, 6);

    // Crease lines (White)
    gPitch.lineStyle(2, 0xffffff, 1);
    // Bowling Crease (Top)
    gPitch.lineBetween(5, 30, 75, 30);
    // Batting Crease (Bottom)
    gPitch.lineBetween(5, 230, 75, 230);
    // Popping lines
    gPitch.lineBetween(20, 15, 20, 30);
    gPitch.lineBetween(60, 15, 60, 30);
    gPitch.lineBetween(20, 230, 20, 245);
    gPitch.lineBetween(60, 230, 60, 245);

    gPitch.generateTexture('pitch_strip', 80, 260);

    // 4. Stumps & Bails
    const gStump = this.make.graphics({ x: 0, y: 0, add: false });
    gStump.fillStyle(0xd97706, 1);
    gStump.fillRect(0, 0, 20, 10);
    gStump.fillStyle(0xffffff, 1);
    gStump.fillRect(2, 0, 3, 10);
    gStump.fillRect(8, 0, 3, 10);
    gStump.fillRect(14, 0, 3, 10);
    gStump.generateTexture('wickets', 20, 10);

    // 5. Cricket Ball
    const gBall = this.make.graphics({ x: 0, y: 0, add: false });
    gBall.fillStyle(0xdc2626, 1); // Kookaburra Red
    gBall.fillCircle(8, 8, 7);
    gBall.lineStyle(1.5, 0xffffff, 0.8);
    gBall.lineBetween(3, 8, 13, 8); // White seam
    gBall.generateTexture('cricket_ball', 16, 16);

    // 6. Ball Shadow
    const gShadow = this.make.graphics({ x: 0, y: 0, add: false });
    gShadow.fillStyle(0x000000, 0.4);
    gShadow.fillEllipse(10, 6, 18, 10);
    gShadow.generateTexture('ball_shadow', 20, 12);

    // 7. Batsman (Striker in Stance)
    const gBat = this.make.graphics({ x: 0, y: 0, add: false });
    // Head / Helmet (Navy Blue)
    gBat.fillStyle(0x1e3a8a, 1);
    gBat.fillCircle(14, 10, 8);
    // Torso / Jersey (Gold/Yellow)
    gBat.fillStyle(0xf59e0b, 1);
    gBat.fillRoundedRect(6, 18, 16, 18, 3);
    // Pads (White)
    gBat.fillStyle(0xf8fafc, 1);
    gBat.fillRect(7, 36, 6, 16);
    gBat.fillRect(15, 36, 6, 16);
    // Cricket Bat (Wood Brown)
    gBat.fillStyle(0x92400e, 1);
    gBat.fillRect(22, 20, 5, 26);
    gBat.generateTexture('batsman_stance', 30, 54);

    // 8. Bowler
    const gBwl = this.make.graphics({ x: 0, y: 0, add: false });
    gBwl.fillStyle(0x3b82f6, 1); // Headband
    gBwl.fillCircle(14, 10, 7);
    gBwl.fillStyle(0x2563eb, 1); // Jersey
    gBwl.fillRoundedRect(6, 17, 16, 16, 3);
    gBwl.fillStyle(0x1e293b, 1); // Trousers
    gBwl.fillRect(7, 33, 6, 18);
    gBwl.fillRect(15, 33, 6, 18);
    gBwl.generateTexture('bowler_sprite', 28, 52);

    // 9. Fielder
    const gFld = this.make.graphics({ x: 0, y: 0, add: false });
    gFld.fillStyle(0x1d4ed8, 1);
    gFld.fillCircle(12, 9, 6);
    gFld.fillStyle(0x2563eb, 1);
    gFld.fillRoundedRect(5, 15, 14, 14, 2);
    gFld.fillStyle(0x1e293b, 1);
    gFld.fillRect(6, 29, 5, 15);
    gFld.fillRect(13, 29, 5, 15);
    gFld.generateTexture('fielder_sprite', 24, 46);
  }

  create() {
    this.cameras.main.setBackgroundColor('#08120b');

    // Stadium Oval Ground
    this.add.image(480, 270, 'field_ground');

    // Stands and Animated Crowd Silhouettes
    this.createAnimatedCrowd();

    // 30-Yard Inner Circle
    this.add.image(480, 270, 'inner_circle');

    // Central Pitch (80px wide x 260px tall)
    this.pitch = this.add.image(480, 270, 'pitch_strip');

    // Wickets:
    // Bowling End Wickets (y = 170)
    this.bowlingWickets = this.add.image(480, 168, 'wickets');
    // Batting End Wickets (y = 372)
    this.battingWickets = this.add.image(480, 372, 'wickets');

    // Striker (Facing down the pitch toward bowler at y=170)
    this.striker = this.add.sprite(465, 360, 'batsman_stance');

    // Non-Striker (Standing beside bowler at top crease)
    this.nonStriker = this.add.sprite(505, 175, 'batsman_stance');
    this.nonStriker.setScale(0.85);

    // Bowler (Starting at top of run-up at y = 95)
    this.bowler = this.add.sprite(480, 95, 'bowler_sprite');

    // Wicketkeeper (Standing behind batting stumps at y = 405)
    this.wicketKeeper = this.add.sprite(480, 405, 'fielder_sprite');

    // Ball & Shadow (Initially with bowler)
    this.ballShadow = this.add.image(480, 95, 'ball_shadow').setVisible(false);
    this.ball = this.add.image(480, 95, 'cricket_ball').setVisible(false);

    // 9 Tactical Fielders
    this.fielders = [];
    this.deployFielders();

    // Umpire (Square leg & Bowler end)
    this.umpire = this.add.circle(445, 168, 6, 0xffffff);

    // In-game Banner Overlay (FOUR, SIX, WICKET, etc.)
    this.bannerContainer = this.add.container(480, 250).setDepth(100).setAlpha(0);
    this.bannerBg = this.add.rectangle(0, 0, 420, 70, 0x0b0f17, 0.95);
    this.bannerBg.setStrokeStyle(2, 0xf59e0b);
    this.bannerText = this.add.text(0, -6, '', {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#F59E0B'
    }).setOrigin(0.5);
    this.bannerSubText = this.add.text(0, 20, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    this.bannerContainer.add([this.bannerBg, this.bannerText, this.bannerSubText]);

    // Particles / Fireworks for Six and Wickets
    this.createCelebrationParticles();
  }

  createAnimatedCrowd() {
    this.crowdDots = [];
    const colors = [0xf59e0b, 0x3b82f6, 0xef4444, 0x10b981, 0xffffff];

    // Perimeter crowd rings
    for (let i = 0; i < 90; i++) {
      const angle = (i / 90) * Math.PI * 2;
      const rx = 460 + Math.random() * 12;
      const ry = 250 + Math.random() * 10;
      const cx = 480 + Math.cos(angle) * rx;
      const cy = 270 + Math.sin(angle) * ry;

      const dot = this.add.circle(cx, cy, 3, Phaser.Utils.Array.GetRandom(colors));
      dot.setAlpha(0.65);
      this.crowdDots.push(dot);

      // Subtle crowd wave animation
      this.tweens.add({
        targets: dot,
        y: cy - (Math.random() * 4 + 2),
        duration: 800 + Math.random() * 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createCelebrationParticles() {
    // Canvas sparkle emitter using simple circles
    this.celebrationGroup = this.add.group();
  }

  deployFielders() {
    // 9 field coordinates mapped to 960x540 arena
    // Based on Phase 6 18-zone coordinate projections
    const defaultCoords = [
      { name: 'Slip', x: 440, y: 395 },
      { name: 'Gully', x: 380, y: 375 },
      { name: 'Point', x: 340, y: 340 },
      { name: 'Cover', x: 350, y: 280 },
      { name: 'Mid-off', x: 410, y: 210 },
      { name: 'Mid-on', x: 550, y: 210 },
      { name: 'Midwicket', x: 610, y: 280 },
      { name: 'Third Man', x: 260, y: 460 },
      { name: 'Long-on', x: 620, y: 90 }
    ];

    // If tactical positions supplied from Phase 6, use them
    let chosenCoords = defaultCoords;
    if (this.tacticalPositions && Array.isArray(this.tacticalPositions) && this.tacticalPositions.length === 9) {
      chosenCoords = this.tacticalPositions.map(pos => {
        // Map 600x600 coordinates from Phase 6 map to 960x540
        const scaleX = 960 / 600;
        const scaleY = 540 / 600;
        return {
          name: pos.position,
          x: (pos.x || 300) * scaleX,
          y: (pos.y || 300) * scaleY
        };
      });
    }

    chosenCoords.forEach((coord) => {
      const fielder = this.add.sprite(coord.x, coord.y, 'fielder_sprite');
      fielder.setData('originX', coord.x);
      fielder.setData('originY', coord.y);
      fielder.setData('posName', coord.name);
      this.fielders.push(fielder);
    });
  }

  // Authoritative delivery execution called by React Control Engine
  playDelivery(deliveryData, callback) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const {
      shotType = 'Drive',
      direction = 'Cover',
      timing = 'Good',
      deliveryTactic = 'Seam',
      pitchLength = 'Good Length',
      runs = 0,
      isWicket = false,
      wicketType = null,
      badge = 'SINGLE',
      commentary = ''
    } = deliveryData;

    // Reset banner
    this.bannerContainer.setAlpha(0);

    // ==========================================
    // STAGE 1: BOWLER RUN-UP
    // ==========================================
    this.tweens.add({
      targets: this.bowler,
      y: 155,
      duration: 650,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Release delivery
        this.executeBallDelivery({
          shotType,
          direction,
          timing,
          deliveryTactic,
          pitchLength,
          runs,
          isWicket,
          wicketType,
          badge,
          commentary,
          callback
        });
      }
    });
  }

  executeBallDelivery(data) {
    const {
      shotType,
      direction,
      timing,
      deliveryTactic,
      pitchLength,
      runs,
      isWicket,
      wicketType,
      badge,
      commentary,
      callback
    } = data;

    // Determine Pitch Point on pitch (y = 230 to 330)
    let pitchY = 285; // Good Length
    if (pitchLength === 'Yorker' || deliveryTactic === 'Yorker') pitchY = 345;
    if (pitchLength === 'Full') pitchY = 320;
    if (pitchLength === 'Short' || deliveryTactic === 'Bouncer') pitchY = 240;

    // Lateral Swing / Seam / Spin deviation
    let deviationX = 0;
    if (deliveryTactic === 'Swing' || deliveryTactic === 'Outswing') deviationX = -14;
    if (deliveryTactic === 'Inswing' || deliveryTactic === 'Off-spin') deviationX = 12;
    if (deliveryTactic === 'Leg-spin') deviationX = -16;

    this.ball.setPosition(480, 160).setVisible(true).setScale(1.2);
    this.ballShadow.setPosition(480, 165).setVisible(true).setScale(1.2);

    // Ball travel to pitch bounce point
    this.tweens.add({
      targets: this.ball,
      x: 480 + deviationX * 0.4,
      y: pitchY,
      duration: 380,
      ease: 'Linear',
      onUpdate: (tween, target) => {
        const progress = tween.progress;
        // Height arc (Z elevation)
        target.y = 160 + (pitchY - 160) * progress - Math.sin(progress * Math.PI) * 18;
        this.ballShadow.x = 480 + deviationX * 0.4 * progress;
        this.ballShadow.y = 160 + (pitchY - 160) * progress;
      },
      onComplete: () => {
        // Bounce chalk puff
        const puff = this.add.circle(480 + deviationX * 0.4, pitchY, 5, 0xffffff, 0.6);
        this.tweens.add({
          targets: puff,
          scale: 2,
          alpha: 0,
          duration: 200,
          onComplete: () => puff.destroy()
        });

        // Ball travel from bounce point to batting crease
        this.tweens.add({
          targets: this.ball,
          x: 480 + deviationX,
          y: 360,
          duration: 240,
          ease: 'Quad.easeOut',
          onUpdate: (tween, target) => {
            const progress = tween.progress;
            target.y = pitchY + (360 - pitchY) * progress - Math.sin(progress * Math.PI) * 12;
            this.ballShadow.x = 480 + deviationX * progress;
            this.ballShadow.y = pitchY + (360 - pitchY) * progress;
          },
          onComplete: () => {
            // Batsman Shot or Dismissal Collision
            this.handleBatBallCollision({
              shotType,
              direction,
              timing,
              runs,
              isWicket,
              wicketType,
              badge,
              commentary,
              callback
            });
          }
        });
      }
    });
  }

  handleBatBallCollision(data) {
    const {
      shotType,
      direction,
      timing,
      runs,
      isWicket,
      wicketType,
      badge,
      commentary,
      callback
    } = data;

    // Striker bat swing animation
    this.tweens.add({
      targets: this.striker,
      angle: shotType === 'Pull / Hook' ? -25 : (shotType === 'Cut' ? 20 : -15),
      x: 468,
      duration: 150,
      yoyo: true
    });

    if (isWicket) {
      this.executeDismissalAnimation(wicketType, badge, commentary, callback);
    } else {
      this.executeShotAnimation(shotType, direction, timing, runs, badge, commentary, callback);
    }
  }

  executeDismissalAnimation(wicketType, badge, commentary, callback) {
    // 1. Bowled: Shatter batting wickets
    if (wicketType === 'Bowled') {
      this.tweens.add({
        targets: this.battingWickets,
        y: 390,
        angle: 45,
        alpha: 0.6,
        duration: 350,
        ease: 'Bounce.easeOut'
      });
      this.ball.setVelocity ? this.ball.setVelocity(0, 0) : null;
    }

    // 2. LBW: Pads hit animation
    if (wicketType === 'LBW') {
      const appealFlash = this.add.circle(480, 360, 20, 0xff0000, 0.5);
      this.tweens.add({ targets: appealFlash, scale: 2, alpha: 0, duration: 400 });
    }

    // 3. Stumping: Keeper whips off bails
    if (wicketType === 'Stumped') {
      this.tweens.add({
        targets: this.striker,
        y: 345, // Out of crease
        duration: 200
      });
      this.tweens.add({
        targets: this.wicketKeeper,
        y: 380, // Whips bails
        duration: 250
      });
    }

    // 4. Caught: Ball loops to fielder or keeper
    if (wicketType === 'Caught') {
      const catcher = (this.fielders && this.fielders.length > 0) ? this.fielders[0] : this.wicketKeeper;
      this.tweens.add({
        targets: this.ball,
        x: catcher.x,
        y: catcher.y,
        duration: 380,
        ease: 'Quad.easeOut'
      });
      const catchFlash = this.add.circle(catcher.x, catcher.y, 16, 0x3b82f6, 0.6);
      this.tweens.add({ targets: catchFlash, scale: 2, alpha: 0, duration: 350 });
    }

    // 5. Run Out: Batter stranded mid-pitch, direct hit!
    if (wicketType === 'Run Out') {
      this.tweens.add({
        targets: this.striker,
        y: 270, // Stranded mid-pitch
        x: 470,
        duration: 300
      });
      this.tweens.add({
        targets: this.battingWickets,
        y: 385,
        angle: 30,
        alpha: 0.7,
        duration: 250
      });
      const runoutFlash = this.add.circle(480, 372, 22, 0xdc2626, 0.7);
      this.tweens.add({ targets: runoutFlash, scale: 2.2, alpha: 0, duration: 450 });
    }

    // Camera shake for wicket
    this.cameras.main.shake(250, 0.015);

    // Show Wicket Banner
    this.showBanner('OUT!', wicketType ? `${wicketType.toUpperCase()} • ${badge}` : 'WICKET', 0xdc2626);

    // Return bowler to runup
    this.time.delayedCall(1500, () => {
      this.resetField();
      this.isAnimating = false;
      if (callback) callback();
    });
  }

  executeShotAnimation(shotType, direction, timing, runs, badge, commentary, callback) {
    // Target coordinate based on shot direction
    let targetX = 350; // Cover
    let targetY = 280;

    if (direction === 'Mid-off') { targetX = 410; targetY = 210; }
    else if (direction === 'Long-off') { targetX = 320; targetY = 70; }
    else if (direction === 'Long-on') { targetX = 640; targetY = 70; }
    else if (direction === 'Midwicket') { targetX = 620; targetY = 280; }
    else if (direction === 'Deep Midwicket') { targetX = 740; targetY = 220; }
    else if (direction === 'Square Leg') { targetX = 640; targetY = 340; }
    else if (direction === 'Fine Leg') { targetX = 600; targetY = 460; }
    else if (direction === 'Third Man') { targetX = 260; targetY = 460; }
    else if (direction === 'Point') { targetX = 320; targetY = 340; }

    // If SIX: travels past boundary
    if (runs === 6) {
      targetX = targetX > 480 ? targetX + 180 : targetX - 180;
      targetY = targetY > 270 ? targetY + 120 : targetY - 120;
    }

    // Ball flight to outfield
    const duration = runs === 6 ? 1100 : (runs === 4 ? 850 : 650);

    this.tweens.add({
      targets: this.ball,
      x: targetX,
      y: targetY,
      duration,
      ease: runs === 6 ? 'Sine.easeOut' : 'Quad.easeOut',
      onUpdate: (tween, target) => {
        const prog = tween.progress;
        const maxArc = runs === 6 ? 90 : (runs === 4 ? 30 : 15);
        target.y = 360 + (targetY - 360) * prog - Math.sin(prog * Math.PI) * maxArc;
        this.ballShadow.x = 480 + (targetX - 480) * prog;
        this.ballShadow.y = 360 + (targetY - 360) * prog;
      },
      onComplete: () => {
        // Flash boundary banner
        if (runs === 6) {
          this.triggerFireworks();
          this.showBanner('SIX!', 'MAXIMUM • 105 METERS', 0x9333ea);
        } else if (runs === 4) {
          this.showBanner('FOUR!', 'CRACKING BOUNDARY', 0x06b6d4);
        } else if (runs > 0) {
          this.showBanner(`${runs} RUN${runs > 1 ? 'S' : ''}`, `${timing.toUpperCase()} TIMING • ${shotType}`, 0x10b981);
        } else {
          this.showBanner('DOT BALL', 'SOLID DEFENSE', 0x64748b);
        }
      }
    });

    // Batters Running Between Wickets
    if (runs > 0 && runs < 4) {
      this.animateRunning(runs);
    }

    // Closest fielder pursues ball
    this.animateFielderChase(targetX, targetY);

    this.time.delayedCall(duration + 1200, () => {
      this.resetField();
      this.isAnimating = false;
      if (callback) callback();
    });
  }

  animateRunning(runsCount) {
    const runDuration = 550;
    // Striker runs to bowling end (y: 360 -> 175)
    this.tweens.add({
      targets: this.striker,
      y: 175,
      x: 460,
      duration: runDuration,
      yoyo: runsCount >= 2,
      repeat: runsCount >= 2 ? 1 : 0
    });

    // Non-striker runs to batting end (y: 175 -> 360)
    this.tweens.add({
      targets: this.nonStriker,
      y: 360,
      x: 500,
      duration: runDuration,
      yoyo: runsCount >= 2,
      repeat: runsCount >= 2 ? 1 : 0
    });
  }

  animateFielderChase(targetX, targetY) {
    // Find closest fielder
    let closestFielder = null;
    let minDistance = Infinity;

    this.fielders.forEach(f => {
      const d = Phaser.Math.Distance.Between(f.x, f.y, targetX, targetY);
      if (d < minDistance) {
        minDistance = d;
        closestFielder = f;
      }
    });

    if (closestFielder) {
      this.tweens.add({
        targets: closestFielder,
        x: targetX,
        y: targetY,
        duration: 650,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Pickup & Throw back to keeper
          this.tweens.add({
            targets: closestFielder,
            x: closestFielder.getData('originX'),
            y: closestFielder.getData('originY'),
            duration: 800,
            delay: 300
          });
        }
      });
    }
  }

  triggerFireworks() {
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(480, 240, 4, 0xf59e0b);
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 140 + 50;

      this.tweens.add({
        targets: p,
        x: 480 + Math.cos(angle) * dist,
        y: 240 + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 900,
        ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }
  }

  showBanner(title, subtitle, color = 0xf59e0b) {
    this.bannerText.setText(title);
    this.bannerSubText.setText(subtitle);
    this.bannerBg.setStrokeStyle(2, color);
    this.bannerContainer.setAlpha(1).setScale(0.8);

    this.tweens.add({
      targets: this.bannerContainer,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  resetField() {
    this.ball.setVisible(false).setPosition(480, 95);
    this.ballShadow.setVisible(false).setPosition(480, 95);
    this.bowler.setPosition(480, 95);
    this.striker.setPosition(465, 360).setAngle(0);
    this.nonStriker.setPosition(505, 175);
    this.battingWickets.setPosition(480, 372).setAngle(0).setAlpha(1);
    this.bannerContainer.setAlpha(0);
  }
}
