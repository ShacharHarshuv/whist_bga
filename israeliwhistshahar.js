/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * IsraeliWhist implementation : © Tom Golan tomgolanx@gmail.com and Shahar Har-Shuv shachar.harshuv@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * israeliwhistshahar.js
 *
 * IsraeliWhistShahar user interface script
 *
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

html = String.raw;

const suits = {
  1: {
    name: "club",
    emoji: "♣️",
  },
  2: {
    name: "diamond",
    emoji: "♦️",
  },
  3: {
    name: "heart",
    emoji: "♥️",
  },
  4: {
    name: "spade",
    emoji: "♠️",
  },
};

define([
  "dojo",
  "dojo/_base/declare",
  "ebg/core/gamegui",
  "ebg/counter",
  "ebg/stock",
], function (dojo, declare) {
  return declare("bgagame.israeliwhistshahar", ebg.core.gamegui, {
    constructor: function () {
      console.log("israeliwhistshahar constructor");

      // TODO: implement the UI for the tricks
      // this.tricks_counter = {};
      // this.contract_counter = {};
    },

    /**
     * @param {GameDatas} gamedatas
     *  */
    setup: function (gamedatas) {
      console.log("Starting game setup", gamedatas);

      // Create the main game area HTML structure
      createTables(this.getGameAreaElement(), gamedatas.players);

      createPlayerHand(this, gamedatas.hand);

      createPlayersPanels(gamedatas.players, (playerId) =>
        this.getPlayerPanelElement(playerId),
      );

      for (const playerId in gamedatas.players) {
        const player = gamedatas.players[playerId];
        updatePlayerBid(playerId, player.bid_value, player.bid_suit);
      }

      // Setup game notifications to handle (see "setupNotifications" method below)
      this.setupNotifications();

      console.log("Ending game setup");
    },

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    onEnteringState: function (stateName, args) {
      console.log("Entering state: " + stateName);

      switch (stateName) {
        /* Example:

            case 'myGameState':

                // Show some HTML block at this game state
                dojo.style( 'my_html_block_id', 'display', 'block' );

                break;
           */

        case "playerTurn":
          dojo.style("bidInfo", "display", "none");
          break;

        case "playerBid":
          dojo.style("bidInfo", "display", "block");
          dojo.style("shape", "display", "block");
          break;

        case "playerBet":
          dojo.style("shape", "display", "none");
          break;

        case "dummmy":
          break;
      }
    },

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    onLeavingState: function (stateName) {
      console.log("Leaving state: " + stateName);

      switch (stateName) {
        /* Example:

            case 'myGameState':

                // Hide the HTML block we are displaying only during this game state
                dojo.style( 'my_html_block_id', 'display', 'none' );

                break;
           */

        case "dummmy":
          break;
      }
    },

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status "UPDATE player SET bid_value=-2 WHERE player_id='$activePlayerId'" (ie: the HTML links in the status bar).
    //
    onUpdateActionButtons: function (stateName, args) {
      console.log("onUpdateActionButtons: " + stateName);
      console.log("State Name", stateName);

      const createPlayerBidButtons = () => {
        const createPassButton = () => {
          this.statusBar.addActionButton(
            _("Pass"),
            () => this.bgaPerformAction("actPass"),
            {
              color: "alert",
            },
          );
        };

        const suitSelection = () => {
          this.removeActionButtons();
          createPassButton();
          for (const suit in suits) {
            this.statusBar.addActionButton(
              suits[suit].emoji,
              () => valueSelection(+suit),
              {
                color: "secondary",
              },
            );
          }
        };

        /**
         * @param {number} suit
         */
        const valueSelection = (suit) => {
          this.removeActionButtons();
          createPassButton();
          this.statusBar.addActionButton("←", () => suitSelection(), {
            color: "secondary",
          });
          const minimumBid = highestBid
            ? highestBid.value + (suit > highestBid.suit ? 0 : 1)
            : 5;
          for (let value = minimumBid; value <= 13; value++) {
            this.statusBar.addActionButton(
              formatBid(value, suit),
              () => {
                this.bgaPerformAction("actBid", { value, suit });
              },
              {
                color: "secondary",
              },
            );
          }
        };

        suitSelection();
      };

      if (this.isCurrentPlayerActive()) {
        switch (stateName) {
          case "PlayerBid":
            createPlayerBidButtons();
            break;
          // TODO: update that
          case "PlayerBet":
            this.statusBar.addActionButton(_("Bet"), "onPlayerBet");
            break;
        }
        /*
                 Example:

                 case 'myGameState':

                    // Add 3 action buttons in the action status bar:

                    this.addActionButton( 'button_1_id', _('Button 1 label'), 'onMyMethodToCall1' );
                    this.addActionButton( 'button_2_id', _('Button 2 label'), 'onMyMethodToCall2' );
                    this.addActionButton( 'button_3_id', _('Button 3 label'), 'onMyMethodToCall3' );
                    break;
*/
      }
    },

    // todo: we should change this
    // onPlayerBet: function () {
    //   const action = "bet";
    //   if (!this.checkAction(action)) return;
    //   const bidValue = $("bid_value").value;

    //   this.ajaxcall(
    //     "/" + this.game_name + "/" + this.game_name + "/" + action + ".html",
    //     { lock: true, bid_value: bidValue },
    //     this,
    //     function (result) {},
    //     function (is_error) {},
    //   );
    // },

    ///////////////////////////////////////////////////
    //// Utility methods

    /*

            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.

        */

    // todo: this should be somewhat rewritten
    playCardOnTable: function (player_id, color, value, card_id) {
      // player_id => direction
      dojo.place(
        this.format_block("jstpl_cardontable", {
          x: cardwidth * (value - 2),
          y: cardheight * (getSpriteSheetSuitIndex(color) - 1),
          player_id: player_id,
        }),
        "playertablecard_" + player_id,
      );

      if (player_id != this.player_id) {
        // Some opponent played a card
        // Move card from player panel
        this.placeOnObject(
          "cardontable_" + player_id,
          "overall_player_board_" + player_id,
        );
      } else {
        // You played a card. If it exists in your hand, move card from there and remove
        // corresponding item

        if ($("myhand_item_" + card_id)) {
          this.placeOnObject(
            "cardontable_" + player_id,
            "myhand_item_" + card_id,
          );
          this.playerHand.removeFromStockById(card_id);
        }
      }

      // In any case: move it to its final destination
      this.slideToObject(
        "cardontable_" + player_id,
        "playertablecard_" + player_id,
      ).play();
    },

    ///////////////////////////////////////////////////
    //// Player's action

    // todo: this should be rewritten (use bgaPerformAction instead of ajax)
    onPlayerHandSelectionChanged: function () {
      const items = this.playerHand.getSelectedItems();

      if (items.length > 0) {
        const action = "playCard";
        if (this.checkAction(action, true)) {
          // Can play a card
          const card_id = items[0].id;
          this.ajaxcall(
            "/" +
              this.game_name +
              "/" +
              this.game_name +
              "/" +
              action +
              ".html",
            {
              id: card_id,
              lock: true,
            },
            this,
            function (result) {},
            function (is_error) {},
          );

          this.playerHand.unselectAll();
        } else if (this.checkAction("giveCards")) {
          // Can give cards => let the player select some cards
        } else {
          this.playerHand.unselectAll();
        }
      }
    },

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    /*
            setupNotifications:

            In this method, you associate each of your game notifications with your local method to handle it.

            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your israeliwhistshahar.game.php file.

        */
    setupNotifications: function () {
      this.bgaSetupPromiseNotifications();
      this.notifqueue.setSynchronous("trickWin", 1000);
    },

    notif_newHand: function (notif) {
      // We received a new full hand of 13 cards.
      this.playerHand.removeAll();

      for (const i in notif.args.cards) {
        const card = notif.args.cards[i];
        const color = card.type;
        const value = card.type_arg;
        this.playerHand.addToStockWithId(
          this.getCardUniqueId(color, value),
          card.id,
        );
      }
    },

    notif_playCard: function (notif) {
      // Play a card on the table
      this.playCardOnTable(
        notif.args.player_id,
        notif.args.color,
        notif.args.value,
        notif.args.card_id,
      );
    },

    // todo: we should probably do something
    notif_playerPass: function (notif) {
      updatePlayerBid(notif.player_id, -2, 0);
    },

    // todo: we should probably do something
    notif_playerBid: function (notif) {
      updatePlayerBid(notif.player_id, notif.value, notif.suit);
    },

    notif_trickWin: function (notif) {
      // We do nothing here (just wait in order players can view the 4 cards played before they're gone.
      this.tricks_counter[notif.args.player_id].incValue(1);
    },

    notif_giveAllCardsToPlayer: function (notif) {
      // Move all cards on table to given table, then destroy them
      const winner_id = notif.args.player_id;
      for (const player_id in this.gamedatas.players) {
        const anim = this.slideToObject(
          "cardontable_" + player_id,
          "overall_player_board_" + winner_id,
        );
        dojo.connect(anim, "onEnd", function (node) {
          dojo.destroy(node);
        });
        anim.play();
      }
    },

    notif_points: function (notif) {
      // Update players' scores
      for (const player_id in notif.args.scores) {
        this.scoreCtrl[player_id].toValue(notif.args.scores[player_id]);
      }
    },

    notif_newRound: function (notif) {
      // Update round' number
      this.round.setValue(notif.args.roundNumber);

      for (const player_id in notif.args.scores) {
        this.contract_counter[player_id].setValue(0);
        this.tricks_counter[player_id].setValue(0);
      }
    },

    notif_playerBet: function (notif) {
      this.contract_counter[notif.args.player_id].setValue(
        notif.args.value_displayed,
      );
    },
  });
});

/**
 * @param {HTMLElement} gameAreaElement
 * @param {GameDatas["players"]} players
 */
function createTables(gameAreaElement, players) {
  gameAreaElement.insertAdjacentHTML(
    "beforeend",
    html` <div id="player-tables"></div> `,
  );

  // Setting up player boards
  Object.values(players).forEach((player, index) => {
    document.getElementById("player-tables").insertAdjacentHTML(
      "beforeend",
      /* TODO: it's ideal if the SOUTH direction is the current player somehow, like in a real game */
      html`
        <div
          class="playertable whiteblock playertable_${["S", "W", "N", "E"][
            index
          ]}"
        >
          <div class="playertablename" style="color:#${player.color};">
            ${player.name}
          </div>
          <div class="playertablecard" id="playertablecard_${player.id}"></div>
          <div class="playertablename" id="hand_score_wrap_${player.id}">
            <span class="hand_score_label"></span>
            <span id="hand_score_${player.id}"></span>
          </div>
        </div>
      `,
    );
  });
}

let playerHand;
/**
 *
 * @param {*} page
 * @param {GameDatas["hand"]} hand
 */
function createPlayerHand(page, hand) {
  page.getGameAreaElement().insertAdjacentHTML(
    "beforeend",
    html`
      <div id="myhand_wrap" class="whiteblock">
        <b id="myhand_label">${_("My hand")}</b>
        <div id="myhand"></div>
      </div>
    `,
  );

  // TODO: "stock" is out dated. It is recommended to use BgaCards instead.
  playerHand = new ebg.stock();
  playerHand.create(
    page,
    document.getElementById("myhand"),
    // todo: do we realy need these as members, or can they be hard coded here?
    cardwidth,
    cardheight,
  );
  playerHand.image_items_per_row = 13;

  // Create cards types:
  for (var suit = 1; suit <= 4; suit++) {
    for (var value = 2; value <= 14; value++) {
      // Build card type id
      var card_type_id = cardId(suit, value); // todo: does this need to be a method even?
      // todo: consider migrating to the more modern cards
      playerHand.addItemType(
        card_type_id,
        card_type_id,
        g_gamethemeurl + "img/cards.jpg",
        card_type_id,
      );
    }
  }

  console.log("hand", hand);
  // add cards based on data
  for (const card of hand) {
    const suit = +card.type;
    const value = +card.type_arg;
    playerHand.addToStockWithId(cardId(suit, value), card.id);
  }

  return playerHand;
}

/**
 * @param {GameDatas["players"]} players
 * @param {(playerId: number | string) => HTMLElement} getPlayerPanelElement
 */
function createPlayersPanels(players, getPlayerPanelElement) {
  // todo: extract to a function
  for (const playerId in players) {
    const player = players[playerId];
    getPlayerPanelElement(playerId).insertAdjacentHTML(
      "beforeend",
      html`<div class="player-panel" id="player_panel_${playerId}">
        <div id="bid"></div>
      </div>`,
    );
  }
}

/**
 *
 * @param {number|string} playerId
 * @param {number} bidValue
 * @param {number} bidSuit
 */
function updatePlayerBid(playerId, bidValue, bidSuit) {
  const getBidText = () => {
    if (bidValue < 0) {
      return html`<i>Passed<i></i></i>`;
    } else if (bidValue == 0) {
      return html``;
    } else {
      return html`<b>Bid:</b> ${formatBid(bidValue, bidSuit)}`;
    }
  };

  updatePanelElement(playerId, "bid", getBidText());

  if (
    !highestBid ||
    isBidHigher(highestBid.suit, highestBid.value, bidSuit, bidValue)
  ) {
    highestBid = {
      value: +bidValue,
      suit: +bidSuit,
      playerId,
    };
  }

  // todo: consider rendering it in other places (like the table)
}

/**
 *
 * @param {number | string} playerId
 * @param {string} innerId
 * @param {string} newValue
 */
function updatePanelElement(playerId, innerId, newValue) {
  const element = document.querySelector(
    `#player_panel_${playerId} #${innerId}`,
  );
  if (!element) {
    throw new Error(`Element not found: #player_panel_${playerId} #${innerId}`);
  }
  element.innerHTML = newValue;
}

/**
 * Get card unique identifier based on its suit and value
 * @param {number} suit - from 1 to 4
 * @param {number} value - from 2 to 14 (Ace)
 */
function cardId(suit, value) {
  return (getSpriteSheetSuitIndex(suit) - 1) * 13 + (value - 2);
}

/**
 * Convert logical suit number to sprite sheet suit index
 * Logical: 1=Clubs, 2=Diamonds, 3=Hearts, 4=Spades
 * Sprite sheet: 1=Spades, 2=Hearts, 3=Diamonds, 4=Clubs
 * @param {number} logicalSuit - from 1 to 4
 * @returns {number} sprite sheet suit index from 1 to 4
 */
function getSpriteSheetSuitIndex(logicalSuit) {
  const mapping = {
    1: 4, // Clubs -> position 4 in sprite sheet
    2: 3, // Diamonds -> position 3 in sprite sheet
    3: 2, // Hearts -> position 2 in sprite sheet
    4: 1, // Spades -> position 1 in sprite sheet
  };
  return mapping[logicalSuit];
}

const cardwidth = 72;
const cardheight = 96;

/**
 *
 * @param {number} bidValue
 * @param {number} bidSuit
 */
function formatBid(bidValue, bidSuit) {
  return bidValue + " " + suits[bidSuit].emoji;
}
function isBidHigher(currentBidSuit, currentBidValue, newBidSuit, newBidValue) {
  return newBidValue >= currentBidValue + (newBidSuit > currentBidSuit ? 1 : 0);
}

/**
 * @global @type {null | {
 *   value: number;
 *   suit: number;
 *   playerId: number|string;
 * }}
 */
let highestBid = null;
