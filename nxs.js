let origMouseWheel;
origMouseWheel = origMouseWheel ? origMouseWheel : window.onmousewheel;
runNxs = (settings) => {
    const { mouse, colorContrast, images, blur } = settings;
    let ss = document.getElementById("nxs");
    let head = document.getElementsByTagName("head")[0];
    
    if (ss) {
        head.removeChild(ss);
        ss.innerHTML = "";
    } else {
        ss = document.createElement("style");
        ss.id = "nxs";
    }

    ss.innerHTML += "body {";
    if (blur || colorContrast) {
        ss.innerHTML += "-webkit-filter:";
        ss.innerHTML += blur ? ` blur(${blur}px)` : "";
        ss.innerHTML += colorContrast ? " contrast(.8) grayscale(1)" : "";
        ss.innerHTML += ";"
    }
    if (mouse) {
        ss.innerHTML += "pointer-events: none;}";
        const doNothing = (event) => { event.preventDefault(); event.stopPropagation(); return false; };
        window.onmousewheel = doNothing;
        ss.innerHTML += "::-webkit-scrollbar {display: none}";
        ss.innerHTML += ":focus {border: dotted 2px blue !important; outline: dotted 2px blue !important;}";
    } else {
        ss.innerHTML += "}";
        window.onmousewheel = origMouseWheel;
    }
    if (images) {
        ss.innerHTML += "* {background-image: none !important}";
        ss.innerHTML += "img, svg {opacity: 0 !important;}";    
    }

    head && head.appendChild(ss);
};
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        runNxs(request);
    });