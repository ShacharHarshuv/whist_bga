<?php

declare(strict_types=1);

namespace Bga\Games\IsraeliWhistShahar;

use Bga\Games\IsraeliWhistShahar\States\NewHand;
use Bga\Games\IsraeliWhistShahar\States\NextPlayer;
use Bga\Games\IsraeliWhistShahar\States\NextBidder;
use Bga\Games\IsraeliWhistShahar\States\NextBet;
use Bga\Games\IsraeliWhistShahar\States\ZombiePass;

/*
 1 = Spades
 2 = Hearts
 3 = Clubs
 4 = Diamonds
*/

class Game extends \Bga\GameFramework\Table
{
    public $suits; // For each suit number (1-4) what is the label (spade, heart, diamond, club)
    public $values_label; // For each card value (2-14) what is the label (2, ..., 10, J, Q, K, A)
    public $deck;

    function __construct()
    {
        parent::__construct();

        $this->initGameStateLabels([
            "trickSuit" => 11,
            "trumpSuit" => 12,
            "roundNumber" => 13,
            "numberOfPasses" => 14, // is that the best way to track it? Perhaps we should track who passed instead?
            // As above, perhaps it's better to track the lastest bids for all players so we can display it? For now let's go with this
            "currentBidValue" => 15,
            "currentBidSuit" => 16,
            "currentBidPlayerId" => 17,
            // Do we need those two? It seems like it would be derived from the state of the contracts, and doesn't need to be separate
            "contractsSum" => 18,
            "numberOfContracts" => 19,
        ]);

        // Initialize suits and values
        $this->suits = [
            1 => [
                "name" => clienttranslate("spade"),
                "nametr" => self::_("spade"),
            ],
            2 => [
                "name" => clienttranslate("heart"),
                "nametr" => self::_("heart"),
            ],
            3 => [
                "name" => clienttranslate("club"),
                "nametr" => self::_("club"),
            ],
            4 => [
                "name" => clienttranslate("diamond"),
                "nametr" => self::_("diamond"),
            ],
        ];

        $this->values_label = [
            2 => "2",
            3 => "3",
            4 => "4",
            5 => "5",
            6 => "6",
            7 => "7",
            8 => "8",
            9 => "9",
            10 => "10",
            11 => clienttranslate("J"),
            12 => clienttranslate("Q"),
            13 => clienttranslate("K"),
            14 => clienttranslate("A"),
        ];

        $this->deck = $this->createDeck();
    }

    private function createDeck()
    {
        $deck = $this->deckFactory->createDeck("card");
        $deck->init("card");
        $cards = [];
        foreach ($this->suits as $suitId => $suit) {
            for ($value = 2; $value <= 14; $value++) {
                //  2, 3, 4, ... K, A
                $cards[] = [
                    "type" => $suitId,
                    "type_arg" => $value,
                    "nbr" => 1,
                ];
            }
        }

        $deck->createCards($cards, "deck");

        // Shuffle deck
        $deck->shuffle("deck");

        return $deck;
    }

    protected function getGameName()
    {
        // Used for translations and stuff. Please do not modify.
        return "israeliwhistshahar";
    }

    /*
        setupNewGame:

        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame($players, $options = [])
    {
        // Set the colors of the players with HTML color code. The default below is red/green/blue/orange/brown. The
        // number of colors defined here must correspond to the maximum number of players allowed for the gams.
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos["player_colors"];

        foreach ($players as $player_id => $player) {
            // Now you can access both $player_id and $player array
            $query_values[] = vsprintf("('%s', '%s', '%s', '%s', '%s')", [
                $player_id,
                array_shift($default_colors),
                $player["player_canal"],
                addslashes($player["player_name"]),
                addslashes($player["player_avatar"]),
            ]);
        }

        // Create players based on generic information.
        //
        // NOTE: You can add extra field on player table in the database (see dbmodel.sql) and initialize
        // additional fields directly here.
        static::DbQuery(
            sprintf(
                "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES %s",
                implode(",", $query_values)
            )
        );

        $this->reattributeColorsBasedOnPreferences(
            $players,
            $gameinfos["player_colors"]
        );
        $this->reloadPlayersBasicInfos();

        /************ Start the game initialization *****/

        // Set current trick color to zero (= no trick color)
        $this->setGameStateInitialValue("trickSuit", 0);

        //  Set current trump color to zero (= no trump color)
        $this->setGameStateInitialValue("trumpSuit", 0);

        //  Set current trump color to zero (= no trump color)
        $this->setGameStateInitialValue("roundNumber", 1);

        //  Set current trump color to zero (= no trump color)
        $this->setGameStateInitialValue("numberOfPasses", 0);

        $this->setGameStateInitialValue("currentBidValue", 0);

        $this->setGameStateInitialValue("currentBidSuit", 0);

        $this->setGameStateInitialValue("currentBidPlayerId", 0);

        $this->setGameStateInitialValue("contractsSum", 0);

        $this->setGameStateInitialValue("numberOfContracts", 0);

        // Deal 13 cards to each players
        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $player_id => $player) {
            $this->deck->pickCards(13, "deck", $player_id);
        }

        // Init global values with their initial values
        //self::setGameStateInitialValue( 'my_first_global_variable', 0 );

        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        //self::initStat( 'table', 'table_teststat1', 0 );    // Init a table statistics
        //self::initStat( 'player', 'player_teststat1', 0 );  // Init a player statistics (for all players)

        // Initialize player scores
        $this->DbQuery("UPDATE player SET player_score = 0");

        $this->activeNextPlayer();

        return NewHand::class;
    }

    protected function getAllDatas(): array
    {
        $result = [];

        $current_player_id = $this->getCurrentPlayerId(); // !! We must only return informations visible by this player !!

        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql =
            "SELECT player_id id, player_score score, tricks_taken taken, tricks_need tricks FROM player ";
        $result["players"] = $this->getCollectionFromDb($sql);

        // Gather all information about current game situation (visible by player $current_player_id)

        // Cards in player hand
        $result["hand"] = array_values(
            $this->deck->getCardsInLocation("hand", $current_player_id)
        );

        // Cards played on the table
        $result["cardsontable"] = $this->deck->getCardsInLocation(
            "cardsontable"
        );

        $result["roundNumber"] = $this->getGameStateValue("roundNumber");

        $result["round_trump"] = $this->getGameStateValue("currentBidSuit");

        foreach ($result["players"] as $player_id => $player) {
            $this->dump(
                "player bet :",
                $result["players"][$player_id]["tricks"]
            );
            $this->dump(
                "player score :",
                $result["players"][$player_id]["score"]
            );
            //$cardswon = $this->cards->getCardsInLocation('cardswon', $player_id);
            //  foreach ($cardswon as $card) $score += $this->calculateCardPoints($card, $result['face_value_scoring'], $result['spades_scoring'], $result['jack_of_diamonds']);
            //  $result['players'][$player_id]['tricks_taken'] = 0;
            //	$result['players'][$player_id]['tricks_need'] = 0;
        }

        return $result;
    }

    /*
        getGameProgression:

        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).

        This method is called each time we are in a game state with the "updateGameProgression" property set to true
        (see states.inc.php)
    */
    function getGameProgression()
    {
        $round = $this->getGameStateValue("roundNumber");
        return $round * 10;
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    /*
        In this space, you can put any utility methods useful for your game logic
    */

    function checkPlayableCards($player_id): array
    {
        // Get all data needed to check playable cards at the moment
        $currenttrickSuit = $this->getGameStateValue("trickSuit");
        $hand = $this->deck->getPlayerHand($player_id);
        $all_ids = self::getObjectListFromDB(
            "SELECT card_id FROM card WHERE card_location = 'hand' AND card_location_arg = $player_id",
            true
        );

        if ($this->deck->getCardsInLocation("cardsontable", $player_id)) {
            return [];
        } // Already played a card

        if (!$currenttrickSuit) {
            // First card of the trick
            return $all_ids;
        }
        // Broken Heart or no limitation, can play any card
        else {
            // Must follow the lead suit if possible
            $same_suit = false;
            foreach ($hand as $card) {
                if ($card["type"] == $currenttrickSuit) {
                    $same_suit = true;
                    break;
                }
            }
            if ($same_suit) {
                return self::getObjectListFromDB(
                    "SELECT card_id FROM card WHERE card_type = $currenttrickSuit AND card_location = 'hand' AND card_location_arg = $player_id",
                    true
                );
            }
            // Has at least 1 card of the same suit
            else {
                return $all_ids;
            } // If not, may play any card...
        }
    }

    function getShapePower($shape)
    {
        /*
         1 = Spades => 4
         2 = Hearts => 3
         3 = Clubs => 1
         4 = Diamonds => 2
        */
        if ($shape == 1) {
            // Spade
            return 4;
        }
        if ($shape == 2) {
            // Heart
            return 3;
        }
        if ($shape == 3) {
            // Club
            return 1;
        }
        if ($shape == 4) {
            // Diamond
            return 2;
        }
    }

    function isNewWinningBid(
        $bid_value,
        $shape,
        $currentBidValue,
        $currentBidSuit
    ) {
        $better_shape =
            $this->getShapePower($shape) >
            $this->getShapePower($currentBidSuit);
        $better_value = $bid_value > $currentBidValue;
        $same_value = $bid_value == $currentBidValue;

        return ($same_value == true && $better_shape == true) || $better_value;
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    ////////////

    function playCard($card_id)
    {
        self::checkAction("playCard");
        $player_id = self::getActivePlayerId();

        // Check whether the selected card can be played or not
        $playable_cards = $this->checkPlayableCards($player_id);
        if (!in_array($card_id, $playable_cards)) {
            throw new \BgaVisibleSystemException(
                self::_("You must play a card with the same suit")
            );
        }

        $this->deck->moveCard($card_id, "cardsontable", $player_id);
        $currentCard = $this->deck->getCard($card_id);

        $currenttrickSuit = self::getGameStateValue("trickSuit");
        if ($currenttrickSuit == 0) {
            self::setGameStateValue("trickSuit", $currentCard["type"]);
        }

        // And notify
        self::notifyAllPlayers(
            "playCard",
            clienttranslate(
                '${player_name} plays ${value_displayed} ${color_displayed}'
            ),
            [
                "i18n" => ["color_displayed", "value_displayed"],
                "card_id" => $card_id,
                "player_id" => $player_id,
                "player_name" => self::getActivePlayerName(),
                "value" => $currentCard["type_arg"],
                "value_displayed" =>
                    $this->values_label[$currentCard["type_arg"]],
                "color" => $currentCard["type"],
                "color_displayed" => $this->suits[$currentCard["type"]]["name"],
            ]
        );
        return NextPlayer::class;
    }

    function pass()
    {
        self::checkAction("pass");

        $player_id = self::getActivePlayerId();
        $sql = "UPDATE player SET player_bid_value=-2 WHERE player_id='$player_id'";
        self::DbQuery($sql);

        $passes = self::getGameStateValue("numberOfPasses");
        self::setGameStateValue("numberOfPasses", $passes + 1);

        self::notifyAllPlayers(
            "playerPass",
            clienttranslate('${player_name} passes'),
            [
                "player_name" => self::getActivePlayerName(),
            ]
        );

        return NextBidder::class;
    }

    function playerBid($bid_value, $shape)
    {
        $currentBidValue = self::getGameStateValue("currentBidValue");
        $currentBidSuit = self::getGameStateValue("currentBidSuit");
        $active_player_id = self::getActivePlayerId();

        if ($bid_value < 5) {
            throw new \BgaVisibleSystemException(
                self::_("Bid value must be at lease 5")
            );
        }

        // No bid yet
        if (
            $currentBidValue == 0 ||
            $this->isNewWinningBid(
                $bid_value,
                $shape,
                $currentBidValue,
                $currentBidSuit
            )
        ) {
            self::setGameStateValue("currentBidValue", $bid_value);
            self::setGameStateValue("currentBidSuit", $shape);
            self::setGameStateValue("currentBidPlayerId", $active_player_id);
            self::setGameStateValue("numberOfPasses", 0);
        } else {
            throw new \BgaVisibleSystemException(
                self::_("Bid is not strong enough")
            );
        }

        // And notify
        self::notifyAllPlayers(
            "playerBid",
            clienttranslate(
                '${player_name} bids ${value_displayed} ${color_displayed}'
            ),
            [
                "i18n" => ["color_displayed", "value_displayed"],
                "player_id" => $active_player_id,
                "player_name" => self::getActivePlayerName(),
                "value_displayed" => $bid_value,
                "color_displayed" => $this->suits[$shape]["name"],
            ]
        );

        return NextBidder::class;
    }

    function playerBet($bet_value)
    {
        $player_id = self::getActivePlayerId();
        $currentBidPlayerId = self::getGameStateValue("currentBidPlayerId");
        $currentBidValue = self::getGameStateValue("currentBidValue");

        if (
            $player_id == $currentBidPlayerId &&
            $bet_value < $currentBidValue
        ) {
            throw new \BgaVisibleSystemException(
                self::_("Bet cannot be smaller then bid value")
            );
        }

        $contractsSum = self::getGameStateValue("contractsSum");
        $numberOfContracts = self::getGameStateValue("numberOfContracts");
        $sum_bets = $contractsSum + $bet_value;

        if ($sum_bets == 13) {
            throw new \BgaVisibleSystemException(
                self::_("Total bets value cannot be exactly 13")
            );
        }

        $numberOfContracts = $numberOfContracts + 1;
        self::setGameStateValue("contractsSum", $sum_bets);
        self::setGameStateValue("numberOfContracts", $numberOfContracts);

        $sql = "UPDATE player SET tricks_need=$bet_value WHERE player_id='$player_id'";
        self::DbQuery($sql);

        self::notifyAllPlayers(
            "playerBet",
            clienttranslate(
                '${player_name} bet on taking ${value_displayed} tricks'
            ),
            [
                "player_name" => self::getActivePlayerName(),
                "player_id" => $player_id,
                "value_displayed" => $bet_value,
            ]
        );

        return NextBet::class;
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Game state arguments
    ////////////

    function argGiveCards()
    {
        return [];
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    //////////////////////////////////////////////////////////////////////////////
    //////////// Zombie
    ////////////

    /*
        zombieTurn:

        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).

        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message.
    */

    function zombieTurn($state, $active_player)
    {
        $statename = $state["name"];

        if ($state["type"] === "activeplayer") {
            switch ($statename) {
                default:
                    return ZombiePass::class;
            }

            return;
        }

        if ($state["type"] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive($active_player, "");

            return;
        }

        throw new \feException(
            "Zombie mode not supported at this game state: " . $statename
        );
    }

    ///////////////////////////////////////////////////////////////////////////////////:
    ////////// DB upgrade
    //////////

    /*
        upgradeTableDb:

        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.

    */

    function upgradeTableDb($from_version)
    {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345

        // Example:
        //        if( $from_version <= 1404301345 )
        //        {
        //            // ! important ! Use DBPREFIX_<table_name> for all tables
        //
        //            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
        //            self::applyDbUpgradeToAllDB( $sql );
        //        }
        //        if( $from_version <= 1405061421 )
        //        {
        //            // ! important ! Use DBPREFIX_<table_name> for all tables
        //
        //            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
        //            self::applyDbUpgradeToAllDB( $sql );
        //        }
        //        // Please add your future database scheme changes here
        //
        //
    }
}
