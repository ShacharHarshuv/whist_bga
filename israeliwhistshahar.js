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
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var html = String.raw;
var suits = {
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
var highestBid = null;
var contractsSum = 0;
var totalContracts = 0;
var playerHand;
var cardwidth = 72;
var cardheight = 96;
var IsraeliWhistShahar = /** @class */ (function () {
    function IsraeliWhistShahar() {
        console.log("israeliwhistshahar constructor!");
    }
    IsraeliWhistShahar.prototype.setup = function (gamedatas) {
        var _this = this;
        console.log("Starting game setup?", gamedatas);
        createTrumpIndication(this.getGameAreaElement());
        updateTrumpSuit(gamedatas.trump);
        createTables(this.getGameAreaElement(), gamedatas.players);
        createPlayerHand(this, gamedatas.hand);
        // Cards played on table
        for (var i in this.gamedatas.cardsontable) {
            var card = this.gamedatas.cardsontable[i];
            var color = card.type;
            var value = card.type_arg;
            var player_id = card.location_arg;
            this.playCardOnTable(player_id, color, value, card.id);
        }
        createPlayersPanels(gamedatas.players, function (playerId) {
            return _this.getPlayerPanelElement(playerId);
        });
        if (gamedatas.gamestate.name == "PlayerBid") {
            for (var playerId in gamedatas.players) {
                var player = gamedatas.players[playerId];
                updatePlayerBid(playerId, player.bid, 0); // Assuming bid_suit is 0 for now
            }
        }
        else {
            for (var playerId in gamedatas.players) {
                var player = gamedatas.players[playerId];
                updateHighestBidState(playerId, player.bid, 0);
                updatePlayerContract(playerId, player.tricks_won);
            }
        }
        // Setup game notifications to handle (see "setupNotifications" method below)
        this.setupNotifications();
        console.log("Ending game setup");
    };
    IsraeliWhistShahar.prototype.onEnteringState = function (stateName, args) {
        console.log("Entering state: " + stateName);
    };
    IsraeliWhistShahar.prototype.onLeavingState = function (stateName) {
        console.log("Leaving state: " + stateName);
        switch (stateName) {
            case "dummmy":
                break;
        }
    };
    IsraeliWhistShahar.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        console.log("onUpdateActionButtons: " + stateName);
        console.log("State Name", stateName);
        var createPlayerBidButtons = function () {
            var createPassButton = function () {
                _this.statusBar.addActionButton(_("Pass"), function () { return _this.bgaPerformAction("actPass"); }, {
                    color: "alert",
                });
            };
            var suitSelection = function () {
                _this.removeActionButtons();
                createPassButton();
                var _loop_1 = function (suit) {
                    _this.statusBar.addActionButton(suits[suit].emoji, function () { return valueSelection(+suit); }, {
                        color: "secondary",
                    });
                };
                for (var suit in suits) {
                    _loop_1(suit);
                }
            };
            var valueSelection = function (suit) {
                _this.removeActionButtons();
                createPassButton();
                _this.statusBar.addActionButton("←", function () { return suitSelection(); }, {
                    color: "secondary",
                });
                var minimumBid = highestBid
                    ? highestBid.value + (suit > highestBid.suit ? 0 : 1)
                    : 5;
                var _loop_2 = function (value) {
                    _this.statusBar.addActionButton(formatBid(value, suit), function () {
                        _this.bgaPerformAction("actBid", { value: value, suit: suit });
                    }, {
                        color: "secondary",
                    });
                };
                for (var value = minimumBid; value <= 13; value++) {
                    _loop_2(value);
                }
            };
            suitSelection();
        };
        var createDeclarationButtons = function () {
            console.log("highestBid", highestBid, _this.player_id);
            var min = (function () {
                if (highestBid && highestBid.playerId == _this.player_id) {
                    return highestBid.value;
                }
                else {
                    return 0;
                }
            })();
            var disallowed = (function () {
                if (totalContracts != 3) {
                    return null;
                }
                return 13 - contractsSum;
            })();
            var max = 13;
            var _loop_3 = function (value) {
                _this.statusBar.addActionButton(value.toString(), function () { return _this.bgaPerformAction("actDeclare", { value: value }); }, {
                    color: "secondary",
                    disabled: value == disallowed,
                });
            };
            for (var value = min; value <= max; value++) {
                _loop_3(value);
            }
        };
        if (!this.isCurrentPlayerActive()) {
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
    };
    // Utility methods
    IsraeliWhistShahar.prototype.playCardOnTable = function (player_id, color, value, card_id) {
        this.addTableCard(value, color, player_id, player_id);
        if (player_id != +this.player_id) {
            this.placeOnObject("cardontable_" + player_id, "overall_player_board_" + player_id);
        }
        else {
            if ($("myhand_item_" + card_id)) {
                this.placeOnObject("cardontable_" + player_id, "myhand_item_" + card_id);
                playerHand.removeFromStockById(card_id);
            }
        }
        this
            .slideToObject("cardontable_" + player_id, "playertablecard_" + player_id)
            .play();
    };
    IsraeliWhistShahar.prototype.addTableCard = function (value, suit, card_player_id, playerTableId) {
        var x = value - 2;
        var y = suit - 1;
        document
            .getElementById("playertablecard_" + playerTableId)
            .insertAdjacentHTML("beforeend", html(__makeTemplateObject(["<div\n          class=\"card cardontable\"\n          id=\"cardontable_", "\"\n          style=\"background-position:-", "00% -", "00%\"\n        ></div>"], ["<div\n          class=\"card cardontable\"\n          id=\"cardontable_", "\"\n          style=\"background-position:-", "00% -", "00%\"\n        ></div>"]), card_player_id, x, y));
    };
    IsraeliWhistShahar.prototype.onPlayerHandSelectionChanged = function () {
        var items = playerHand.getSelectedItems();
        if (items.length > 0) {
            var canPlay = true;
            if (canPlay) {
                var cardId_1 = items[0].id;
                this.bgaPerformAction("actPlayCard", { cardId: cardId_1 });
                playerHand.unselectAll();
            }
            else {
                playerHand.unselectAll();
            }
        }
    };
    // Framework methods - these are provided by ebg.core.gamegui in the BGA environment
    // We use type assertions to access them since they're added by the BGA framework at runtime
    IsraeliWhistShahar.prototype.getCardUniqueId = function (color, value) {
        return cardId(color, value);
    };
    IsraeliWhistShahar.prototype.setupNotifications = function () {
        this.bgaSetupPromiseNotifications(); // todo
        this.notifqueue.setSynchronous("trickWin", 1000);
        this.notifqueue.setSynchronous("playCard", 500);
    };
    // Notification handlers
    IsraeliWhistShahar.prototype.notif_newHand = function (notif) {
        playerHand.removeAll();
        for (var i in notif.cards) {
            var card = notif.cards[i];
            var color = card.type;
            var value = card.type_arg;
            playerHand.addToStockWithId(this.getCardUniqueId(color, value), card.id);
        }
    };
    IsraeliWhistShahar.prototype.notif_playCard = function (notif) {
        this.playCardOnTable(notif.player_id, notif.color, notif.value, notif.card_id);
    };
    IsraeliWhistShahar.prototype.notif_playerPass = function (notif) {
        updatePlayerBid(notif.player_id, -2, 0);
    };
    IsraeliWhistShahar.prototype.notif_playerBid = function (notif) {
        updatePlayerBid(notif.player_id, notif.value, notif.suit);
    };
    IsraeliWhistShahar.prototype.notif_bidWon = function (notif) {
        for (var playerId in this.gamedatas.players) {
            updatePlayerBid(playerId, 0, 0);
        }
        updateTrumpSuit(notif.suit);
    };
    IsraeliWhistShahar.prototype.notif_trickWin = function (notif) {
        this.tricks_counter[notif.player_id].incValue(1);
    };
    IsraeliWhistShahar.prototype.notif_giveAllCardsToPlayer = function (notif) {
        var winner_id = notif.player_id;
        for (var player_id in this.gamedatas.players) {
            var anim = this.slideToObject("cardontable_" + player_id, "overall_player_board_" + winner_id);
            dojo.connect(anim, "onEnd", function (node) {
                dojo.destroy(node);
            });
            anim.play();
        }
    };
    IsraeliWhistShahar.prototype.notif_points = function (notif) {
        for (var player_id in notif.scores) {
            this.scoreCtrl[player_id].toValue(notif.scores[player_id]);
        }
    };
    IsraeliWhistShahar.prototype.notif_newRound = function (notif) {
        this.round.setValue(notif.roundNumber);
        for (var player_id in notif.scores) {
            this.contract_counter[player_id].setValue(0);
            this.tricks_counter[player_id].setValue(0);
        }
    };
    IsraeliWhistShahar.prototype.notif_playerContract = function (notif) {
        updatePlayerContract(notif.player_id, notif.value);
    };
    return IsraeliWhistShahar;
}());
// Utility functions
function createTables(gameAreaElement, players) {
    gameAreaElement.insertAdjacentHTML("beforeend", html(__makeTemplateObject([" <div id=\"player-tables\"></div> "], [" <div id=\"player-tables\"></div> "])));
    Object.values(players).forEach(function (player, index) {
        document.getElementById("player-tables").insertAdjacentHTML("beforeend", html(__makeTemplateObject(["\n        <div\n          class=\"playertable whiteblock playertable_", "\"\n        >\n          <div class=\"playertablename\" style=\"color:#", ";\">\n            ", "\n          </div>\n          <div class=\"playertablecard\" id=\"playertablecard_", "\"></div>\n          <div class=\"playertablename\" id=\"hand_score_wrap_", "\">\n            <span class=\"hand_score_label\"></span>\n            <span id=\"hand_score_", "\"></span>\n          </div>\n        </div>\n      "], ["\n        <div\n          class=\"playertable whiteblock playertable_", "\"\n        >\n          <div class=\"playertablename\" style=\"color:#", ";\">\n            ", "\n          </div>\n          <div class=\"playertablecard\" id=\"playertablecard_", "\"></div>\n          <div class=\"playertablename\" id=\"hand_score_wrap_", "\">\n            <span class=\"hand_score_label\"></span>\n            <span id=\"hand_score_", "\"></span>\n          </div>\n        </div>\n      "]), ["S", "W", "N", "E"][index], player.color, player.name, player.id, player.id, player.id));
    });
}
function createPlayerHand(page, hand) {
    page.getGameAreaElement().insertAdjacentHTML("beforeend", html(__makeTemplateObject(["\n      <div id=\"myhand_wrap\" class=\"whiteblock\">\n        <b id=\"myhand_label\">", "</b>\n        <div id=\"myhand\"></div>\n      </div>\n    "], ["\n      <div id=\"myhand_wrap\" class=\"whiteblock\">\n        <b id=\"myhand_label\">", "</b>\n        <div id=\"myhand\"></div>\n      </div>\n    "]), _("My hand")));
    playerHand = new ebg.stock();
    playerHand.create(page, document.getElementById("myhand"), cardwidth, cardheight);
    playerHand.image_items_per_row = 13;
    for (var suit = 1; suit <= 4; suit++) {
        for (var value = 2; value <= 14; value++) {
            var card_type_id = cardId(suit, value);
            playerHand.addItemType(card_type_id, card_type_id, window.g_gamethemeurl + "img/cards.jpg", card_type_id);
        }
    }
    console.log("hand", hand);
    for (var _i = 0, hand_1 = hand; _i < hand_1.length; _i++) {
        var card = hand_1[_i];
        var suit = +card.type;
        var value = +card.type_arg;
        playerHand.addToStockWithId(cardId(suit, value), card.id);
    }
    dojo.connect(playerHand, "onChangeSelection", page, "onPlayerHandSelectionChanged");
    return playerHand;
}
function createPlayersPanels(players, getPlayerPanelElement) {
    for (var playerId in players) {
        var player = players[playerId];
        getPlayerPanelElement(playerId).insertAdjacentHTML("beforeend", html(__makeTemplateObject(["<div class=\"player-panel\" id=\"player_panel_", "\">\n        <div id=\"bid\"></div>\n        <div id=\"contract\"></div>\n      </div>"], ["<div class=\"player-panel\" id=\"player_panel_", "\">\n        <div id=\"bid\"></div>\n        <div id=\"contract\"></div>\n      </div>"]), playerId));
    }
}
function updatePlayerBid(playerId, bidValue, bidSuit) {
    var getBidText = function () {
        if (bidValue < 0) {
            return html(__makeTemplateObject(["<i>Passed<i></i></i>"], ["<i>Passed<i></i></i>"]));
        }
        else if (bidValue == 0) {
            return html(__makeTemplateObject([""], [""]));
        }
        else {
            return html(__makeTemplateObject(["<b>Bid:</b> ", ""], ["<b>Bid:</b> ", ""]), formatBid(bidValue, bidSuit));
        }
    };
    updatePanelElement(playerId, "bid", getBidText());
    updateHighestBidState(playerId, bidValue, bidSuit);
}
function updateHighestBidState(playerId, bidValue, bidSuit) {
    if (bidValue > 0 &&
        (!highestBid ||
            isBidHigher(highestBid.suit, highestBid.value, bidSuit, bidValue))) {
        highestBid = {
            value: +bidValue,
            suit: +bidSuit,
            playerId: playerId,
        };
    }
}
function updatePlayerContract(playerId, value) {
    console.log("updatePlayerContract", playerId, value);
    if (+value < 0) {
        updatePanelElement(playerId, "contract", html(__makeTemplateObject([""], [""])));
        return;
    }
    contractsSum += +value;
    totalContracts++;
    updatePanelElement(playerId, "contract", html(__makeTemplateObject(["<b>Contract:</b> ", ""], ["<b>Contract:</b> ", ""]), value));
}
function updatePanelElement(playerId, innerId, newValue) {
    var element = document.querySelector("#player_panel_".concat(playerId, " #").concat(innerId));
    if (!element) {
        throw new Error("Element not found: #player_panel_".concat(playerId, " #").concat(innerId));
    }
    element.innerHTML = newValue;
}
function cardId(suit, value) {
    return (getSpriteSheetSuitIndex(suit) - 1) * 13 + (value - 2);
}
function getSpriteSheetSuitIndex(logicalSuit) {
    var mapping = {
        1: 4, // Clubs -> position 4 in sprite sheet
        2: 3, // Diamonds -> position 3 in sprite sheet
        3: 2, // Hearts -> position 2 in sprite sheet
        4: 1, // Spades -> position 1 in sprite sheet
    };
    return mapping[logicalSuit];
}
function formatBid(bidValue, bidSuit) {
    return bidValue + suits[bidSuit].emoji;
}
function isBidHigher(currentBidSuit, currentBidValue, newBidSuit, newBidValue) {
    return newBidValue >= currentBidValue + (newBidSuit > currentBidSuit ? 1 : 0);
}
function createTrumpIndication(gameAreaElement) {
    gameAreaElement.insertAdjacentHTML("beforeend", html(__makeTemplateObject(["<div id=\"trump-indication\"></div>"], ["<div id=\"trump-indication\"></div>"])));
}
function updateTrumpSuit(newTrumpSuit) {
    console.log("updateTrumpSuit", newTrumpSuit);
    document.getElementById("trump-indication").innerHTML = (function () {
        if (!+newTrumpSuit) {
            return html(__makeTemplateObject([""], [""]));
        }
        return html(__makeTemplateObject(["\n      <b>\uD83D\uDC51 Trump: </b>\n      <span id=\"trump-indication-suit\">", "</span>\n    "], ["\n      <b>\uD83D\uDC51 Trump: </b>\n      <span id=\"trump-indication-suit\">", "</span>\n    "]), suits[+newTrumpSuit].emoji);
    })();
}
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.israeliwhistshahar", ebg.core.gamegui, new IsraeliWhistShahar());
});
