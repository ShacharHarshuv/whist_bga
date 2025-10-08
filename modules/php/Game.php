<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhist;

use Bga\Games\israeliwhist\States\NewHand;
use Bga\Games\israeliwhist\States\NextPlayer;
use Bga\Games\israeliwhist\States\NextBidder;
use Bga\Games\israeliwhist\States\NextDeclaration;
use Bga\Games\israeliwhist\States\ZombiePass;

/*
 1 = Clubs (weakest)
 2 = Diamonds
 3 = Hearts
 4 = Spades (strongest)
*/

class Game extends \Bga\GameFramework\Table
{
    public $suits; // For each suit number (1-4) what is the label (spade, heart, diamond, club)
    public $values_label; // For each card value (2-14) what is the label (2, ..., 10, J, Q, K, A)
    public $deck;
    public $numberOfRounds = 13; // TODO: allow to customize via settings

    function __construct()
    {
        parent::__construct();

        $this->initGameStateLabels([
            "trickSuit" => 11,
            "trumpSuit" => 12,
            "roundNumber" => 13,
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
                "name" => "club",
                "emoji" => "♣️",
            ],
            2 => [
                "name" => "diamond",
                "emoji" => "♦️",
            ],
            3 => [
                "name" => "heart",
                "emoji" => "♥️",
            ],
            4 => [
                "name" => "spade",
                "emoji" => "♠️",
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

        $this->deck = $this->deckFactory->createDeck("card");
    }

    protected function getGameName()
    {
        // Used for translations and stuff. Please do not modify.
        return "israeliwhist";
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

        $this->setGameStateInitialValue("currentBidValue", 0);

        $this->setGameStateInitialValue("currentBidSuit", 0);

        $this->setGameStateInitialValue("currentBidPlayerId", 0);

        $this->setGameStateInitialValue("contractsSum", 0);

        $this->setGameStateInitialValue("numberOfContracts", 0);

        $this->createCards();

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

    private function createCards()
    {
        // Initialize the deck (cards will be dealt in NewHand state)
        $this->deck->init("card");
        $cards = [];
        foreach (array_keys($this->suits) as $suitId) {
            for ($value = 2; $value <= 14; $value++) {
                //  2, 3, 4, ... K, A
                $cards[] = [
                    "type" => $suitId,
                    "type_arg" => $value,
                    "nbr" => 1,
                ];
            }
        }
        $this->deck->createCards($cards, "deck");
        $this->deck->shuffle("deck");
    }

    protected function getAllDatas(): array
    {
        $result = [];

        $current_player_id = $this->getCurrentPlayerId(); // !! We must only return informations visible by this player !!

        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $result["players"] = $this->getCollectionFromDb(
            "SELECT 
                player_id id, 
                player_score score, 
                tricks_taken taken, 
                `contract`,
                bid_value,
                bid_suit
            FROM player"
        );

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

        $result["trump"] = $this->getGameStateValue("trumpSuit");

        // todo: what is this for?
        // foreach ($result["players"] as $player_id => $player) {
        //     $this->dump(
        //         "player bet :",
        //         $result["players"][$player_id]["contract"]
        //     );
        //     $this->dump(
        //         "player score :",
        //         $result["players"][$player_id]["score"]
        //     );
        //     //$cardswon = $this->cards->getCardsInLocation('cardswon', $player_id);
        //     //  foreach ($cardswon as $card) $score += $this->calculateCardPoints($card, $result['face_value_scoring'], $result['spades_scoring'], $result['jack_of_diamonds']);
        //     //  $result['players'][$player_id]['tricks_taken'] = 0;
        //     //	$result['players'][$player_id]['contract'] = 0;
        // }

        $result["trickSuit"] = $this->getGameStateValue("trickSuit");
        $result["numberOfRounds"] = $this->numberOfRounds;

        return $result;
    }

    function getGameProgression(): int
    {
        $round = $this->getGameStateValue("roundNumber");
        return (int) round(($round / $this->numberOfRounds) * 100);
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function formatBid(int $value, int $suit): string
    {
        return $value . $this->suits[$suit]["emoji"];
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
