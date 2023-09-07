const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const startDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at https://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

startDbAndServer();

//API 1 get all states

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * From state`;
  const statesList = await db.all(getStatesQuery);
  const resultStatesList = statesList.map((eachState) => {
    return {
      stateId: eachState.state_id,
      stateName: eachState.state_name,
      population: eachState.population,
    };
  });

  response.send(resultStatesList);
});

// API 2 get state

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  console.log(stateId);
  const getStateQuery = `
SELECT * from state WHERE state_id= ${stateId};`;
  const getMovie = await db.get(getStateQuery);
  const resultGetMovie = {
    stateId: getMovie.state_id,
    stateName: getMovie.state_name,
    population: getMovie.population,
  };
  response.send(resultGetMovie);
});

// API 3 create district

app.post("/districts/", async (request, response) => {
  const requestBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = requestBody;

  const addDistrictQuery = `
  INSERT INTO
  district(district_name,
state_id, cases, cured, active, deaths)
  VALUES(
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths})`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * from district WHERE district_id = ${districtId}`;
  const getDistrict = await db.get(getDistrictQuery);
  const resultGetDistrict = {
    districtId: getDistrict.district_id,
    districtName: getDistrict.district_name,
    stateId: getDistrict.state_id,
    cases: getDistrict.cases,
    cured: getDistrict.cured,
    active: getDistrict.active,
    deaths: getDistrict.deaths,
  };
  response.send(resultGetDistrict);
});

//API 5 delete district

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE from district
  WHERE district_id = ${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6 update district

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const requestBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = requestBody;
  const updateDistrictQuery = `
UPDATE district 
SET 
   district_name='${districtName}',
   state_id= ${stateId},
   cases= ${cases},
    cured=${cured},
    active= ${active}, 
    deaths=${deaths}
    WHERE 
    district_id = ${districtId}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7 States

app.get("/states/:stateId/stats/", async (request, response) => {
  const statedID = request.params.stateId;
  const stateQuery = `
  SELECT  SUM(cases) AS totalCases,SUM(cured) AS totalCured,
  SUM(active) AS totalActive, SUM(deaths) AS totalDeaths
  FROM state INNER JOIN district ON state.state_id=district.state_id
  WHERE state.state_id= ${statedID};
  `;
  const dbResponse = await db.get(stateQuery);
  response.send(dbResponse);
});

//API 8 districts

app.get("/districts/:districtId/details/", async (request, response) => {
  const districtID = request.params.districtId;

  const districtQuery = `
    SELECT state_name AS stateName
    FROM state INNER JOIN district
    ON state.state_id=district.state_id
    WHERE district.district_id=${districtID};
    `;
  const dbResponse = await db.get(districtQuery);
  response.send(dbResponse);
});

module.exports = app;
