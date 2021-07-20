const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "userData.db");

let dbConnectionOjb = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    dbConnectionOjb = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server started at http://localhost:3000 ");
    });
  } catch (error) {
    console.log(`Error : ${error.message}`);
    process.exit(-1);
  }
};

initializeDbAndServer();
//USER REGISTER API
app.post("/register", async (request, response) => {
  const reqBody = request.body;
  const { username, name, password, gender, location } = reqBody;
  console.log(`AT BEGINNING :-----Password-Length : ${password.length}`);
  const isUserFindQuery = `SELECT * FROM user 
            WHERE username = '${username}';`;

  const userList = await dbConnectionOjb.get(isUserFindQuery);

  if (userList === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const postUserQuery = `INSERT INTO 
            user(username,name,password,gender,location)
            VALUES(
                '${username}',
                '${name}',
                '${hashedPassword}' ,
                '${gender}',
                '${location}'
                );`;

      await dbConnectionOjb.run(postUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//USER LOGIN API

app.post("/login", async (request, response) => {
  const reqBody = request.body;
  const { username, password } = reqBody;
  console.log(`AT BEGINNING :-----Password-Length : ${password.length}`);
  const isUserFindQuery = `SELECT * FROM user 
            WHERE username = '${username}';`;

  const userList = await dbConnectionOjb.get(isUserFindQuery);

  if (userList !== undefined) {
    const isValidPassword = await bcrypt.compare(password, userList.password);
    if (isValidPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//CHANGE PASSWORD API

app.put("/change-password", async (request, response) => {
  const reqBody = request.body;
  const { username, oldPassword, newPassword } = reqBody;

  const isUserFindQuery = `SELECT * FROM user 
            WHERE username = '${username}';`;

  const userList = await dbConnectionOjb.get(isUserFindQuery);

  if (userList !== undefined) {
    const isValidCurrentPassword = await bcrypt.compare(
      oldPassword,
      userList.password
    );
    if (isValidCurrentPassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const SetNewPassWordQuery = `UPDATE  
                user SET 
                password = '${hashedPassword}' 
                WHERE   username = '${username}';`;
        await dbConnectionOjb.run(SetNewPassWordQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

module.exports = app;
