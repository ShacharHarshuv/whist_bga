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
      // this.tricks_need_counter = {};
    },

    /**
     * @param {GameDatas} gamedatas
     *  */
    setup: function (gamedatas) {
      console.log("Starting game setup", gamedatas);

      // Create the main game area HTML structure
      createTables(this.getGameAreaElement(), gamedatas.players);

      createPlayerHand(this, gamedatas.hand);

      // // Setting up player boards
      // for (const player_id in gamedatas.players) {
      //   const player = gamedatas.players[player_id];
      //   // TODO: Setting up players boards if needed
      //   this.tricks_counter[player_id] = new ebg.counter();
      //   this.tricks_counter[player_id].create($("tricks_" + player_id));
      //   this.tricks_counter[player_id].setValue(parseInt(player.taken));

      //   this.tricks_need_counter[player_id] = new ebg.counter();
      //   this.tricks_need_counter[player_id].create(
      //     $("tricks_need_" + player_id),
      //   );
      //   this.tricks_need_counter[player_id].setValue(parseInt(player.tricks));
      // }

      // // Player hand
      // this.playerHand = new ebg.stock(); // new stock object for hand
      // this.playerHand.create(
      //   this,
      //   $("myhand"),
      //   this.cardwidth,
      //   this.cardheight,
      // );

      // this.playerHand.image_items_per_row = 13; // 13 images per row

      // this.round = new ebg.counter();
      // this.round.create($("round"));
      // this.round.setValue(gamedatas.round_number);

      // $("round_trump_name").textContent = this.getTrumpName(
      //   gamedatas.round_trump,
      // );

      // // Create cards types:
      // for (let color = 1; color <= 4; color++) {
      //   for (let value = 2; value <= 14; value++) {
      //     // Build card type id
      //     const card_type_id = this.getCardUniqueId(color, value);
      //     this.playerHand.addItemType(
      //       card_type_id,
      //       card_type_id,
      //       g_gamethemeurl + "img/cards.jpg",
      //       card_type_id,
      //     );
      //   }
      // }

      // // Cards in player's hand
      // for (const i in this.gamedatas.hand) {
      //   const card = this.gamedatas.hand[i];
      //   const color = card.type;
      //   const value = card.type_arg;
      //   this.playerHand.addToStockWithId(
      //     this.getCardUniqueId(color, value),
      //     card.id,
      //   );
      // }

      // // Cards played on table
      // for (let i in this.gamedatas.cardsontable) {
      //   const card = this.gamedatas.cardsontable[i];
      //   const color = card.type;
      //   const value = card.type_arg;
      //   const player_id = card.location_arg;
      //   this.playCardOnTable(player_id, color, value, card.id);
      // }

      // dojo.connect(
      //   this.playerHand,
      //   "onChangeSelection",
      //   this,
      //   "onPlayerHandSelectionChanged",
      // );
      // // Setup game notifications to handle (see "setupNotifications" method below)
      // this.setupNotifications();

      console.log("Ending game setup");
    },

    // todo: remove
    //     createGameAreaHTML: function (gamedatas) {
    //         // Create the main game area structure
    //         const gameArea = this.getGameAreaElement();

    //         // Create player tables for each player
    //         const playerPositions = ['S', 'W', 'N', 'E']; // South, West, North, East
    //         const playerIds = Object.keys(gamedatas.players);

    //         for (const i = 0; i < playerIds.length; i++) {
    //             const player_id = playerIds[i];
    //             const position = playerPositions[i];
    //             const player = gamedatas.players[player_id];

    //             const playerTableHTML = `
    //       <div id="playertable_${player_id}" class="playertable playertable_${position}">
    //         <div class="playertablename" style="color:#${player.color}">
    //           ${player.name} (${position})
    //         </div>
    //         <div id="playertablecard_${player_id}" class="playertablecard"></div>
    //         <div class="playertablecounter">
    //           <span class="tricks_label">Tricks:</span>
    //           <span id="tricks_${player_id}">0</span>
    //           <span class="tricks_need_label">Need:</span>
    //           <span id="tricks_need_${player_id}">0</span>
    //         </div>
    //       </div>
    //     `;
    //             gameArea.insertAdjacentHTML('beforeend', playerTableHTML);
    //         }

    //         // Create round info section
    //         const roundInfoHTML = `
    //     <div id="round_info" class="round_info">
    //       <div class="round_info_item">
    //         <span class="round_label">Round:</span>
    //         <span id="round">1</span>
    //       </div>
    //       <div class="round_info_item">
    //         <span class="trump_label">Trump:</span>
    //         <span id="round_trump_name">-</span>
    //       </div>
    //     </div>
    //   `;
    //         gameArea.insertAdjacentHTML('beforeend', roundInfoHTML);

    //         // Create bid info form
    //         const bidInfoHTML = `
    //     <div id="bid_info" class="bid_info" style="display: none;">
    //       <div class="bid_form">
    //         <label for="bid_value">Bid Value:</label>
    //         <input type="number" id="bid_value" min="5" max="13" value="5">
    //         <label for="bid_shape">Shape:</label>
    //         <select id="bid_shape">
    //           <option value="1">Spades</option>
    //           <option value="2">Hearts</option>
    //           <option value="4">Diamonds</option>
    //           <option value="3">Clubs</option>
    //         </select>
    //       </div>
    //     </div>
    //   `;
    //         gameArea.insertAdjacentHTML('beforeend', bidInfoHTML);

    //         // Create my hand section
    //         const myHandHTML = `
    //     <div id="myhand_wrap" class="whiteblock">
    //       <h3>My hand</h3>
    //       <div id="myhand"></div>
    //     </div>
    //   `;
    //         gameArea.insertAdjacentHTML('beforeend', myHandHTML);

    //         // Define the card template as a JavaScript template
    //         this.jstpl_cardontable = `
    //     <div class="cardontable" id="cardontable_\${player_id}" style="background-position:-\${x}px -\${y}px">
    //     </div>
    //   `;
    //     },

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
    //                        action status bar (ie: the HTML links in the status bar).
    //
    onUpdateActionButtons: function (stateName, args) {
      console.log("onUpdateActionButtons: " + stateName);

      if (this.isCurrentPlayerActive()) {
        switch (stateName) {
          case "playerBid":
            this.addActionButton("pass_button", _("Pass"), () =>
              this.ajaxcallwrapper("pass"),
            );
            this.addActionButton("bid_button", _("Bid"), "onPlayerBid");
            break;
          case "playerBet":
            this.addActionButton("bet_button", _("Bet"), "onPlayerBet");
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

    onPlayerBid: function () {
      const action = "bid";
      if (!this.checkAction(action)) return;
      const bidValue = $("bid_value").value;
      const shape = $("shape").value;
      // // Check the number of selected items
      // const selected_cards = this.playerHand.getSelectedItems();
      // if (selected_cards.length !== 3) {
      //     this.showMessage(_('You must select exactly 3 cards'), "error");
      //     return;
      // }
      //
      // // Get card ids
      // let card_ids = '';
      // for (let i in selected_cards) card_ids += selected_cards[i].id + ';';
      //
      // // Give selected cards
      // this.playerHand.unselectAll();
      this.ajaxcall(
        "/" + this.game_name + "/" + this.game_name + "/" + action + ".html",
        { lock: true, bid_value: bidValue, shape: shape },
        this,
        function (result) {},
        function (is_error) {},
      );
    },

    onPlayerBet: function () {
      const action = "bet";
      if (!this.checkAction(action)) return;
      const bidValue = $("bid_value").value;

      this.ajaxcall(
        "/" + this.game_name + "/" + this.game_name + "/" + action + ".html",
        { lock: true, bid_value: bidValue },
        this,
        function (result) {},
        function (is_error) {},
      );
    },

    ///////////////////////////////////////////////////
    //// Utility methods

    /*

            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.

        */

    ajaxcallwrapper: function (action, args, handler) {
      if (!args) args = []; // this allows to skip args parameter for action which do not require them

      args.lock = true; // this allows to avoid rapid action clicking which can cause race condition on server

      if (this.checkAction(action)) {
        // this does all the proper check that player is active and action is declared
        this.ajaxcall(
          "/" + this.game_name + "/" + this.game_name + "/" + action + ".html",
          args, // this is mandatory fluff
          this,
          (result) => {}, // success result handler is empty - it is never needed
          handler,
        ); // this is real result handler - it called both on success and error, its is optional param - you rarely need it
      }
    },

    getTrumpName: function (shapeId) {
      if (shapeId == 1) {
        return "Spade";
      }
      if (shapeId == 2) {
        return "Heart";
      }
      if (shapeId == 3) {
        return "Club";
      }
      if (shapeId == 4) {
        return "Diamond";
      }
    },

    playCardOnTable: function (player_id, color, value, card_id) {
      // player_id => direction
      dojo.place(
        this.format_block("jstpl_cardontable", {
          x: cardwidth * (value - 2),
          y: cardheight * (color - 1),
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

    /*

            Here, you are defining methods to handle player's action (ex: results of mouse click on
            game objects).

            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server

        */

    /* Example:

        onMyMethodToCall1: function( evt )
        {
            console.log( 'onMyMethodToCall1' );

            // Preventing default browser reaction
            dojo.stopEvent( evt );

            // Check that this action is possible (see "possibleactions" in states.inc.php)
            if( ! this.checkAction( 'myAction' ) )
            {   return; }

            this.ajaxcall( "/israeliwhistshahar/israeliwhistshahar/myAction.html", {
                                                                    lock: true,
                                                                    myArgument1: arg1,
                                                                    myArgument2: arg2,
                                                                    ...
                                                                 },
                         this, function( result ) {

                            // What to do after the server call if it succeeded
                            // (most of the time: nothing)

                         }, function( is_error) {

                            // What to do after the server call in anyway (success or failure)
                            // (most of the time: nothing)

                         } );
        },

        */

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
      console.log("notifications subscriptions setup");

      dojo.subscribe("newHand", this, "notif_newHand");
      dojo.subscribe("playCard", this, "notif_playCard");

      dojo.subscribe("trickWin", this, "notif_trickWin");
      this.notifqueue.setSynchronous("trickWin", 1000);
      dojo.subscribe(
        "giveAllCardsToPlayer",
        this,
        "notif_giveAllCardsToPlayer",
      );
      dojo.subscribe("points", this, "notif_points");
      dojo.subscribe("newRound", this, "notif_newRound");
      dojo.subscribe("playerBid", this, "notif_playerBid");
      dojo.subscribe("playerBet", this, "notif_playerBet");
      dojo.subscribe("pass", this, "notif_pass");

      // TODO: here, associate your game notifications with local methods

      // Example 1: standard notification handling
      // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );

      // Example 2: standard notification handling + tell the user interface to wait
      //            during 3 seconds after calling the method in order to let the players
      //            see what is happening in the game.
      // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
      // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
      //
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

    notif_pass: function (notif) {},

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
      this.round.setValue(notif.args.round_number);

      for (const player_id in notif.args.scores) {
        this.tricks_need_counter[player_id].setValue(0);
        this.tricks_counter[player_id].setValue(0);
      }
    },

    notif_playerBet: function (notif) {
      this.tricks_need_counter[notif.args.player_id].setValue(
        notif.args.value_displayed,
      );
    },

    notif_playerBid: function (notif) {
      $("round_trump_name").textContent = notif.args.color_displayed;
    },

    // TODO: from this point and below, you can write your game notifications handling methods

    /*
        Example:

        notif_cardPlayed: function( notif )
        {
            console.log( 'notif_cardPlayed' );
            console.log( notif );

            // Note: notif.args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call

            // TODO: play the card in the user interface.
        },

        */
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
    console.log("card", card);
    // var card = this.gamedatas.hand[i];
    // var color = card.type;
    // var value = card.type_arg;
    // this.playerHand.addToStockWithId(cardId(color, value), card.id);
  }

  return playerHand;
}

/**
 * Get card unique identifier based on its suit and value
 * @param {number} suit - from 1 to 4
 * @param {number} value - from 2 to 14 (Ace)
 */
function cardId(suit, value) {
  return (suit - 1) * 13 + (value - 2);
}

const cardwidth = 72;
const cardheight = 96;
