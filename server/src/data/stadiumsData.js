// 15 Iconic Global Cricket Stadiums with Verified Dimensions, Pitches, and Profiles
const STADIUMS = [
  {
    id: 'lords',
    name: "Lord's",
    fullName: "Lord's Cricket Ground",
    city: 'London',
    country: 'England',
    pitchType: 'Green',
    paceSupport: 88,
    spinSupport: 52,
    bounce: 'Steep',
    boundaryDimensions: {
      straight: 74,
      square: 65,
      description: 'Famous 8-foot slope from north to south providing natural seam movement'
    },
    historicalScores: {
      testAvg1stInn: 312,
      odiAvg1stInn: 242,
      t20Avg1stInn: 158,
      highestChasedT20: 172
    },
    weatherProfile: {
      typicalCondition: 'Overcast',
      rainProbability: 35,
      humidityPercent: 70,
      altitudeMeters: 38
    },
    dewConditions: {
      hasEveningDew: false,
      dewFactor: 0.05
    }
  },
  {
    id: 'mcg',
    name: 'MCG',
    fullName: 'Melbourne Cricket Ground',
    city: 'Melbourne',
    country: 'Australia',
    pitchType: 'Flat',
    paceSupport: 82,
    spinSupport: 58,
    bounce: 'True',
    boundaryDimensions: {
      straight: 88,
      square: 85,
      description: 'Colossal outfield requiring elite stamina for running; sixes require maximum power'
    },
    historicalScores: {
      testAvg1stInn: 338,
      odiAvg1stInn: 254,
      t20Avg1stInn: 162,
      highestChasedT20: 186
    },
    weatherProfile: {
      typicalCondition: 'Breezy',
      rainProbability: 25,
      humidityPercent: 55,
      altitudeMeters: 18
    },
    dewConditions: {
      hasEveningDew: false,
      dewFactor: 0.1
    }
  },
  {
    id: 'scg',
    name: 'SCG',
    fullName: 'Sydney Cricket Ground',
    city: 'Sydney',
    country: 'Australia',
    pitchType: 'Turning',
    paceSupport: 72,
    spinSupport: 84,
    bounce: 'True',
    boundaryDimensions: {
      straight: 78,
      square: 69,
      description: 'Traditional Australian spin paradise; breaks up toward Days 4 and 5'
    },
    historicalScores: {
      testAvg1stInn: 326,
      odiAvg1stInn: 258,
      t20Avg1stInn: 168,
      highestChasedT20: 201
    },
    weatherProfile: {
      typicalCondition: 'Clear',
      rainProbability: 20,
      humidityPercent: 60,
      altitudeMeters: 22
    },
    dewConditions: {
      hasEveningDew: false,
      dewFactor: 0.12
    }
  },
  {
    id: 'eden_gardens',
    name: 'Eden Gardens',
    fullName: 'Eden Gardens Stadium',
    city: 'Kolkata',
    country: 'India',
    pitchType: 'Turning',
    paceSupport: 68,
    spinSupport: 88,
    bounce: 'True',
    boundaryDimensions: {
      straight: 72,
      square: 67,
      description: 'Loud stadium colosseum; turns sharply under lights, with heavy winter dew'
    },
    historicalScores: {
      testAvg1stInn: 320,
      odiAvg1stInn: 262,
      t20Avg1stInn: 176,
      highestChasedT20: 212
    },
    weatherProfile: {
      typicalCondition: 'Humid',
      rainProbability: 30,
      humidityPercent: 78,
      altitudeMeters: 9
    },
    dewConditions: {
      hasEveningDew: true,
      dewFactor: 0.38
    }
  },
  {
    id: 'wankhede',
    name: 'Wankhede',
    fullName: 'Wankhede Stadium',
    city: 'Mumbai',
    country: 'India',
    pitchType: 'Flat',
    paceSupport: 76,
    spinSupport: 64,
    bounce: 'True',
    boundaryDimensions: {
      straight: 70,
      square: 64,
      description: 'Red soil pitch with sea breeze; true bounce and high-scoring T20 shootouts'
    },
    historicalScores: {
      testAvg1stInn: 345,
      odiAvg1stInn: 275,
      t20Avg1stInn: 188,
      highestChasedT20: 231
    },
    weatherProfile: {
      typicalCondition: 'Humid',
      rainProbability: 15,
      humidityPercent: 75,
      altitudeMeters: 8
    },
    dewConditions: {
      hasEveningDew: true,
      dewFactor: 0.42
    }
  },
  {
    id: 'narendra_modi',
    name: 'Narendra Modi Stadium',
    fullName: 'Narendra Modi Stadium (Motera)',
    city: 'Ahmedabad',
    country: 'India',
    pitchType: 'Dry',
    paceSupport: 74,
    spinSupport: 80,
    bounce: 'Variable',
    boundaryDimensions: {
      straight: 76,
      square: 71,
      description: '132,000 capacity arena with mixed red and black soil pitches'
    },
    historicalScores: {
      testAvg1stInn: 330,
      odiAvg1stInn: 260,
      t20Avg1stInn: 174,
      highestChasedT20: 205
    },
    weatherProfile: {
      typicalCondition: 'Clear',
      rainProbability: 10,
      humidityPercent: 45,
      altitudeMeters: 53
    },
    dewConditions: {
      hasEveningDew: true,
      dewFactor: 0.3
    }
  },
  {
    id: 'chepauk',
    name: 'Chepauk',
    fullName: 'M. A. Chidambaram Stadium',
    city: 'Chennai',
    country: 'India',
    pitchType: 'Turning',
    paceSupport: 55,
    spinSupport: 96,
    bounce: 'Low',
    boundaryDimensions: {
      straight: 70,
      square: 66,
      description: 'Premier spin fortress of India; low bounce and sharp turn from Day 1'
    },
    historicalScores: {
      testAvg1stInn: 335,
      odiAvg1stInn: 245,
      t20Avg1stInn: 160,
      highestChasedT20: 182
    },
    weatherProfile: {
      typicalCondition: 'Humid',
      rainProbability: 25,
      humidityPercent: 82,
      altitudeMeters: 7
    },
    dewConditions: {
      hasEveningDew: true,
      dewFactor: 0.32
    }
  },
  {
    id: 'chinnaswamy',
    name: 'Chinnaswamy',
    fullName: 'M. Chinnaswamy Stadium',
    city: 'Bengaluru',
    country: 'India',
    pitchType: 'Flat',
    paceSupport: 62,
    spinSupport: 58,
    bounce: 'True',
    boundaryDimensions: {
      straight: 68,
      square: 61,
      description: 'Six-hitting paradise with compact boundaries and altitude assistance'
    },
    historicalScores: {
      testAvg1stInn: 330,
      odiAvg1stInn: 285,
      t20Avg1stInn: 195,
      highestChasedT20: 218
    },
    weatherProfile: {
      typicalCondition: 'Breezy',
      rainProbability: 30,
      humidityPercent: 62,
      altitudeMeters: 920
    },
    dewConditions: {
      hasEveningDew: true,
      dewFactor: 0.28
    }
  },
  {
    id: 'the_oval',
    name: 'The Oval',
    fullName: 'Kennington Oval',
    city: 'London',
    country: 'England',
    pitchType: 'Dry',
    paceSupport: 78,
    spinSupport: 70,
    bounce: 'True',
    boundaryDimensions: {
      straight: 75,
      square: 68,
      description: 'Traditional English venue; great carry for pace early, reverse swing late'
    },
    historicalScores: {
      testAvg1stInn: 332,
      odiAvg1stInn: 265,
      t20Avg1stInn: 168,
      highestChasedT20: 194
    },
    weatherProfile: {
      typicalCondition: 'Overcast',
      rainProbability: 30,
      humidityPercent: 68,
      altitudeMeters: 14
    },
    dewConditions: {
      hasEveningDew: false,
      dewFactor: 0.05
    }
  },
  {
    id: 'headingley',
    name: 'Headingley',
    fullName: 'Headingley Cricket Ground',
    city: 'Leeds',
    country: 'England',
    pitchType: 'Green',
    paceSupport: 92,
    spinSupport: 48,
    bounce: 'Steep',
    boundaryDimensions: {
      straight: 73,
      square: 64,
      description: 'Heavy atmospheric swing venue under Leeds cloud cover; dramatic momentum shifts'
    },
    historicalScores: {
      testAvg1stInn: 295,
      odiAvg1stInn: 252,
      t20Avg1stInn: 165,
      highestChasedT20: 188
    },
    weatherProfile: {
      typicalCondition: 'Overcast',
      rainProbability: 40,
      humidityPercent: 75,
      altitudeMeters: 85
    },
    dewConditions: {
      hasEveningDew: false,
      dewFactor: 0.05
    }
  },
  {
    id: 'newlands',
    name: 'Newlands',
    fullName: 'Newlands Cricket Ground',
    city: 'Cape Town',
    country: 'South Africa',
    pitchType: 'Green',
    paceSupport: 86,
    spinSupport: 68,
    bounce: 'Steep',
    boundaryDimensions: {
      straight: 75,
      square: 66,
      description: 'Framed by Table Mountain; provides lateral movement on Day 1 and spin on Day 4'
    },
    historicalScores: {
      testAvg1stInn: 328,
      odiAvg1stInn: 250,
      t20Avg1stInn: 164,
      highestChasedT20: 184
    },
    weatherProfile: {
      typicalCondition: 'Windy',
      rainProbability: 20,
      humidityPercent: 60,
      altitudeMeters: 12
    },
    dewConditions: {
      hasEveningDew: false,
      dewFactor: 0.08
    }
  },
  {
    id: 'wanderers',
    name: 'Wanderers',
    fullName: 'Wanderers Stadium (Bullring)',
    city: 'Johannesburg',
    country: 'South Africa',
    pitchType: 'Cracked',
    paceSupport: 95,
    spinSupport: 42,
    bounce: 'Steep',
    boundaryDimensions: {
      straight: 78,
      square: 68,
      description: 'High altitude (1753m) Bullring; ball travels faster through the air, ferocious bounce'
    },
    historicalScores: {
      testAvg1stInn: 324,
      odiAvg1stInn: 278,
      t20Avg1stInn: 182,
      highestChasedT20: 208
    },
    weatherProfile: {
      typicalCondition: 'Clear',
      rainProbability: 25,
      humidityPercent: 42,
      altitudeMeters: 1753
    },
    dewConditions: {
      hasEveningDew: false,
      dewFactor: 0.06
    }
  },
  {
    id: 'gaddafi',
    name: 'Gaddafi Stadium',
    fullName: 'Gaddafi Stadium',
    city: 'Lahore',
    country: 'Pakistan',
    pitchType: 'Flat',
    paceSupport: 72,
    spinSupport: 76,
    bounce: 'True',
    boundaryDimensions: {
      straight: 74,
      square: 67,
      description: 'Subcontinental batting surface with reverse swing and evening winter fog'
    },
    historicalScores: {
      testAvg1stInn: 350,
      odiAvg1stInn: 268,
      t20Avg1stInn: 178,
      highestChasedT20: 198
    },
    weatherProfile: {
      typicalCondition: 'Clear',
      rainProbability: 15,
      humidityPercent: 55,
      altitudeMeters: 217
    },
    dewConditions: {
      hasEveningDew: true,
      dewFactor: 0.35
    }
  },
  {
    id: 'premadsa',
    name: 'R. Premadasa',
    fullName: 'R. Premadasa Stadium',
    city: 'Colombo',
    country: 'Sri Lanka',
    pitchType: 'Turning',
    paceSupport: 60,
    spinSupport: 94,
    bounce: 'Low',
    boundaryDimensions: {
      straight: 74,
      square: 68,
      description: 'Slow turning deck under humid tropical skies; spinner delight'
    },
    historicalScores: {
      testAvg1stInn: 310,
      odiAvg1stInn: 240,
      t20Avg1stInn: 155,
      highestChasedT20: 176
    },
    weatherProfile: {
      typicalCondition: 'Humid',
      rainProbability: 45,
      humidityPercent: 85,
      altitudeMeters: 6
    },
    dewConditions: {
      hasEveningDew: true,
      dewFactor: 0.3
    }
  },
  {
    id: 'kensington_oval',
    name: 'Kensington Oval',
    fullName: 'Kensington Oval',
    city: 'Bridgetown',
    country: 'Barbados',
    pitchType: 'Dry',
    paceSupport: 84,
    spinSupport: 66,
    bounce: 'True',
    boundaryDimensions: {
      straight: 76,
      square: 67,
      description: 'Caribbean Mecca with constant Atlantic trade winds and true bounce'
    },
    historicalScores: {
      testAvg1stInn: 325,
      odiAvg1stInn: 255,
      t20Avg1stInn: 165,
      highestChasedT20: 180
    },
    weatherProfile: {
      typicalCondition: 'Windy',
      rainProbability: 25,
      humidityPercent: 72,
      altitudeMeters: 16
    },
    dewConditions: {
      hasEveningDew: false,
      dewFactor: 0.1
    }
  }
];

const getStadiumById = (id) => {
  if (!id) return STADIUMS[0];
  const query = id.toLowerCase().trim();
  return STADIUMS.find(s => s.id === query || s.name.toLowerCase() === query || s.fullName.toLowerCase().includes(query)) || STADIUMS[0];
};

const getAllStadiums = () => STADIUMS;

module.exports = {
  STADIUMS,
  getStadiumById,
  getAllStadiums
};
