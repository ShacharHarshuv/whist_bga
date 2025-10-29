/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * IsraeliWhist implementation : © Tom Golan tomgolanx@gmail.com & Shahar Har-Shuv shachar.harshuv@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * israeliwhist.ts
 *
 * IsraeliWhist user interface script
 *
 * In this file, you are describing the logic of your user interface, in TypeScript language.
 *
 */

const html = String.raw;

// Game constants
const PASS = -2;
const PASS_BLIND = -3;

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
} as const;

interface HighestBid {
  value: number;
  suit: number;
  playerId: number | string;
}

// @ts-ignore
GameGui = (function () {
  // this hack required so we fake extend GameGui
  function GameGui() {}
  return GameGui;
})();

class IsraeliWhist extends GameGui<IsraeliWhistGamedatas> {
  private animationManager: AnimationManager;
  private cardManager: CardManager<Card>;
  private handStock: HandStock<Card>;
  private tableStocks: Record<number, LineStock<Card>> = {};
  private trickSuit: number | null = null;
  private tricksTaken: Record<number, number> = {};
  private voidStocks: Record<number, VoidStock<Card>> = {};
  private highestBid: HighestBid | null = null;
  private frischCounter: number;
  private contractsSum = 0;
  private totalContracts = 0;

  setup() {
    console.log("Setup: ", this.gamedatas);
    this.frischCounter = +this.gamedatas.frischCounter;
    this.createTrumpIndication();
    this.updateTrumpSuit(+this.gamedatas.trump);

    this.createRoundIndication();
    this.updateRound(+this.gamedatas.roundNumber);

    this.createCardsManager();

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
    this.createVoidStocks();

    if (this.gamedatas.gamestate.name == "PlayerBid") {
      for (const playerId in this.gamedatas.players) {
        const player = this.gamedatas.players[playerId];
        this.updatePlayerBid(playerId, +player.bid_value, +player.bid_suit);
      }
    } else {
      for (const playerId in this.gamedatas.players) {
        const player = this.gamedatas.players[playerId];
        this.updateHighestBidState(
          +playerId,
          +player.bid_value,
          +player.bid_suit,
        );
        this.updateContract(+playerId, +player.contract);
        if (this.gamedatas.gamestate.name != "PlayerDeclaration") {
          this.updateTricks(+playerId, +player.taken);
        }
      }
    }

    if (
      this.gamedatas.gamestate.name == "PlayerTurn" &&
      this.player_id == this.getActivePlayerId()
    ) {
      setTimeout(() => {
        this.disableUnplayableCards();
      }, 1000);
    }

    this.trickSuit = +this.gamedatas.trickSuit || null;

    // Setup game notifications to handle (see "setupNotifications" method below)
    this.setupNotifications();
  }

  // #region Game states

  onEnteringState(stateName) {
    if (
      stateName == "PlayerTurn" &&
      this.player_id === this.getActivePlayerId()
    ) {
      this.disableUnplayableCards();
    }
  }

  public onLeavingState(stateName: string) {
    console.log("Leaving state: " + stateName);

    if (stateName == "PlayerTurn") {
      this.handStock.setSelectableCards(this.handStock.getCards());
    }

    if (stateName == "GiveCards") {
      // Reset to single selection mode
      this.handStock.setSelectionMode("single");
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
            color: "primary",
          },
        );
      };

      const createPassBlindButton = () => {
        this.statusBar.addActionButton(
          _("Pass Out"),
          () => (this as any).bgaPerformAction("actPassBlind"),
          {
            color: "alert",
          },
        );
      };

      const suitSelection = () => {
        this.statusBar.removeActionButtons();
        createPassButton();
        createPassBlindButton();
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
        this.statusBar.removeActionButtons();
        createPassButton();
        this.statusBar.addActionButton("←", () => suitSelection(), {
          color: "secondary",
        });

        const minimumBid = this.highestBid
          ? this.highestBid.value + (suit > this.highestBid.suit ? 0 : 1)
          : 5 + this.frischCounter;
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
      const min = (() => {
        if (this.highestBid && this.highestBid.playerId == this.player_id) {
          return this.highestBid.value;
        } else {
          return 0;
        }
      })();

      const disallowed = (() => {
        if (this.totalContracts != 3) {
          return null;
        }

        return 13 - this.contractsSum;
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
      case "GiveCards":
        // Enable multi-selection mode for card passing
        this.handStock.setSelectionMode("multiple");
        this.statusBar.addActionButton(
          _("Give selected cards"),
          () => this.onGiveCards(),
          {
            color: "primary",
          },
        );
        break;
    }
  }

  // #endregion

  // #region UI

  private async playCardOnTable(
    player_id: number,
    suit: number,
    value: number,
    card_id: number,
  ) {
    const stock = this.tableStocks[player_id];
    await stock.addCard({ id: card_id, type: suit, type_arg: value });
  }

  private createTrumpIndication() {
    this.getGameAreaElement().insertAdjacentHTML(
      "beforeend",
      html`<div id="trump-indication"></div>`,
    );
  }

  private updateTrumpSuit(newTrumpSuit: number) {
    document.getElementById("trump-indication").innerHTML = (() => {
      if (!newTrumpSuit) {
        return html``;
      }

      return html`
        <b>👑 Trump: </b>
        <span id="trump-indication-suit">${suits[newTrumpSuit].emoji}</span>
      `;
    })();
  }

  private createRoundIndication() {
    const totalRounds = this.gamedatas.numberOfRounds;
    // TODO: consider a fancier progress bar
    this.getGameAreaElement().insertAdjacentHTML(
      "beforeend",
      html`<div id="round-indication">
        <b>Round: </b>
        <span id="round-indication-number"></span> /
        <span id="total-rounds">${totalRounds}</span>
      </div>`,
    );
  }

  private updateRound(newRound: number) {
    document.getElementById("round-indication-number").innerHTML =
      newRound.toString();
  }

  private createTables() {
    this.getGameAreaElement().insertAdjacentHTML(
      "beforeend",
      html` <div id="player-tables"></div> `,
    );

    const playerorder = [...this.gamedatas.playerorder];
    while (playerorder[0] != this.player_id) {
      playerorder.push(playerorder.shift());
    }

    playerorder.forEach((playerId, index) => {
      const player = this.gamedatas.players[playerId];
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

    this.tableStocks = Object.keys(this.gamedatas.players).reduce(
      (acc: Record<number, LineStock<Card>>, playerId) => {
        acc[+playerId] = new BgaCards.LineStock(
          this.cardManager,
          document.getElementById(`playertablecard_${playerId}`),
          {},
        );
        return acc;
      },
      {},
    );
  }

  private onGiveCards() {
    const selectedCards = this.handStock.getSelection();

    if (selectedCards.length !== 3) {
      this.showMessage(_("You must select exactly 3 cards"), "error");
      return;
    }

    // Get card IDs as a semicolon-separated string
    const cardIds = selectedCards.map((card) => card.id).join(";");

    this.handStock.unselectAll();
    this.bgaPerformAction("actGiveCards", { card_ids: cardIds });
  }

  private createCardsManager() {
    this.animationManager = new BgaAnimations.Manager({
      animationsActive: () => this.bgaAnimationsActive(),
    });
    // Initialize BgaCards Manager
    this.cardManager = new BgaCards.Manager<Card>({
      animationManager: this.animationManager,
      cardWidth: 72,
      cardHeight: 96,
      cardBorderRadius: "3px",
      getId: ({ id }) => id,
      setupDiv: (card, element: HTMLDivElement) => {
        element.classList.add("card");
        element.dataset.cardId = card.id.toString();
      },
      setupFrontDiv: (card, element) => {
        const suit = card.type;
        const value = card.type_arg;
        const x = value - 2;
        const y = suit - 1;
        element.style.backgroundImage = `url(${(window as any).g_gamethemeurl}img/cards2.jpg)`;
        element.style.backgroundPosition = `-${x}00% -${y}00%`;
        element.style.backgroundSize = `${13 * 100}% ${4 * 100}%`;
      },
      isCardVisible: (card) => card.type > 0,
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

    // Initialize HandStock
    this.handStock = new BgaCards.HandStock(
      this.cardManager,
      document.getElementById("myhand"),
      {
        sort: (a, b) =>
          getSuitSortIndex(a.type) - getSuitSortIndex(b.type) ||
          a.type_arg - b.type_arg,
      },
    );
    this.handStock.setSelectionMode("single");
    this.handStock.onCardClick = (card) => {
      if (this.player_id != this.getActivePlayerId()) {
        return;
      }
      // this.playersLineStocks[this.player_id].addCard(card); // todo: check how and if we can do optimistic update
      this.bgaPerformAction("actPlayCard", { cardId: card.id });
      this.handStock.unselectAll();
    };

    // Add cards to hand
    const { hand } = this.gamedatas;
    for (const card of hand) {
      this.handStock.addCard(card);
    }
  }

  private createPlayersPanels() {
    const { players } = this.gamedatas;
    for (const playerId in players) {
      this.getPlayerPanelElement(+playerId).insertAdjacentHTML(
        "beforeend",
        html`<div class="player-panel" id="player_panel_${playerId}">
          <div id="bid"></div>
          <div id="contract"></div>
          <div id="tricks"></div>
        </div>`,
      );
    }
  }

  private createVoidStocks() {
    const { players } = this.gamedatas;
    for (const playerId in players) {
      this.voidStocks[+playerId] = new BgaCards.VoidStock(
        this.cardManager,
        document.querySelector(`#player_panel_${playerId} #tricks`),
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
    this.updateHighestBidState(+playerId, bidValue, bidSuit);
  }

  private updateHighestBidState(
    playerId: number,
    bidValue: number,
    bidSuit: number,
  ) {
    if (
      bidValue > 0 &&
      (!this.highestBid ||
        isBidHigher(
          this.highestBid.suit,
          this.highestBid.value,
          bidSuit,
          bidValue,
        ))
    ) {
      this.highestBid = {
        value: +bidValue,
        suit: +bidSuit,
        playerId,
      };
    }
  }

  private updateContract(playerId: number, value: number) {
    console.log("updatePlayerContract", playerId, value);
    if (value < 0) {
      this.updatePanelElement(playerId, "contract", html``);
      return;
    }
    this.contractsSum += +value;
    this.totalContracts++;
    this.updatePanelElement(
      playerId,
      "contract",
      html`<b>Contract:</b> ${value}`,
    );
  }

  private updateTricks(playerId: number, value: number) {
    this.updatePanelElement(playerId, "tricks", html`<b>Tricks:</b> ${value}`);
    this.tricksTaken[+playerId] = +value;
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

  private disableUnplayableCards() {
    if (!this.trickSuit) {
      return;
    }
    const cardsWithSameSuit = this.handStock
      .getCards()
      .filter((card) => card.type == this.trickSuit);
    if (!cardsWithSameSuit.length) {
      return;
    }
    this.handStock.setSelectableCards(cardsWithSameSuit);
  }

  // #endregion

  // #region Framework methods - these are provided by ebg.core.gamegui in the BGA environment
  // We use type assertions to access them since they're added by the BGA framework at runtime

  public setupNotifications() {
    this.bgaSetupPromiseNotifications();
  }

  // #endregion

  // #region Notifications

  // #region Bidding round

  private notif_playerPass(notif) {
    this.updatePlayerBid(notif.player_id, PASS, 0);
  }

  private notif_playerPassBlind(notif) {
    this.updatePlayerBid(notif.player_id, PASS_BLIND, 0);
  }

  private notif_playerBid(notif) {
    this.updatePlayerBid(notif.player_id, notif.value, notif.suit);
  }

  private notif_bidWon(notif) {
    for (const playerId in this.gamedatas.players) {
      this.updatePlayerBid(playerId, 0, 0);
    }
    this.updateTrumpSuit(notif.suit);
  }

  // #endregion

  // #region Contract Round

  private notif_playerContract(notif) {
    this.updateContract(notif.player_id, notif.value);
    this.updateTricks(notif.player_id, 0);
  }

  // #endregion

  // #region playing tricks

  private async notif_playCard(notif) {
    if (!this.trickSuit) {
      this.trickSuit = notif.color;
    }
    await this.playCardOnTable(
      notif.player_id,
      notif.color,
      notif.value,
      notif.card_id,
    );
    await timeout(500);
  }

  private async notif_trickWin(notif: { player_id: string }) {
    this.trickSuit = null;
    this.updateTricks(+notif.player_id, ++this.tricksTaken[notif.player_id]);
    const cardsToCollect = Object.values(this.tableStocks).flatMap((stock) =>
      stock.getCards(),
    );
    const voidStock = this.voidStocks[notif.player_id];
    await Promise.all(cardsToCollect.map((card) => voidStock.addCard(card)));
  }

  // #endregion

  // #region end hand

  /**
   * At the end of the game points happen without new hand
   * At the beginning of the game new hand happens without points
   * */

  private notif_points(
    scores: {
      player_id: number;
      points: number;
    }[],
  ) {
    for (const score of scores) {
      this.scoreCtrl[score.player_id].incValue(score.points);
    }
  }

  private async notif_newHand({ cards, roundNumber }) {
    this.totalContracts = 0;
    this.contractsSum = 0;
    this.handStock.removeAll();
    this.highestBid = null;
    this.frischCounter = 0;

    this.updateTrumpSuit(0);
    this.updateRound(+roundNumber);
    for (const playerId in this.gamedatas.players) {
      this.updatePanelElement(playerId, "contract", html``);
      this.updatePanelElement(playerId, "tricks", html``);
      this.updatePanelElement(playerId, "bid", html``); // in case the new hand is a result of 4 passes
    }

    for (const i in cards) {
      const card = cards[i];
      this.handStock.addCard(card);
    }
  }

  private async notif_giveCards(notif: { cards: number[] }) {
    // Remove cards from hand that were given away
    for (const cardId of notif.cards) {
      const card = this.handStock.getCards().find((c) => c.id === cardId);
      if (card) {
        await this.handStock.removeCard(card);
      }
    }
  }

  private async notif_takeCards(notif: { cards: Card[] }) {
    // Add received cards to hand
    for (const card of notif.cards) {
      await this.handStock.addCard(card);
    }
  }

  private notif_frisch(notif: { frischCounter: number }) {
    this.frischCounter = notif.frischCounter;
  }

  // #endregion

  // #endregion
}

function cardId(suit: number, value: number): number {
  return (suit - 1) * 13 + (value - 2);
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
  return newBidValue >= currentBidValue + (newBidSuit > currentBidSuit ? 0 : 1);
}

function getSuitSortIndex(suit: number): number {
  return [2, 1, 3, 4][suit - 1];
}

function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
