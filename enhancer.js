// Hungarian translation provided by =Krumpli=

ScriptAPI.register('FarmGod', true, 'Warre', 'nl.tribalwars@coma.innogames.de');

window.FarmGod = {};
window.FarmGod.Library = (function () {
  /**** TribalWarsLibrary.js ****/
  if (typeof window.twLib === 'undefined') {
    window.twLib = {
      queues: null,
      init: function () {
        if (this.queues === null) {
          this.queues = this.queueLib.createQueues(5);
        }
      },
      queueLib: {
        maxAttempts: 3,
        Item: function (action, arg, promise = null) {
          this.action = action;
          this.arguments = arg;
          this.promise = promise;
          this.attempts = 0;
        },
        Queue: function () {
          this.list = [];
          this.working = false;
          this.length = 0;

          this.doNext = function () {
            let item = this.dequeue();
            let self = this;

            if (item.action == 'openWindow') {
              window.open(...item.arguments).addEventListener('DOMContentLoaded', function () {
                self.start();
              });
            } else {
              $[item.action](...item.arguments)
                .done(function () {
                  item.promise.resolve.apply(null, arguments);
                  self.start();
                })
                .fail(function () {
                  item.attempts += 1;
                  if (item.attempts < twLib.queueLib.maxAttempts) {
                    self.enqueue(item, true);
                  } else {
                    item.promise.reject.apply(null, arguments);
                  }

                  self.start();
                });
            }
          };

          this.start = function () {
            if (this.length) {
              this.working = true;
              this.doNext();
            } else {
              this.working = false;
            }
          };

          this.dequeue = function () {
            this.length -= 1;
            return this.list.shift();
          };

          this.enqueue = function (item, front = false) {
            front ? this.list.unshift(item) : this.list.push(item);
            this.length += 1;

            if (!this.working) {
              this.start();
            }
          };
        },
        createQueues: function (amount) {
          let arr = [];

          for (let i = 0; i < amount; i++) {
            arr[i] = new twLib.queueLib.Queue();
          }

          return arr;
        },
        addItem: function (item) {
          let leastBusyQueue = twLib.queues
            .map((q) => q.length)
            .reduce((next, curr) => (curr < next ? curr : next), 0);
          twLib.queues[leastBusyQueue].enqueue(item);
        },
        orchestrator: function (type, arg) {
          let promise = $.Deferred();
          let item = new twLib.queueLib.Item(type, arg, promise);

          twLib.queueLib.addItem(item);

          return promise;
        },
      },
      ajax: function () {
        return twLib.queueLib.orchestrator('ajax', arguments);
      },
      get: function () {
        return twLib.queueLib.orchestrator('get', arguments);
      },
      post: function () {
        return twLib.queueLib.orchestrator('post', arguments);
      },
      openWindow: function () {
        let item = new twLib.queueLib.Item('openWindow', arguments);

        twLib.queueLib.addItem(item);
      },
    };

    twLib.init();
  }

  // Additional FarmGod automation logic
  const autoSendFarms = async function () {
    const farmGodButtons = Array.from(document.querySelectorAll('.farmGod_icon'));
    const sendFarmButton = document.getElementById('sendFarmButton');
    if (sendFarmButton) {
      sendFarmButton.disabled = true;
      sendFarmButton.classList.add('btn-disable');
    }

    async function clickButtonSequentially(index) {
      if (index >= farmGodButtons.length) {
        if (sendFarmButton) {
          sendFarmButton.disabled = false;
          sendFarmButton.classList.remove('btn-disable');
        }
        return;
      }

      const button = farmGodButtons[index];
      button.click();

      // Wait until the button is removed from the DOM
      while (document.body.contains(button)) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Delay before clicking the next button
      await new Promise((resolve) => setTimeout(resolve, 100));
      clickButtonSequentially(index + 1);
    }

    clickButtonSequentially(0);
  };

  return {
    autoSendFarms,
  };
})();

window.FarmGod.Translation = (function () {
  const msg = {
    nl_NL: {
      missingFeatures: 'Script vereist een premium account en farm assistent!',
      options: {
        title: 'FarmGod Opties',
        warning: '<b>Waarschuwingen:</b><br>- Zorg dat A is ingesteld als je standaard microfarm en B als een grotere microfarm<br>- Zorg dat de farm filters correct zijn ingesteld voor je het script gebruikt',
        filterImage: 'https://higamy.github.io/TW/Scripts/Assets/farmGodFilters.png',
        group: 'Uit welke groep moet er gefarmd worden:',
        distance: 'Maximaal aantal velden dat farms mogen lopen:',
        time: 'Hoe veel tijd in minuten moet er tussen farms zitten:',
        losses: 'Verstuur farm naar dorpen met gedeeltelijke verliezen:',
        maxloot: 'Verstuur een B farm als de buit vorige keer vol was:',
        newbarbs: 'Voeg nieuwe barbarendorpen toe om te farmen:',
        button: 'Plan farms',
      },
      table: {
        noFarmsPlanned: 'Er kunnen met de opgegeven instellingen geen farms verstuurd worden.',
        origin: 'Oorsprong',
        target: 'Doel',
        fields: 'Velden',
        farm: 'Farm',
        goTo: 'Ga naar',
      },
      messages: {
        villageChanged: 'Succesvol van dorp veranderd!',
        villageError: 'Alle farms voor het huidige dorp zijn reeds verstuurd!',
        sendError: 'Error: farm niet verstuurd!',
      },
    },
    int: {
      missingFeatures: 'Script requires a premium account and loot assistant!',
      options: {
        title: 'FarmGod Options',
        warning: '<b>Warning:</b><br>- Make sure A is set as your default microfarm and B as a larger microfarm<br>- Make sure the farm filters are set correctly before using the script',
        filterImage: 'https://higamy.github.io/TW/Scripts/Assets/farmGodFilters.png',
        group: 'Send farms from group:',
        distance: 'Maximum fields for farms:',
        time: 'How much time in minutes should there be between farms:',
        losses: 'Send farm to villages with partial losses:',
        maxloot: 'Send a B farm if the last loot was full:',
        newbarbs: 'Add new barbs to farm:',
        button: 'Plan farms',
      },
      table: {
        noFarmsPlanned: 'No farms can be sent with the specified settings.',
        origin: 'Origin',
        target: 'Target',
        fields: 'Fields',
        farm: 'Farm',
        goTo: 'Go to',
      },
      messages: {
        villageChanged: 'Successfully changed village!',
        villageError: 'All farms for the current village have been sent!',
        sendError: 'Error: farm not sent!',
      },
    },
  };

  const get = function () {
    const lang = game_data.locale in msg ? game_data.locale : 'int';
    return msg[lang];
  };

  return {
    get,
  };
})();

window.FarmGod.Main = (function (Library, Translation) {
  const lib = Library;
  const t = Translation.get();
  let curVillage = null;
  let farmBusy = false;

  const init = function () {
    if (game_data.features.Premium.active && game_data.features.FarmAssistent.active) {
      if (game_data.screen == 'am_farm') {
        $.when(buildOptions()).then((html) => {
          Dialog.show('FarmGod', html);

          $('.optionButton').off('click').on('click', () => {
            let optionGroup = parseInt($('.optionGroup').val());
            let optionDistance = parseFloat($('.optionDistance').val());
            let optionTime = parseFloat($('.optionTime').val());
            let optionLosses = $('.optionLosses').prop('checked');
            let optionMaxloot = $('.optionMaxloot').prop('checked');
            let optionNewbarbs = $('.optionNewbarbs').prop('checked') || false;

            localStorage.setItem(
              'farmGod_options',
              JSON.stringify({
                optionGroup,
                optionDistance,
                optionTime,
                optionLosses,
                optionMaxloot,
                optionNewbarbs,
              })
            );

            $('.optionsContent').html(UI.Throbber[0].outerHTML + '<br><br>');
            getData(optionGroup, optionNewbarbs, optionLosses).then((data) => {
              Dialog.close();

              let plan = createPlanning(optionDistance, optionTime, optionMaxloot, data);
              $('.farmGodContent').remove();
              $('#am_widget_Farm').first().before(buildTable(plan.farms));

              bindEventHandlers();
              UI.InitProgressBars();
              UI.updateProgressBar($('#FarmGodProgessbar'), 0, plan.counter);
              $('#FarmGodProgessbar').data('current', 0).data('max', plan.counter);
            });
          });

          // Bind the auto-send farms button
          $('#sendFarmButton').off('click').on('click', () => {
            Library.autoSendFarms();
          });

          document.querySelector('.optionButton').focus();
        });
      } else {
        location.href = game_data.link_base_pure + 'am_farm';
      }
    } else {
      UI.ErrorMessage(t.missingFeatures);
    }
  };

  const buildOptions = function () {
    let options = JSON.parse(localStorage.getItem('farmGod_options')) || {
      optionGroup: 0,
      optionDistance: 25,
      optionTime: 10,
      optionLosses: false,
      optionMaxloot: true,
      optionNewbarbs: true,
    };

    return $.when(buildGroupSelect(options.optionGroup)).then((groupSelect) => {
      return `
        <style>#popup_box_FarmGod{text-align:center;width:550px;}</style>
        <h3>${t.options.title}</h3><br>
        <div class="optionsContent">
          <div style="width:90%;margin:auto;background: url('graphic/index/main_bg.jpg') 100% 0% #E3D5B3;border: 1px solid #7D510F;border-spacing: 0px !important;">
            <table class="vis" style="width:100%;text-align:left;font-size:11px;">
              <tr><td>${t.options.group}</td><td>${groupSelect}</td></tr>
              <tr><td>${t.options.distance}</td><td><input type="text" size="5" class="optionDistance" value="${options.optionDistance}"></td></tr>
              <tr><td>${t.options.time}</td><td><input type="text" size="5" class="optionTime" value="${options.optionTime}"></td></tr>
              <tr><td>${t.options.losses}</td><td><input type="checkbox" class="optionLosses" ${(options.optionLosses) ? 'checked' : ''}></td></tr>
              <tr><td>${t.options.maxloot}</td><td><input type="checkbox" class="optionMaxloot" ${(options.optionMaxloot) ? 'checked' : ''}></td></tr>
              ${(game_data.market == 'nl') ? `<tr><td>${t.options.newbarbs}</td><td><input type="checkbox" class="optionNewbarbs" ${(options.optionNewbarbs) ? 'checked' : ''}></td></tr>` : ''}
            </table>
          </div>
          <br>
          <input type="button" class="btn optionButton" value="${t.options.button}">
          <br><br>
          <button id="sendFarmButton" class="btn">Send Farms</button> <!-- New button -->
        </div>`;
    });
  };

  return {
    init,
  };
})(window.FarmGod.Library, window.FarmGod.Translation);

(() => {
  window.FarmGod.Main.init();
})();
