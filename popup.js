// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, (tabs) => {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * Apply the user-specified adjustments to the page.
 *
 * @param {object} settings The selected form options, as an object.
 */
function changePageSettings(settings) {
  window.nxs = window.nxs || {};
  window.nxs.userSettings = settings;
  chrome.tabs.executeScript({
    code: 'const runNxs = () => {const { mouse, colorContrast, images, blur } = window.nxs.userSettings; let ss = document.getElementById("nxs"); if (ss) { return; } ss = document.createElement("style"); ss.id = "nxs"; ss.innerHTML += "body {"; if (blur || colorContrast) {ss.innerHTML += "-webkit-filter:"; ss.innerHTML += blur ? " blur(1px)" : ""; ss.innerHTML += colorContrast ? " contrast(.8) grayscale(1)" : ""; ss.innerHTML += ";"} if (mouse) {ss.innerHTML += "pointer-events: none;}"const doNothing = (event) => { event.preventDefault(); event.stopPropagation(); return false; }; window.onmousewheel = doNothing; ss.innerHTML += "::-webkit-scrollbar {display: none}"; // ss.innerHTML += ":focus {border: dotted 2px blue !important; outline: dotted 2px blue !important;}"; } else {ss.innerHTML += "}"; } if (images) {ss.innerHTML += "* {background-image: none !important}"; ss.innerHTML += "img, svg {opacity: 0 !important;}"; } let head = document.getElementsByTagName("head")[0]; head && head.appendChild(ss); };'
  });
}

/**
 * Gets the saved settings.
 *
 * @param {string} url URL for which settings are to be retrieved.
 * @param {function(string)} callback called with the form data for
 *     the given url on success, or a falsy value if no data is retrieved.
 */
function getSavedPageSettings(url, callback) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
  chrome.storage.sync.get(url, (items) => {
    callback(chrome.runtime.lastError ? null : items[url]);
  });
}

/**
 * Sets the given background color for url.
 *
 * @param {string} url URL for which data settings are to be saved.
 * @param {object} settings The form data settings to be saved.
 */
function savePageSettings(url, settings) {
  var items = {};
  items[url] = settings;
  chrome.storage.sync.set(items, () => {console.log('saved')});
}

function getPageSettingsFromDom() {
  const inputs = document.querySelectorAll('input');
  let settings = {};
  inputs.forEach((input) => {
    settings[input.name] = input.type === "checkbox" ? input.checked : input.value;
  });
  return settings;
}

// This extension loads the saved settings for the current tab if one
// exists. The user can select new settings for the
// current page, and they will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl((url) => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        console.log('value changed');
        const settings = getPageSettingsFromDom();
        console.log('new settings:', settings);
        changePageSettings(settings);
        savePageSettings(url, settings);
      });
    });

    // Load the saved settings for this page and modify the form
    // values, if needed.
    getSavedPageSettings(url, (savedSettings) => {
      if (savedSettings) {
        console.log('retrieved:', savedSettings);
        changePageSettings(savedSettings);
        Object.keys(savedSettings).forEach(setting => {
          const input = document.getElementById(setting);
          if (input.type === "checkbox") {
            input.checked = savedSettings[setting];
          } else {
            input.value = savedSettings[setting];
          }
        });
      }
    });
  });
});
