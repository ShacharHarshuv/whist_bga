/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * IsraeliWhist implementation : © Tom Golan tomgolanx@gmail.com and Shahar Har-Shuv shachar.harshuv@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * israeliwhistshahar.ts
 *
 * IsraeliWhistShahar user interface script
 *
 * In this file, you are describing the logic of your user interface, in TypeScript language.
 *
 */

const html = String.raw;

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

interface HighestBid {
  value: number;
  suit: number;
  playerId: number | string;
}

let highestBid: HighestBid | null = null;
let contractsSum = 0;
let totalContracts = 0;

const cardwidth = 72;
const cardheight = 96;

// @ts-ignore
GameGui = (function () {
  // this hack required so we fake extend GameGui
  function GameGui() {}
  return GameGui;
})();

class IsraeliWhist extends GameGui<IsraeliWhistGamedatas> {
  private notifqueue: any; // see if we can type it
  private playerHand: any; // todo: type it?

  setup() {
    console.log("Setup: ", this.gamedatas);
    this.createTrumpIndication();
    this.updateTrumpSuit(this.gamedatas.trump);

    this.createTables();

    this.createPlayerHand();

    // Cards played on table
    for (let i in this.gamedatas.cardsontable) {
      const card = this.gamedatas.cardsontable[i];
      const color = card.type;
      const value = card.type_arg;
      const player_id = card.location_arg;
      this.playCardOnTable(player_id, color, value, card.id);
    }

    this.createPlayersPanels();

    if (this.gamedatas.gamestate.name == "PlayerBid") {
      for (const playerId in this.gamedatas.players) {
        const player = this.gamedatas.players[playerId];
        this.updatePlayerBid(playerId, player.bid, 0); // Assuming bid_suit is 0 for now
      }
    } else {
      for (const playerId in this.gamedatas.players) {
        const player = this.gamedatas.players[playerId];
        this.updateHighestBidState(playerId, player.bid, 0);
        this.updatePlayerContract(playerId, player.tricks_won);
      }
    }

    // Setup game notifications to handle (see "setupNotifications" method below)
    this.setupNotifications();
  }

  // #region Game states

  public onEnteringState(stateName: string, args: any) {
    console.log("Entering state: " + stateName);
  }

  public onLeavingState(stateName: string) {
    console.log("Leaving state: " + stateName);

    switch (stateName) {
      case "dummmy":
        break;
    }
  }

  public onUpdateActionButtons(stateName: string, args: any) {
    console.log("onUpdateActionButtons: " + stateName);
    console.log("State Name", stateName);

    const createPlayerBidButtons = () => {
      const createPassButton = () => {
        this.statusBar.addActionButton(
          _("Pass"),
          () => (this as any).bgaPerformAction("actPass"),
          {
            color: "alert",
          },
        );
      };

      const suitSelection = () => {
        (this as any).removeActionButtons();
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

      const valueSelection = (suit: number) => {
        (this as any).removeActionButtons();
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
              (this as any).bgaPerformAction("actBid", { value, suit });
            },
            {
              color: "secondary",
            },
          );
        }
      };

      suitSelection();
    };

    const createDeclarationButtons = () => {
      console.log("highestBid", highestBid, this.player_id);
      const min = (() => {
        if (highestBid && highestBid.playerId == this.player_id) {
          return highestBid.value;
        } else {
          return 0;
        }
      })();

      const disallowed = (() => {
        if (totalContracts != 3) {
          return null;
        }

        return 13 - contractsSum;
      })();

      const max = 13;
      for (let value = min; value <= max; value++) {
        this.statusBar.addActionButton(
          value.toString(),
          () => (this as any).bgaPerformAction("actDeclare", { value }),
          {
            color: "secondary",
            disabled: value == disallowed,
          },
        );
      }
    };

    if (!(this as any).isCurrentPlayerActive()) {
      return;
    }

    switch (stateName) {
      case "PlayerBid":
        createPlayerBidButtons();
        break;
      case "PlayerDeclaration":
        createDeclarationButtons();
        break;
    }
  }

  // #endregion

  // #region UI

  private playCardOnTable(
    player_id: number,
    color: number,
    value: number,
    card_id: number,
  ) {
    this.addTableCard(value, color, player_id, player_id);

    if (player_id != +this.player_id) {
      (this as any).placeOnObject(
        "cardontable_" + player_id,
        "overall_player_board_" + player_id,
      );
    } else {
      if ($("myhand_item_" + card_id)) {
        (this as any).placeOnObject(
          "cardontable_" + player_id,
          "myhand_item_" + card_id,
        );
        this.playerHand.removeFromStockById(card_id);
      }
    }

    (this as any)
      .slideToObject("cardontable_" + player_id, "playertablecard_" + player_id)
      .play();
  }

  private addTableCard(
    value: number,
    suit: number,
    card_player_id: number,
    playerTableId: number,
  ) {
    const x = value - 2;
    const y = suit - 1;
    document
      .getElementById("playertablecard_" + playerTableId)
      .insertAdjacentHTML(
        "beforeend",
        html`<div
          class="card cardontable"
          id="cardontable_${card_player_id}"
          style="background-position:-${x}00% -${y}00%"
        ></div>`,
      );
  }

  private onPlayerHandSelectionChanged() {
    const items = this.playerHand.getSelectedItems();

    if (items.length > 0) {
      const canPlay = true;
      if (canPlay) {
        const cardId = items[0].id;
        (this as any).bgaPerformAction("actPlayCard", { cardId });
        this.playerHand.unselectAll();
      } else {
        this.playerHand.unselectAll();
      }
    }
  }

  private createTrumpIndication() {
    this.getGameAreaElement().insertAdjacentHTML(
      "beforeend",
      html`<div id="trump-indication"></div>`,
    );
  }

  private updateTrumpSuit(newTrumpSuit: number) {
    document.getElementById("trump-indication").innerHTML = (() => {
      if (!+newTrumpSuit) {
        return html``;
      }

      return html`
        <b>👑 Trump: </b>
        <span id="trump-indication-suit">${suits[+newTrumpSuit].emoji}</span>
      `;
    })();
  }

  private createTables() {
    this.getGameAreaElement().insertAdjacentHTML(
      "beforeend",
      html` <div id="player-tables"></div> `,
    );

    Object.values(this.gamedatas.players).forEach((player, index) => {
      document.getElementById("player-tables").insertAdjacentHTML(
        "beforeend",
        html`
          <div
            class="playertable whiteblock playertable_${["S", "W", "N", "E"][
              index
            ]}"
          >
            <div class="playertablename" style="color:#${player.color};">
              ${player.name}
            </div>
            <div
              class="playertablecard"
              id="playertablecard_${player.id}"
            ></div>
            <div class="playertablename" id="hand_score_wrap_${player.id}">
              <span class="hand_score_label"></span>
              <span id="hand_score_${player.id}"></span>
            </div>
          </div>
        `,
      );
    });
  }

  private createPlayerHand() {
    this.getGameAreaElement().insertAdjacentHTML(
      "beforeend",
      html`
        <div id="myhand_wrap" class="whiteblock">
          <b id="myhand_label">${_("My hand")}</b>
          <div id="myhand"></div>
        </div>
      `,
    );

    this.playerHand = new (ebg as any).stock();
    this.playerHand.create(
      this,
      document.getElementById("myhand"),
      cardwidth,
      cardheight,
    );
    this.playerHand.image_items_per_row = 13;

    for (let suit = 1; suit <= 4; suit++) {
      for (let value = 2; value <= 14; value++) {
        const card_type_id = cardId(suit, value);
        this.playerHand.addItemType(
          card_type_id,
          card_type_id,
          (window as any).g_gamethemeurl + "img/cards.jpg",
          card_type_id,
        );
      }
    }

    const { hand } = this.gamedatas;
    for (const card of hand) {
      const suit = +card.type;
      const value = +card.type_arg;
      this.playerHand.addToStockWithId(cardId(suit, value), card.id);
    }

    dojo.connect(
      this.playerHand,
      "onChangeSelection",
      this.onPlayerHandSelectionChanged,
    );
  }

  private createPlayersPanels() {
    const { players } = this.gamedatas;
    for (const playerId in players) {
      this.getPlayerPanelElement(+playerId).insertAdjacentHTML(
        "beforeend",
        html`<div class="player-panel" id="player_panel_${playerId}">
          <div id="bid"></div>
          <div id="contract"></div>
        </div>`,
      );
    }
  }

  private updatePlayerBid(
    playerId: number | string,
    bidValue: number,
    bidSuit: number,
  ) {
    const getBidText = () => {
      if (bidValue < 0) {
        return html`<i>Passed<i></i></i>`;
      } else if (bidValue == 0) {
        return html``;
      } else {
        return html`<b>Bid:</b> ${formatBid(bidValue, bidSuit)}`;
      }
    };

    this.updatePanelElement(playerId, "bid", getBidText());
    this.updateHighestBidState(playerId, bidValue, bidSuit);
  }

  private updateHighestBidState(
    playerId: number | string,
    bidValue: number,
    bidSuit: number,
  ) {
    if (
      bidValue > 0 &&
      (!highestBid ||
        isBidHigher(highestBid.suit, highestBid.value, bidSuit, bidValue))
    ) {
      highestBid = {
        value: +bidValue,
        suit: +bidSuit,
        playerId,
      };
    }
  }

  private updatePlayerContract(
    playerId: number | string,
    value: number | string,
  ) {
    console.log("updatePlayerContract", playerId, value);
    if (+value < 0) {
      this.updatePanelElement(playerId, "contract", html``);
      return;
    }
    contractsSum += +value;
    totalContracts++;
    this.updatePanelElement(
      playerId,
      "contract",
      html`<b>Contract:</b> ${value}`,
    );
  }

  private updatePanelElement(
    playerId: number | string,
    innerId: string,
    newValue: string,
  ) {
    const element = document.querySelector(
      `#player_panel_${playerId} #${innerId}`,
    );
    if (!element) {
      throw new Error(
        `Element not found: #player_panel_${playerId} #${innerId}`,
      );
    }
    element.innerHTML = newValue;
  }

  // #endregion

  // #region Framework methods - these are provided by ebg.core.gamegui in the BGA environment
  // We use type assertions to access them since they're added by the BGA framework at runtime

  public setupNotifications() {
    this.bgaSetupPromiseNotifications();
    this.notifqueue.setSynchronous("trickWin", 1000);
    this.notifqueue.setSynchronous("playCard", 500);
  }

  // #endregion

  // #region Notifications

  private notif_newHand(notif: any) {
    this.playerHand.removeAll();

    for (const i in notif.cards) {
      const card = notif.cards[i];
      const color = card.type;
      const value = card.type_arg;
      this.playerHand.addToStockWithId(cardId(color, value), card.id);
    }
  }

  private notif_playCard(notif: any) {
    this.playCardOnTable(
      notif.player_id,
      notif.color,
      notif.value,
      notif.card_id,
    );
  }

  private notif_playerPass(notif: any) {
    this.updatePlayerBid(notif.player_id, -2, 0);
  }

  private notif_playerBid(notif: any) {
    this.updatePlayerBid(notif.player_id, notif.value, notif.suit);
  }

  private notif_bidWon(notif: any) {
    for (const playerId in this.gamedatas.players) {
      this.updatePlayerBid(playerId, 0, 0);
    }
    this.updateTrumpSuit(notif.suit);
  }

  private notif_trickWin(notif: any) {
    // todo: implement tricks indication
  }

  private notif_giveAllCardsToPlayer(notif: any) {
    const winner_id = notif.player_id;
    for (const player_id in this.gamedatas.players) {
      const anim = this.slideToObject(
        "cardontable_" + player_id,
        "overall_player_board_" + winner_id,
      );
      // @ts-ignore -- todo: fix
      dojo.connect(anim, "onEnd", function (node: any) {
        dojo.destroy(node);
      });
      anim.play();
    }
  }

  private notif_points(notif: any) {
    for (const player_id in notif.scores) {
      this.scoreCtrl[player_id].toValue(notif.scores[player_id]);
    }
  }

  private notif_newRound(notif: any) {
    // todo: implement
    // this.round.setValue(notif.roundNumber);
    // for (const player_id in notif.scores) {
    //   this.contract_counter[player_id].setValue(0);
    //   this.tricks_counter[player_id].setValue(0);
    // }
  }

  private notif_playerContract(notif: any) {
    this.updatePlayerContract(notif.player_id, notif.value);
  }

  // #endregion
}

function cardId(suit: number, value: number): number {
  return (getSpriteSheetSuitIndex(suit) - 1) * 13 + (value - 2);
}

function getSpriteSheetSuitIndex(logicalSuit: number): number {
  const mapping = {
    1: 4, // Clubs -> position 4 in sprite sheet
    2: 3, // Diamonds -> position 3 in sprite sheet
    3: 2, // Hearts -> position 2 in sprite sheet
    4: 1, // Spades -> position 1 in sprite sheet
  };
  return mapping[logicalSuit];
}

function formatBid(bidValue: number, bidSuit: number): string {
  return bidValue + suits[bidSuit].emoji;
}

function isBidHigher(
  currentBidSuit: number,
  currentBidValue: number,
  newBidSuit: number,
  newBidValue: number,
): boolean {
  return newBidValue >= currentBidValue + (newBidSuit > currentBidSuit ? 1 : 0);
}
