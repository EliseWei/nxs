
/**
 * Get the current URL and tab id.
 *
 * @param {function(string)} callback called when the tab id and URL of the current tab
 *   is found.
 */
function getCurrentTabInfo(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    var tab = tabs[0];
    var { url, id } = tab;
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback({url, id});
  });
}

/**
 * Apply the user-specified adjustments to the page.
 *
 * @param {integer} id The unique id of the tab, to send the message.
 * @param {object} settings The selected form options, as an object.
 */
function changePageSettings(id, settings) {
  chrome.tabs.sendMessage(id, settings);
}

/**
 * Gets the saved settings.
 *
 * @param {string} url URL for which settings are to be retrieved.
 * @param {function(string)} callback called with the form data for
 *     the given url on success, or a falsy value if no data is retrieved.
 */
function getSavedPageSettings(url, callback) {
  chrome.storage.sync.get(url, (items) => {
    callback(chrome.runtime.lastError ? null : items[url]);
  });
}

/**
 * Stores the user-specified settings for url.
 *
 * @param {string} url URL for which data settings are to be saved.
 * @param {object} settings The form data settings to be saved.
 */
function savePageSettings(url, settings) {
  var items = {};
  items[url] = settings;
  chrome.storage.sync.set(items);
}

/**
 * Gets the user's desired settings from the form elements on the popup.
 */
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
// storage.
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.executeScript({
    file: 'nxs.js',
    allFrames: true
  });
  getCurrentTabInfo(({url, id}) => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        const settings = getPageSettingsFromDom();
        changePageSettings(id, settings);
        savePageSettings(url, settings);
      });
    });

    // Load the saved settings for this page and modify the form
    // values, if needed.
    getSavedPageSettings(url, (savedSettings) => {
      if (savedSettings) {
        changePageSettings(id, savedSettings);
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
