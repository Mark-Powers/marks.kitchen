# marks.kitchen
My personal website engine. Allows for posting content from a web interface.
Uses handlesbars templates and a database backend via sequelize. 

Configuration:
- Requires mysql database. Include a `config.json` in `src` directory with the following structure:
```json
{
    "database": {
        "host": "localhost",
        "user": "YOUR_USER",
        "database": "YOUR_DB",
        "password": "YOUR_PWD"
    }
}
```
