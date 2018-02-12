const runNxs = () => {
    const { mouse, colorContrast, images, blur } = window.nxs.userSettings;
    let ss = document.getElementById("nxs");
    if (ss) { return; }

    ss = document.createElement("style");
    ss.id = "nxs";
    ss.innerHTML += "body {";
    if (blur || colorContrast) {
        ss.innerHTML += "-webkit-filter:";
        ss.innerHTML += blur ? " blur(1px)" : "";
        ss.innerHTML += colorContrast ? " contrast(.8) grayscale(1)" : "";
        ss.innerHTML += ";"
    }
    if (mouse) {
        ss.innerHTML += "pointer-events: none;}"
        const doNothing = (event) => { event.preventDefault(); event.stopPropagation(); return false; };
        window.onmousewheel = doNothing;
        ss.innerHTML += "::-webkit-scrollbar {display: none}";
        // ss.innerHTML += ":focus {border: dotted 2px blue !important; outline: dotted 2px blue !important;}";
    } else {
        ss.innerHTML += "}";
    }
    if (images) {
        ss.innerHTML += "* {background-image: none !important}";
        ss.innerHTML += "img, svg {opacity: 0 !important;}";    
    }

    let head = document.getElementsByTagName("head")[0];
    head && head.appendChild(ss);
};