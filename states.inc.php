<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * HeartsTesting implementation : © Tom Golan tomgolanx@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * states.inc.php
 *
 * HeartsTesting game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/

//    !! It is not a good idea to modify this file when a game is running !!


$machinestates = array(

    // The initial state. Please do not modify.
    1 => array(
        "name" => "gameSetup",
        "description" => clienttranslate("Game setup"),
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => array( "" => 2 )
    ),

    // Note: ID=2 => your first state

    2 => array(
            "name" => "newHand",
            "description" => "",
            "type" => "game",
            "action" => "stNewHand",
            "updateGameProgression" => true,
            "transitions" => array( "" => 23 )
        ),

    21 => array(
        "name" => "giveCards",
        "description" => clienttranslate('Some players must choose 3 cards to give to ${direction}'),
        "descriptionmyturn" => clienttranslate('${you} must choose 3 cards to give to ${direction}'),
        "type" => "multipleactiveplayer",
        "action" => "stGiveCards",
        "args" => "argGiveCards",
        "possibleactions" => array( "giveCards" ),
        "transitions" => array( "giveCards" => 22, "skip" => 22 )
    ),

    22 => array(
        "name" => "takeCards",
        "description" => "",
        "type" => "game",
        "action" => "stTakeCards",
        "transitions" => array( "startHand" => 30, "skip" => 30  )
    ),


    23 => array(
        "name" => "playerBid",
        "description" => clienttranslate('${actplayer} must place his bid or pass'),
        "descriptionmyturn" => clienttranslate('${you} must place a bid or pass'),
        "type" => "activeplayer",
        "possibleactions" => array( "playerBid", "bid", "pass" ),
        "transitions" => array( "playerBid" => 24, "bid" => 24, "pass" => 24, "nextBidder" => 24)
    ),

    24 => array(
        "name" => "nextBidder",
        "description" => "",
        "type" => "game",
        "action" => "stNextBidder",
        "transitions" => array( "nextBidder" => 23, "playerBet" => 25, "playerBid" => 23)
    ),

    25 => array(
        "name" => "playerBet",
        "description" => clienttranslate('${actplayer} must place their bet'),
        "descriptionmyturn" => clienttranslate('${you} must place their bet'),
        "type" => "activeplayer",
        "possibleactions" => array( "playerBet", "bet" ),
        "transitions" => array( "playerBet" => 25, "bet" => 26, "nextBet" => 26)
    ),

    26 => array(
        "name" => "nextBet",
        "description" => "",
        "type" => "game",
        "action" => "stNextBet",
        "transitions" => array( "nextBet" => 25, "newTrick" => 30, "playerBet" => 25)
    ),

    // Trick

    30 => array(
        "name" => "newTrick",
        "description" => "",
        "type" => "game",
        "action" => "stNewTrick",
        "transitions" => array( "" => 31 )
    ),
    31 => array(
        "name" => "playerTurn",
        "description" => clienttranslate('${actplayer} must play a card'),
        "descriptionmyturn" => clienttranslate('${you} must play a card'),
        "type" => "activeplayer",
        "possibleactions" => array( "playCard"),
        "transitions" => array( "playCard" => 32)
    ),
    32 => array(
        "name" => "nextPlayer",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayer",
        "transitions" => array( "nextPlayer" => 31, "nextTrick" => 30, "endHand" => 40 )
    ),

    // End of the hand (scoring, etc...)
    40 => array(
        "name" => "endHand",
        "description" => "",
        "type" => "game",
        "action" => "stEndHand",
        "transitions" => array( "nextHand" => 2, "endGame" => 99 )
    ),

/*
    Examples:

    2 => array(
        "name" => "nextPlayer",
        "description" => '',
        "type" => "game",
        "action" => "stNextPlayer",
        "updateGameProgression" => true,
        "transitions" => array( "endGame" => 99, "nextPlayer" => 10 )
    ),

    10 => array(
        "name" => "playerTurn",
        "description" => clienttranslate('${actplayer} must play a card or pass'),
        "descriptionmyturn" => clienttranslate('${you} must play a card or pass'),
        "type" => "activeplayer",
        "possibleactions" => array( "playCard", "pass" ),
        "transitions" => array( "playCard" => 2, "pass" => 2 )
    ),

*/

    // Final state.
    // Please do not modify (and do not overload action/args methods).
    99 => array(
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd"
    )

);
