const server = require('./server');
const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));

const dbCreds = config.database;
const secret = config.jwt_secret;

const jwtFunctions = {
  sign: function(message) {
    return jwt.sign({ value: message }, secret);
  },
  verify: function(token) {
    return jwt.verify(token, secret).value;
  }
}

const database = new Sequelize(dbCreds.database, dbCreds.user, dbCreds.password, {
  logging(str) {
    console.debug(`DB:${str}`);
  },
  dialectOptions: {
    charset: 'utf8mb4',
    multipleStatements: true,
  },
//   host: dbCreds.host,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
});

database.authenticate().then(() => {
  console.debug(`database connection successful: ${dbCreds.database}`);
}, (e) => console.log(e));

async function sync(alter, force, callback) {
  await database.sync({ alter, force, logging: console.log });
}

function setUpModels(){
    const models = {
        "posts": database.define('posts', {
            description: {
              type: Sequelize.TEXT,
              allowNull: false,
            },
            type: {
              type: Sequelize.STRING,
              allowNull: false,
            },}),
        "pictures": database.define('pictures', {
            source: { type: Sequelize.TEXT, allowNull: false},
          }),
        "tags": database.define('tags', {
            text: { type: Sequelize.TEXT, allowNull: false},
          }),
        "users": database.define('user', {
            username: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            password: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            salt: {
              type: Sequelize.STRING,
              allowNull: false,
            },}),
        "requests": database.define('requests', {
            session: Sequelize.STRING,
            method: Sequelize.STRING,
            url: Sequelize.STRING,
        }),
        "emails": database.define('email', {
          address: Sequelize.STRING,
          name: Sequelize.STRING
        }),
        "wordsquares": database.define('wordsquare', {
          words: Sequelize.STRING,
          name: Sequelize.STRING,
          best: Sequelize.BOOLEAN
        }),
        "chessgames": database.define('chessgame', {
          pieces: Sequelize.TEXT,
          name: {type:Sequelize.STRING, primaryKey: true},
          turn: Sequelize.STRING,
          userside: Sequelize.STRING
        })
    }
    models.pictures.belongsTo(models.posts);
    models.tags.belongsTo(models.posts);
    return models;
}

const models = setUpModels();
const templates = require('./templates');
sync();

server.setUpRoutes(models, jwtFunctions, database, templates.setUpTemplates());
server.listen(config.port);

