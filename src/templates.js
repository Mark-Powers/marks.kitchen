module.exports = {
    titlebar: `<nav class="titlebar">
    <div>
    <a href="bread" class="btn btn-primary">Bread</a>
    <a href="blog" class="btn btn-primary">Blog</a>
    <!-- <a href="essay" class="btn btn-primary">Essays</a> (Hello inspector, this page exists, but just isn't very interesting, so I'm removing the link) -->
    <a href="https://games.marks.kitchen" class="btn btn-primary">Games</a>
    <a href="email" class="btn btn-primary">Email</a>
    <a href="misc" class="btn btn-primary">Misc</a>
</div>
</nav>`,
    footer: `<footer>
    <div>Mark Powers</div>
    <div>
        <a href="/feed.xml">RSS feed</a>
        <span class="spacer"></span>
        <a href="https://github.com/Mark-Powers">GitHub</a>
        <span class="spacer"></span>
        <span>mark-at-marks.kitchen</span>
    </div>
</footer>`,

    index: {
        pre: `<!doctype html>
        <html lang="en">
        
        <head>
            <title>Mark's Kitchen</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            <link rel="stylesheet" type="text/css" href="/css/styles.css">
            <link rel="shortcut icon" href="/favicon.ico">
        </head>
        
        <body>
            <h1>Welcome to Mark's Kitchen</h1>`,
            post: `</body>
            </html>`
    }
}