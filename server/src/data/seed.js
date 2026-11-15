#!/usr/bin/env node
/**
 * CRICKETVERSE Database Seeder & Verification CLI
 * Seeds MongoDB if running, or verifies in-memory database fallback.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB, getDBStatus, isMongoConnected } = require('../config/db');
const {
  initialUsers,
  initialPlayers,
  initialRooms,
  initialTeams,
  initialMatches,
  initialTournaments
} = require('./seedData');

const User = require('../models/User');
const Player = require('../models/Player');
const Room = require('../models/Room');
const Team = require('../models/Team');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');

const seedDatabase = async () => {
  console.log('\n🏏 --- CRICKETVERSE DATABASE SEEDER --- 🏏\n');
  const force = process.argv.includes('--force');

  try {
    await connectDB();
    const mongoActive = isMongoConnected();

    if (mongoActive) {
      console.log('📦 Connected to MongoDB:', getDBStatus().connectionString);

      if (force) {
        console.log('⚠️  Force flag detected. Purging existing collections...');
        await Promise.all([
          User.deleteMany({}),
          Player.deleteMany({}),
          Room.deleteMany({}),
          Team.deleteMany({}),
          Match.deleteMany({}),
          Tournament.deleteMany({})
        ]);
        console.log('✅ Collections purged.');
      }

      const existingUsers = await User.countDocuments();
      if (existingUsers === 0 || force) {
        console.log('🌱 Inserting seed documents into MongoDB:');
        const [users, players, rooms, teams, matches, tournaments] = await Promise.all([
          User.insertMany(initialUsers),
          Player.insertMany(initialPlayers),
          Room.insertMany(initialRooms),
          Team.insertMany(initialTeams),
          Match.insertMany(initialMatches),
          Tournament.insertMany(initialTournaments)
        ]);

        console.log(`   ✓ ${users.length} Users seeded (Demo Account: captain@cricketverse.com / password123)`);
        console.log(`   ✓ ${players.length} Iconic Players seeded with legal attribution & format OVRs`);
        console.log(`   ✓ ${rooms.length} Auction Rooms seeded (Demo Room: IPL-2026)`);
        console.log(`   ✓ ${teams.length} Franchises seeded`);
        console.log(`   ✓ ${matches.length} Matches seeded`);
        console.log(`   ✓ ${tournaments.length} Tournaments seeded`);
      } else {
        console.log('ℹ️  MongoDB already contains data. Use --force to reset and reseed.');
      }
    } else {
      console.log('⚡ Running in In-Memory / File-Persisted Fallback mode (No external MongoDB needed).');
      console.log(`   ✓ ${initialUsers.length} Users active in memory`);
      console.log(`   ✓ ${initialPlayers.length} Iconic Players active in memory`);
      console.log(`   ✓ ${initialRooms.length} Multiplayer Rooms active in memory (Code: IPL-2026)`);
      console.log(`   ✓ ${initialTeams.length} Franchises active in memory`);
      console.log(`   ✓ ${initialMatches.length} Matches active in memory`);
      console.log(`   ✓ ${initialTournaments.length} Tournaments active in memory`);
    }

    console.log('\n🎯 --- CRICKETVERSE SEEDING COMPLETE --- 🎯\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
