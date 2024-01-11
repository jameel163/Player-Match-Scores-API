const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null
app.use(express.json())
const initailization = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running on http://localhost:3000/')
    })
  } catch (e) {
    console.log(`${e}`)
  }
}
initailization()

const converting = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

app.get('/players/', async (request, response) => {
  const query = `
    SELECT * FROM player_details
    `
  const result = await db.all(query)
  response.send(result.map(each => converting(each)))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const query = `
  SELECT * FROM player_details WHERE player_id=${playerId};
  `
  const result = await db.get(query)
  response.send(converting(result))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const query = `
  UPDATE player_details SET player_name = "${playerName}" WHERE player_id = ${playerId}
  `
  await db.run(query)
  response.send('Player Details Updated')
})

const convertingForMatch = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const query = `
  SELECT * FROM match_details WHERE match_id=${matchId};
  `
  const result = await db.get(query)
  response.send(convertingForMatch(result))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const query = `
  select match_id, match,year   
  from player_match_score natural join match_details 
  where player_match_score.player_id=${playerId}
  `
  const result = await db.all(query)
  response.send(result.map(each => convertingForMatch(each)))
})
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const query = `
  select player_id, player_name  
  from player_match_score natural join  player_details
  where player_match_score.match_id = ${matchId}
  `
  const result = await db.all(query)
  response.send(result.map(each => converting(each)))
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const query = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `
  const result = await db.all(query)
  response.send(result)
})

module.exports = app
