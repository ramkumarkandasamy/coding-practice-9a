const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();


app.post("/register", async (request, response) => {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = bcrypt.hash(request.body.password, 10);
    const selectUserQuery = `
    SELECT
        *
    FROM
        user
    WHERE
        username = '${username};`;
    const dbUser = await database.get(selectUserQuery);
    if(dbUser===undefined){
        const checkPassword = hashedPassword.length;
        if(checkPassword < 5){
            response.status(400);
            response.send("Password is too short");
        }else{
        const createUserQuery = `
        INSERT INTO
            user
        VALUES
            (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            )`;
        const dbResponse = await database.run(createUserQuery);
        const newUserId = dbResponse.lastID;
        response.send("User created successfully");
        //const lengthOfPassword = hashedPassword.length;
            }
    }else{
        response.status(400);
        response.send("User already exists");
    }
});


app.post("/login", async (request, response) => {
    const { username, password } = request.body;
    const selectQuery = `
    SELECT
        *
    FROM
        user
    WHERE
        username = '${username}';`;

const dbUser = await database.get(selectQuery);
if(dbUser===undefined){
    response.status(400);
    response.send("Invalid user");
} else{
    const isPassword = await bcrypt.compare(password, dbUser.password);
    if(isPassword===true){
        response.send("Login success!");
    }else{
        response.status(400);
        response.send("Invalid password")
    }
}
});

app.put("/change-password", async (request,response) => {
    const { username, oldPassword, newPassword } = request.body;
    const checkUserQuery = `
    SELECT
        *
    FROM
        user
    WHERE
        username = '${username}'`;
    const dbUser = await database.get(checkUserQuery);
    if(dbUser===undefined){
        response.status(400);
        response.send("User not registered");
    }else{
        const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
        if(isValidPassword===true){
            const lengthOfNew = newPassword.length;
            if(lengthOfNew < 5){
                response.status(400);
                response.send("Password is too short");
            }else{
                const encryptedPassword = await bcrypt.hash(newPassword, 10);
                const updatePassword = `
                UPDATE
                    user
                SET
                    password = '${encryptedPassword}'
                WHERE
                    username = '${username}'`;
                await database.run(updatePassword);
                response.send("Password updated");
            }
        
        
        }else{
            response.status(400);
            response.send("Invalid current password");
        }
    }
});
//console.log("Hello ram")

module.exports = app;

///  ccbp submit NJSCPFVWOF
