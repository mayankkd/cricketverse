// ==========================================
// PHASE 10: CRICKET COMMENTARY PERSONALITIES SERVICE
// Professional, Hype, and Savage Commentary Engines
// ==========================================

const COMMENTARY_TEMPLATES = {
  SIX: {
    Professional: [
      "{striker} picks the length exceptionally early, transfers the weight onto the backfoot, and strikes it with immaculate technique over {direction} for SIX. Textbook execution.",
      "Pure cricketing elegance. {striker} extends the arms, presents the full face of the blade, and sends it 98 meters over {direction} for a maximum.",
      "Superb balance and hand-eye coordination. {bowler} missed the yorker length by a fraction, and {striker} punished it ruthlessly over {direction} for SIX.",
      "Magnificent bat swing through the line of the ball. {striker} uses the stadium wind perfectly to carry the boundary rope for SIX.",
      "High quality strokeplay under pressure. {striker} holds the pose as the ball lands deep into the {direction} stands."
    ],
    Hype: [
      "BOOM! TO THE MOON! {striker} UNLEASHES ABSOLUTE CARNAGE! THAT BALL IS HEADED INTO ORBIT OVER {direction}! MAXIMUM!",
      "REMEMBER THE NAME! {striker} CONNECTS LIKE A GOLF CLUB STRIKE! 105 METERS! THE CROWD IS ROARING IN DELIRIUM! SIX!",
      "OH MY GOODNESS ME! SWEET MOTHER OF CRICKET! THAT IS AN ABSOLUTE MONSTER HIT! IT DISAPPEARED OVER {direction}!",
      "THAT IS OUT OF THE GROUND AND DOWN THE HIGHWAY! {striker} SENDS {bowler} DEEP INTO THE NIGHT SKY! MASSIVE MAXIMUM!",
      "TRACER BULLET LAUNCH! WHAT A PHENOMENAL STRIKE! {striker} JUST TOOK THE ROOF OFF THE STADIUM!"
    ],
    Savage: [
      "Someone call NASA, {bowler} just funded a space exploration mission. That ball might re-enter the atmosphere by tomorrow morning.",
      "A buffet delivery from {bowler}, and {striker} ate the whole dessert section. That wasn't bowling, that was charitable donation.",
      "{bowler} thought about bowling a slower ball, then delivered a batting practice melon that got dispatched to another postal code.",
      "The ball boy outside the stadium gate needs danger pay whenever {bowler} runs up to bowl to {striker}.",
      "If bowling pies was an Olympic discipline, that delivery by {bowler} would comfortably take home the gold medal."
    ]
  },
  FOUR: {
    Professional: [
      "Glorious timing. {striker} leans into the cover drive, piercing the infield gap with clinical precision. Traces the outfield for FOUR.",
      "Deft placement by {striker}. Opened the face of the bat at the point of impact, steering it through {direction} for a boundary.",
      "Excellent running of the wrists. {striker} waited on the bounce and guided it neatly into the pocket for FOUR.",
      "Punished with authority. Short and wide from {bowler}, and {striker} cuts it crisply between point and cover for FOUR.",
      "Pure class. Not a muscle moved in haste—just pristine timing and sweet willow sound as the ball rattles the boundary hoardings."
    ],
    Hype: [
      "CRACK! BULLET THROUGH THE GAP! THAT WENT LIKE LIGHTNING ACROSS THE CARPET FOR FOUR!",
      "STAND AND DELIVER! WHAT A SHOT! RIFLED TO THE FENCE AT THE SPEED OF SOUND! GLORIOUS BOUNDARY!",
      "OH YES HE CAN! {striker} FINDS THE GAP LIKE A SURGEON! THE ROPE NEVER HAD A CHANCE! FOUR RUNS!",
      "LIGHTNING IN A BOTTLE! {striker} FLASHES THE BLADE AND IT SIZZLES THROUGH {direction} FOR FOUR!",
      "MAGNIFICENT STROKE! YOU CAN HEAR THE WILLOW RESOUND ACROSS THE ENTIRE CITY! BOUNDARY!"
    ],
    Savage: [
      "The fielders in {direction} had three working days to reach that ball and still arrived thirty seconds after it crossed the rope.",
      "{bowler} gave {striker} so much room to hit that shot, he could have parked a double-decker bus in the gap.",
      "Fielders chasing that were running like they were wearing cement boots. Welcome four runs.",
      "That delivery was so wide it needed its own passport. Four runs effortlessly collected.",
      "A textbook gift from {bowler}. Complete with gift wrap and a handwritten thank-you note."
    ]
  },
  WICKET: {
    Bowled: {
      Professional: [
        "TIMBER! What an unplayable delivery from {bowler}! Perfect seam presentation, nipping back sharply off the pitch to shatter the stumps. {striker} is completely cleaned up.",
        "Gone! Bowled him! {bowler} hits the top of off stump—the holy grail of fast bowling. {striker} played all around it.",
        "Sensational line and length! Bowled him neck and crop! The ball sneaks between bat and pad through the gate to shatter the stumps. An absolute peach by {bowler}!"
      ],
      Hype: [
        "TIMBERRRRRRR! THE FURNITURE IS RATTLED! THE STUMPS ARE FLYING TOWARD THE WICKETKEEPER! WHAT A RIPPER BY {bowler}!",
        "CASTLED! OFF STUMP OUT OF THE GROUND AND CARTWHEELING! {bowler} PULLS OFF A SENSATIONAL STRIKE! HUGE WICKET!",
        "GONE! BOWLED EM! AN INSWINGING MISSILE SHATTERS THE DEFENSE! STADIUM EXPLODES IN CELEBRATION!"
      ],
      Savage: [
        "There was so much daylight between {striker}'s bat and pad you could have built a shopping mall in between. Cleaned up.",
        "{striker} took an ugly wild swing at that like he was swatting a mosquito in the dark. Lost his middle stump in the process.",
        "That gate was open wider than a bank vault on a Monday morning. {bowler} walked right in."
      ]
    },
    LBW: {
      Professional: [
        "Dead straight! Umpire raises the finger without hesitation! {bowler} traps {striker} right in front of middle stump. Plumb LBW.",
        "Struck on the knee roll in line with middle. {striker} was trapped on the backfoot, beaten for pace and late movement.",
        "Appealed and given! {bowler}'s disciplined corridor pays dividends. A crucial breakthrough."
      ],
      Hype: [
        "UP GOES THE FINGER! TRAPPED PLUMB IN FRONT! {bowler} ROARS WITH DELIGHT! MASSIVE APPEAL UPHELD!",
        "STRUCK ON THE PADS! UMPIRE DOES NOT HESITATE! THAT WAS CRASHING INTO MIDDLE AND LEG! BIG FISH DEPARTING!",
        "DEAD AS A DODO! {bowler} PRODUCES A MASTERSTROKE DELIVERY AND GETS HIS MAN! PLUMB LBW!"
      ],
      Savage: [
        "Even {striker}'s own family wouldn't review that. So plumb he could have called a plumber to fix the leg.",
        "{striker} stood there looking confused, but the only thing more confused than him was his footwork.",
        "Bat nowhere near the ball. Pad right in front of all three stumps. An easy day at the office for the umpire."
      ]
    },
    Caught: {
      Professional: [
        "Edged and taken! Vicious lateral movement catches the outside edge, and the wicketkeeper takes a clean catch at regulation height.",
        "Mistimed in the air, and comfortably pouched at {direction}. {striker} looks disappointed with the shot selection.",
        "Splendid catch! The fielder judges the swirling ball on the boundary rope with composure. Big wicket for {bowler}."
      ],
      Hype: [
        "IN THE AIRRRRR... AND TAKEN! WHAT A CLUTCH CATCH! {bowler} STRIKES AND THE DUGOUT LEAPS UP IN JUBILATION!",
        "EDGED AND GONE! SAFELY SNATCHED IN THE SLIP CORDON! A CRUCIAL MOMENTUM SHIFT IN THIS CONTEST!",
        "LOOPED HIGH INTO THE SKY... THE FIELDER SETS UNDER IT... HELD! SPECTACULAR EFFORT IN THE DEEP!"
      ],
      Savage: [
        "That shot belonged on a golf driving range, not on a cricket field. Spooned straight down the fielder's throat.",
        "{striker} played that like a cat playing with a ball of wool. A dolly of a catch anyone's grandma could have caught.",
        "A skier that stayed in the air so long the fielder had time to grab a coffee before catching it."
      ]
    },
    Stumped: {
      Professional: [
        "Deceived in flight! {striker} drawn out of the crease by the drift, spinning past the bat, and the keeper whips the bails off in a flash.",
        "Exquisite spin bowling. Dipped, gripped, and turned past the outside edge. Foot dragged on the line, OUT stumped.",
        "Brilliant wicketkeeping agility. Lightning hands remove the timber with the batter's foot centimeters outside the popping crease."
      ],
      Hype: [
        "LIGHTNING HANDS! THE BAILS ARE FLASHING! {striker} IS STRANDED DOWN THE TRACK! WHAT A DISMISSAL!",
        "GONE! WHIPPED OFF IN 0.1 SECONDS! THE KEEPER IS FASTER THAN A CHEETAH! OUT STUMPED!",
        "MAGIC BY THE SPINNER! TRICKED AND TRAPPED! THE BAILS ARE DISLODGED IN A BLINK!"
      ],
      Savage: [
        "{striker} went for a Sunday stroll outside his crease and forgot his house keys. Swiftly evicted.",
        "Stepped out to hit the ball to tomorrow and missed it by yesterday. Wicketkeeper did the honors effortlessly.",
        "Legend has it {striker} is still looking for that ball. Meanwhile the bails are already in the dressing room."
      ]
    },
    RunOut: {
      Professional: [
        "Direct hit! Direct hit at the non-striker's end! Superb fielding agility, and {striker} is well short of the ground. Crucial self-destruction.",
        "Miscommunication between the wickets. Hesitation, the throw comes in flat and hard, and the bails are off. Out run out.",
        "Sensational pickup and throw on the slide. A millimeter-perfect strike ends the partnership."
      ],
      Hype: [
        "DIRECT HIT! OH UNBELIEVABLE! BULLSEYE FROM 30 YARDS OUT! HE IS MILES SHORT! SENSATIONAL FIELDING!",
        "CHAOS BETWEEN THE WICKETS! YES... NO... DISASTER! WHAT A BULLET THROW TO REMOVE THE STUMPS!",
        "THE STUMPS EXPLODE! A MOMENT OF PURE GENIUS IN THE FIELD! RUN OUT IN DRAMATIC FASHION!"
      ],
      Savage: [
        "Never run on a misfield, and definitely never run when your batting partner hasn't agreed. Total schoolboy comedy.",
        "Both batters ended up standing at the exact same crease staring at each other. You can't make this up.",
        "Running between the wickets brought to you by the Chuckle Brothers. Self-inflicted catastrophe."
      ]
    }
  },
  DOT: {
    Professional: [
      "Good length ball on off stump, defended solidly with a straight bat right back down the pitch. No run.",
      "Beaten for pace and lateral bounce. The ball whistles past the outside edge into the keeper's gloves. Dot ball.",
      "Tidy line and length from {bowler}. Cramping {striker} for room, pushed to point for no run.",
      "Sensible defensive leave outside off stump. {striker} watches the ball closely through to the keeper.",
      "Pitched on middle and straightening. Pushed firmly to mid-on, no single available."
    ],
    Hype: [
      "BEATEN! WHAT A SNORTER! THE BALL RIPS PAST THE OUTSIDE EDGE! {bowler} STARES DOWN THE BATTER!",
      "OH CLOSE! PLAY AND A MISS! 148 KM/H LIGHTNING BOLT PAST THE EDGE! BRILLIANT INTENSITY!",
      "PINNED ON THE CREASE! SOLID DEFENSE UNDER PRESSURE! WHAT A CONTEST BETWEEN BAT AND BALL!",
      "FIRED IN WITH FIRE AND FURY! {striker} MANAGES TO DUCK UNDER THE BOUNCER! SUPERB THEATER!",
      "PRESSURE COOKER! DOT BALL BUILDS THE HEAT! EVERY DELIVERY COUNTS RIGHT NOW!"
    ],
    Savage: [
      "{striker} swung like a rusty barn door in a hurricane and connected with thin air.",
      "Bat arrived so late for that ball it should have brought a doctor's note.",
      "The batter played a magnificent shot to a ball that wasn't there.",
      "{bowler} gave {striker} a friendly stare, mostly wondering if the batter remembers how to score.",
      "Nothing happened on that delivery, except {striker}'s strike rate taking another hit."
    ]
  },
  SINGLE: {
    Professional: [
      "Pushed gently into the gap at {direction}, and they scamper through for a well-judged single.",
      "Working the angle off the pads toward square leg. Good strike rotation keeping the scoreboard ticking.",
      "Dabbed softly behind point into the outfield. An easy single taken with positive intent.",
      "Turned off the hips toward deep fine leg. Steady accumulation under pressure.",
      "Driven firmly along the ground to long-off. Sensible cricket, rotating strike."
    ],
    Hype: [
      "QUICK SHIFT! SHARP CALL AND AN ENERGETIC SINGLE TAKEN! KEEPING THE BOWLER ON HIS TOES!",
      "DROPPED AND RUN! GREAT ATHLETICISM BETWEEN THE WICKETS! 1 RUN ADDED TO THE TALLY!",
      "CRISP STROKE, QUICK RUN! KEEPING THE MOMENTUM MOVING FORWARD WITH PURPOSE!",
      "SLAPPED INTO THE GAP! EXCELLENT UNDERSTANDING BETWEEN THESE TWO BATTERS FOR A SINGLE!",
      "SMART CRICKET! SINGLE TAKEN, BATTER STAYS AGGRESSIVE AT THE CREASE!"
    ],
    Savage: [
      "They stole a single while the fielder was adjusting his cap. Free run.",
      "Not the most glamorous shot in history, but hey, it gets {striker} off strike.",
      "A gentle tap that barely broke 5 km/h. Running was the only athletic part of that stroke.",
      "Pushed gently like a grandfather pushing a stroller in the park. Single taken.",
      "Scoreboard moved by 1. Somewhere in the stadium, one person politely clapped."
    ]
  },
  TWO: {
    Professional: [
      "Superb placement into the pocket at {direction}. Good hustle between the wickets turns one into a brace.",
      "Driven with precision into the deep cover sweeper region. Sharp turn and they comfortably complete two.",
      "Clipped off the pads through midwicket. Deep fielder has ground to cover, allowing an effortless second run.",
      "Lofted over extra cover, one bounce into the outfield. Great running yields two valuable runs.",
      "Tucked into the vacant midwicket gap. Excellent athletic running between these two batters."
    ],
    Hype: [
      "TWO TAKEN! SPRINTING HARD! THEY TURN FOR THE SECOND AND SLIDE IN SAFELY! GREAT RUNNING!",
      "ELECTRIC SPEED! PUTTING PRESSURE ON THE ARM OF THE FIELDER! SENSATIONAL BRACE!",
      "HUSTLE AND DESIRE! DIVE AT THE DANGER END... SAFE! TWO VALUABLE RUNS ADDED!",
      "DRIVEN INTO THE GAP! THEY PUSH FOR TWO AND GET IT EASILY! ELITE RUNNING BETWEEN WICKETS!",
      "SUPERB WORK! THAT PUTS THE BOWLING SIDE ON THE BACKFOOT! TWO RUNS RECORDED!"
    ],
    Savage: [
      "The fielder threw like he had a wet noodle for an arm, so they walked the second run.",
      "Dangerous second run that worked only because the fielder's throw was aimed at the international space station.",
      "Two runs picked up while the fielders looked around asking whose job it was to back up.",
      "Legs pumping like two hamsters on a wheel. They survived the second run by the skin of their teeth.",
      "Fielders took so long to fetch that ball the batters could have stopped for tea halfway across."
    ]
  }
};

/**
 * Deterministic index selection based on delivery sequence and seed
 */
const selectIndex = (arr, seedNum) => {
  if (!arr || arr.length === 0) return '';
  const idx = Math.abs(seedNum) % arr.length;
  return arr[idx];
};

/**
 * Generate Event-Based Commentary for all 3 personalities
 */
const generateMultiPersonalityCommentary = ({
  badge = 'SINGLE',
  wicketType = 'Caught',
  strikerName = 'Batter',
  bowlerName = 'Bowler',
  direction = 'Cover',
  seedNum = 1
}) => {
  const formatTemplate = (tmpl) => {
    return tmpl
      .replace(/\{striker\}/g, strikerName)
      .replace(/\{bowler\}/g, bowlerName)
      .replace(/\{direction\}/g, direction);
  };

  let profTmpl = '';
  let hypeTmpl = '';
  let savageTmpl = '';

  if (badge === 'WICKET') {
    const wType = wicketType || 'Caught';
    const pool = COMMENTARY_TEMPLATES.WICKET[wType] || COMMENTARY_TEMPLATES.WICKET.Caught;
    profTmpl = selectIndex(pool.Professional, seedNum);
    hypeTmpl = selectIndex(pool.Hype, seedNum + 1);
    savageTmpl = selectIndex(pool.Savage, seedNum + 2);
  } else {
    const pool = COMMENTARY_TEMPLATES[badge] || COMMENTARY_TEMPLATES.SINGLE;
    profTmpl = selectIndex(pool.Professional, seedNum);
    hypeTmpl = selectIndex(pool.Hype, seedNum + 1);
    savageTmpl = selectIndex(pool.Savage, seedNum + 2);
  }

  const prof = formatTemplate(profTmpl);
  const hp = formatTemplate(hypeTmpl);
  const svg = formatTemplate(savageTmpl);

  return {
    professional: prof,
    hype: hp,
    savage: svg,
    Professional: prof,
    Hype: hp,
    Savage: svg
  };
};

module.exports = {
  COMMENTARY_TEMPLATES,
  generateMultiPersonalityCommentary
};
