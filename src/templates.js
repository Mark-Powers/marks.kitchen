const fs = require('fs');
const path = require('path');
const handlebars = require("handlebars");

function loadTemplate(templates, name, filepath){
    const templateContent = fs.readFileSync(filepath).toString()
    templates[name] = handlebars.compile(templateContent);
}

function loadPartial(name, filepath){
    handlebars.registerPartial(name, fs.readFileSync(filepath).toString());
}

function setUpTemplates(){
    loadPartial("navigation", path.join(__dirname, "templates/navigation.html"))
    loadPartial("footer", path.join(__dirname, "templates/footer.html"))
    loadPartial("feed", path.join(__dirname, "templates/feed.html"))
    loadPartial("header", path.join(__dirname, "templates/header.html"))

    let templates = {};
    loadTemplate(templates, "index", path.join(__dirname, 'templates/index.html'))
    loadTemplate(templates, "bread", path.join(__dirname, 'templates/bread.html'))
    loadTemplate(templates, "blog", path.join(__dirname, 'templates/blog.html'))
    loadTemplate(templates, "blog-single", path.join(__dirname, 'templates/blog-single.html'))
    loadTemplate(templates, "tags", path.join(__dirname, 'templates/tags.html'))
    loadTemplate(templates, "misc", path.join(__dirname, 'templates/misc.html'))
    loadTemplate(templates, "projects", path.join(__dirname, 'templates/projects.html'))
    return templates
}


module.exports = {
    setUpTemplates
}
