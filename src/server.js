const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const request = require('request');
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const path = require('path');
const rss = require('rss');
const marked = require('marked');

const templates = require('./templates');

const Op = require('sequelize').Op;

const multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname+'/uploads/')
    },
    filename: function (req, file, cb) {
        var ext = "";
        if (file.originalname.includes(".")) {
            ext = "." + file.originalname.split(".")[1];
        }
        return cb(null, 'img-' + Date.now() + ext)
    }
})
var upload = multer({ storage: storage })

const server = express();
server.use(cookieParser())
server.use(bodyParser.urlencoded({ extended: true }));

async function addImagesAndTagsToPosts(models, posts) {
    for (const post of posts) {
        const images = await models.pictures.findAll({ attributes: ["source"], where: { postId: post.id } }).map(x => x.source);
        post.images = images;
        const tags = await models.tags.findAll({ attributes: ["text"], where: { postId: post.id } }).map(x => x.text);
        post.tags = tags;
    }
}

function listen(port) {
    server.listen(port, () => console.info(`Listening on port ${port}!`));
}

function hashWithSalt(password, salt){
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    return hash.digest("base64");
};

function formatDate(d) {
    let month = d.toLocaleString('default', { month: 'long' });
    return month + " " + d.getDate() + ", " + (1900+d.getYear())
}

async function formatPostsforSingle(models, postType, postId){
    var posts = await models.posts.findAll({
        where: { 
            type: postType,
            id: postId
        }, order: [['createdAt', 'DESC']]
    });
    posts = posts.map(x => x.get({ plain: true }));
    await addImagesAndTagsToPosts(models, posts)
    posts.forEach(post => {
        post.createdAt = formatDate(post.createdAt)
        post.showTitle = post.type != "bread"
    })
    return posts
}

async function formatPostsForType(models, postType){
    var posts = await models.posts.findAll({
        where: { type: postType }, order: [['createdAt', 'DESC']]
    });
    posts = posts.map(x => x.get({ plain: true }));
    await addImagesAndTagsToPosts(models, posts)
    posts.forEach(post => {
        post.createdAt = formatDate(post.createdAt)
        post.showTitle = post.type != "bread"
    })
    return posts;
}

function setUpRoutes(models, jwtFunctions, database, templates) {
    // Authentication routine
    server.use(function (req, res, next) {
        if (req.path.toLowerCase().startsWith("/admin")) {
            let cookie = req.cookies.authorization
            if (!cookie) {
                console.debug("Redirecting to login - no cookie")
                res.redirect('/login');
                return;
            }
            try {
                const decryptedUserId = jwtFunctions.verify(cookie);
                models.users.findOne({ where: { username: decryptedUserId } }).then((user, error) => {
                    if (user) {
                        res.locals.user = user.get({ plain: true });
                    } else {
                        console.debug("Redirecting to login - invalid cookie")
                        res.redirect('/login');
                        return;
                    }
                });
            } catch (e) {
                res.status(400).send(e.message);
            }
        }
        next();
    })

    // Route logging
    server.use(function (req, res, next) {
        let cookie = req.cookies.session;
        if (!cookie) {
            cookie = uuidv4();
            res.cookie('session', cookie, { expires: new Date(Date.now() + (1000 * 60 * 60)) });
        }
        models.requests.create({
            createdAt: new Date(), session: cookie, method: req.method, url: req.originalUrl
        });
        next()
    })

    server.get('/', async (req, res) => {
        let posts = await formatPostsForType(models, "index")
        let body = templates["index"]({posts});
        res.status(200).send(body)
    })
    server.get('/bread', async (req, res) => {
        let posts = await formatPostsForType(models, "bread")
        let body = templates["bread"]({posts});
        res.status(200).send(body)
    })
    server.get('/blog', async (req, res) => {
        let posts = await formatPostsForType(models, "blog")
        let body = templates["blog"]({posts});
        res.status(200).send(body)
    })
    server.get('/post/:type/:id', async (req, res) => {
        let posts = await formatPostsforSingle(models, req.params.type, req.params.id)
        let date = posts[0].createdAt;
        let body = templates["blog-single"]({posts, date});
        res.status(200).send(body)
    })
    server.get('/post/like/:type/:id', async (req, res) => {
        let type = req.params.type
        let id = req.params.id
        var post = await models.posts.findOne({
            where: { type, id },
        });
        post.update({likes: post.likes+1})
        res.status(200).send({likes: post.likes});
    })
    server.get('/tags/:name', async (req, res) => {
        const { name } = req.params;
        const postsWithTag = await models.tags.findAll({ attributes: ["postId"], where: { text: name } })
            .map(function (x) {
                return { id: x.postId }
            });
        var posts = await models.posts.findAll({
            where: { [Op.or]: postsWithTag }, order: [['createdAt', 'DESC']]
        });
        posts = posts.map(x => x.get({ plain: true }));
        await addImagesAndTagsToPosts(models, posts)
        posts.forEach(post => {
            post.createdAt = post.createdAt.toString().substring(0, 10)
        })

        let body = templates["tags"]({posts, name})
        res.status(200).send(body)
    })
    
    server.get('/admin', (req, res) => res.sendFile(__dirname + "/html/admin.html"));
    server.get('/login', (req, res) => res.sendFile(__dirname + "/html/login.html"))
    server.get('/email', (req, res) => res.sendFile(__dirname + "/html/email.html"))
    server.get('/email-success', (req, res) => res.sendFile(__dirname + "/html/email-success.html"))
    server.get('/feed', (req, res) => res.sendFile(__dirname + "/html/feed.html"));
    server.get('/essay', (req, res) => res.sendFile(__dirname + "/html/essay.html"));
    // server.get('/misc', (req, res) => res.sendFile(__dirname + "/html/misc.html"));
    server.get('/word-square', (req, res) => res.sendFile(__dirname + "/html/word-square.html"));
    server.get('/chess', (req, res) => res.sendFile(__dirname + "/html/chess.html"));
    server.get('/admin/chess', async (req, res, next) => res.sendFile(__dirname + "/html/chess.html"));
    // server.get('/projects', (req, res) => res.sendFile(__dirname + "/html/projects.html"));
    server.get('/zines', (req, res) => res.sendFile(__dirname + "/public/zines.html"));
    server.use('/static', express.static(__dirname + '/public'))

    server.get('/misc', async (req, res) => {
        let body = templates["misc"]();
        res.status(200).send(body)
    })
    server.get('/projects', async (req, res) => {
        let body = templates["projects"]();
        res.status(200).send(body)
    })

    server.get('/wordsquares/best', async (req, res, next) => {
        var best = await database.query("select words, name from wordsquares where best = 1", { type: database.QueryTypes.SELECT })
        res.status(200).send({ best: best });
    })
    server.get('/admin/chess/games', async (req, res, next) => {
        const { name } = req.params;
        var game = await models.chessgames.findOne({where: {
            turn: {
                [Op.ne]: {$col: 'userside'}
            }
        }})
        res.status(200).send({game:game});
    })
    server.get('/chess/:name', async (req, res, next) => {
        const { name } = req.params;
        var game = await models.chessgames.findOne({where: {name: name}})
        res.status(200).send({game:game});
    })
    server.get('/admin/emails', async (req, res, next) => {
        var emails = await models.emails.findAll();
        res.status(200).send(emails);
    })
    server.get('/admin/stats', async (req, res, next) => {
        try {
            var sessionResult = await database.query("SELECT session, count(id) as c FROM requests GROUP BY session HAVING c > 1", { type: database.QueryTypes.SELECT })
            var total = await database.query("select count(distinct session) as t FROM requests", { type: database.QueryTypes.SELECT })
            var urlResult = await database.query("SELECT method, url, count(id) as c FROM requests GROUP BY method, url", { type: database.QueryTypes.SELECT })
            var logResult = await database.query("SELECT createdAt, session, method, url FROM requests order by createdAt desc limit 15", { type: database.QueryTypes.SELECT })
            res.status(200).send({ total: total[0].t, session: sessionResult, url: urlResult, log: logResult });
            next();
        } catch (e) {
            res.status(400).send(e.message);
        }
    })
    server.get('/posts/:type', async (req, res, next) => {
        try {
            const { type } = req.params;
            var posts = await models.posts.findAll({
                where: { type: type }, order: [['createdAt', 'DESC']]
            });
            posts = posts.map(x => x.get({ plain: true }));
            await addImagesAndTagsToPosts(models, posts)
            res.status(200).send(posts);
            next();
        } catch (e) {
            res.status(400).send(e.message);
        }
    })
    server.get('/posts/:type/:id', async (req, res, next) => {
        try {
            const { type, id } = req.params;
            var posts = await models.posts.findAll({
                where: { 
                    type: type,
                    id: id
                }, order: [['createdAt', 'DESC']]
            });
            posts = posts.map(x => x.get({ plain: true }));
            await addImagesAndTagsToPosts(models, posts)
            res.status(200).send(posts);
            next();
        } catch (e) {
            res.status(400).send(e.message);
        }
    })
    server.post('/admin/posts', upload.array('images'), async (req, res, next) => {
        try {
            const type = req.body.type
            req.body.description = marked(req.body.description)
            req.body.likes = 0
            const newPost = await models.posts.create(req.body);
            req.files.forEach(async (file) => {	
                await models.pictures.create({ "source": "uploads/" + file.filename, "postId": newPost.id });
                console.log("uploaded ", file.path);
            })
            if(req.body.tags.trim().length > 0) {
                req.body.tags.split(" ").forEach(async (tag) => {
                    await models.tags.create({ "text": tag, "postId": newPost.id });
                })
            }
            res.redirect(`/${type}`);
            next();
        } catch (e) {
            res.status(400).send(e.message);
        }
    })
    server.post('/login', async (req, res, next) => {
        const user = await models.users.findOne({ where: { username: req.body.username} })
        const hash = hashWithSalt(req.body.password, user.salt)
        if (user.password == hash) {
            const token = jwtFunctions.sign(user.username);
            res.cookie('authorization', token, { expires: new Date(Date.now() + (1000 * 60 * 60)) });
            console.debug("Redirecting to admin - logged in")
            res.redirect('/admin');
        } else {
            console.debug("Redirecting to login - invalid login")
            res.redirect('/login');
        }
    })
    server.post('/email', async (req, res, next) => {
        const name = req.body.name;
        const email = req.body.email;
        if (name && email) {
            models.emails.create({"name": name, "address": email})
            res.redirect('/email-success');
        } else {
            console.debug("Error with email submission")
        }
    })
    server.post('/wordsquares', async (req, res, next) => {
        const words = req.body.words;
        const name = req.body.name;
        if (name && words) {
            models.wordsquares.create({"name": name, "words": words, "best": false})
            res.redirect('/wordsquare#success');
        } else {
            console.debug("Error with wordsquare submission")
        }
    })
    server.post('/chess', async (req, res, next) => {
        const game = req.body;
        if (game) {
            models.chessgames.findOne({where: {name: game.name}})
            .then(obj => {
                if(obj){
                    obj.update(game)
                } else {
                    models.chessgames.create(game)
                }
            })
        } else {
            console.debug("Error with chess submission")
        }
        res.status(200).send(game);
    })


    server.get('/favicon.ico', (req, res) => res.sendFile(__dirname + "/res/favicon.ico"))
    server.get('/favicon.svg', (req, res) => res.sendFile(__dirname + "/res/favicon.svg"))
    server.get('/css/:id', (req, res) => {
        res.sendFile(__dirname + "/css/" + req.params.id);
    });
    server.get('/uploads/:id', (req, res) => {
        res.sendFile(__dirname + "/uploads/" + req.params.id);
    });
    server.get('/essay/:id', (req, res) => {
        res.sendFile(__dirname + "/html/essay/" + req.params.id);
    });
    server.get('/js/:id', (req, res) => {
        res.sendFile(__dirname + "/js/" + req.params.id);
    });
    server.get('/res/:id', (req, res) => {
        res.sendFile(__dirname + "/res/" + req.params.id);
    });

    server.get('/feed.xml', async (req, res) => {
        var feed = new rss({
            title: "Mark's Kitchen",
            description: "Posts from marks.kitchen",
            feed_url: "https://marks.kitchen/rss",
            site_url: "https://marks.kitchen",
            webMaster: "webmaster@marks.kitchen (Mark Powers)",
            copyright: "Mark Powers"
        })
        var posts = await models.posts.findAll({
            order: [['createdAt', 'DESC']]
        });
        posts = posts.map(x => x.get({ plain: true }));
        posts.forEach(post =>{
            feed.item({
                title: post.title,
                description: post.description,
                date: post.createdAt,
                url: `https://marks.kitchen/post/${post.type}/${post.id}`,
            })
        })
        res.setHeader('Content-Type', 'text/xml')
        res.status(200).send(feed.xml({indent: true}))
    })

    // Final 404 fallback
    server.use(function(req, res) {
        res.status(400);
        res.sendFile(__dirname + "/html/404.html");
    });
}

module.exports = {
    listen,
    setUpRoutes
};

