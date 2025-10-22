if (!fanstatic.settings.class_fix) fanstatic.settings.class_fix = {};

Object.assign(fanstatic.settings.class_fix, {
    
});

let css = document.createElement('style');
css.innerHTML = `
    body {}
`
document.head.appendChild(css);