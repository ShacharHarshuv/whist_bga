<?php
 /**
  *------
  * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
  * IsraeliWhistShahar implementation : © Tom Golan tomgolanx@gmail.com
  *
  * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
  * See http://en.boardgamearena.com/#!doc/Studio for more information.
  * -----
  *
  * israeliwhistshahar.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */


require_once( APP_GAMEMODULE_PATH.'module/table/table.game.php' );


/*
 1 = Spades
 2 = Hearts
 3 = Clubs
 4 = Diamonds
*/

class IsraeliWhistShahar extends Table
{
	function __construct( )
	{
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();

				self::initGameStateLabels( array(
                         "currentHandType" => 10,
                         "trickColor" => 11,
                         "trumpColor" => 12,
												 "round_number" => 13,
												 "num_of_passes" => 14,
												 "current_bid" => 15,
												 "current_bid_shape" => 16,
												 "current_bid_player_id" => 17,
												 "total_round_bets" => 18,
												 "num_of_bets" => 19,
                          ) );

        $this->cards = self::getNew( "module.common.deck" );
        $this->cards->init( "card" );
	}

    protected function getGameName( )
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
    protected function setupNewGame( $players, $options = array() )
    {
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = self::getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES ";
        $values = array();
        foreach( $players as $player_id => $player )
        {
            $color = array_shift( $default_colors );
            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."')";
        }
        $sql .= implode( ',', $values);
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        self::reloadPlayersBasicInfos();

        /************ Start the game initialization *****/

        // Note: hand types: 0 = give 3 cards to player on the left
        //                   1 = give 3 cards to player on the right
        //                   2 = give 3 cards to player opposite
        //                   3 = keep cards
        self::setGameStateInitialValue( 'currentHandType', 0 );

        // Set current trick color to zero (= no trick color)
        self::setGameStateInitialValue( 'trickColor', 0 );

        //  Set current trump color to zero (= no trump color)
        self::setGameStateInitialValue( 'trumpColor', 0 );

				//  Set current trump color to zero (= no trump color)
				self::setGameStateInitialValue( 'round_number', 1 );

				//  Set current trump color to zero (= no trump color)
				self::setGameStateInitialValue( 'num_of_passes', 0 );

				self::setGameStateInitialValue( 'current_bid', 0 );

				self::setGameStateInitialValue( 'current_bid_shape', 0 );

				self::setGameStateInitialValue( 'current_bid_player_id', 0 );

				self::setGameStateInitialValue( 'total_round_bets', 0 );

				self::setGameStateInitialValue( 'num_of_bets', 0 );

				// Create cards
        $cards = array ();
        foreach ( $this->colors as $color_id => $color ) {
            // spade, heart, diamond, club
            for ($value = 2; $value <= 14; $value ++) {
                //  2, 3, 4, ... K, A
                $cards [] = array ('type' => $color_id,'type_arg' => $value,'nbr' => 1 );
            }
        }

        $this->cards->createCards( $cards, 'deck' );

				// Shuffle deck
        $this->cards->shuffle('deck');
        // Deal 13 cards to each players
        $players = self::loadPlayersBasicInfos();
        foreach ( $players as $player_id => $player ) {
            $cards = $this->cards->pickCards(13, 'deck', $player_id);
        }

        // Init global values with their initial values
        //self::setGameStateInitialValue( 'my_first_global_variable', 0 );

        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        //self::initStat( 'table', 'table_teststat1', 0 );    // Init a table statistics
        //self::initStat( 'player', 'player_teststat1', 0 );  // Init a player statistics (for all players)

        // TODO: setup the initial game situation here
				$this->DbQuery("UPDATE player SET player_score = 0");


        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas:

        Gather all informations about current game situation (visible by the current player).

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas()
    {
        $result = array();

        $current_player_id = self::getCurrentPlayerId();    // !! We must only return informations visible by this player !!

        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, tricks_taken taken, tricks_need tricks FROM player ";
        $result['players'] = self::getCollectionFromDb( $sql );

        // TODO: Gather all information about current game situation (visible by player $current_player_id).

				// Cards in player hand
        $result['hand'] = $this->cards->getCardsInLocation( 'hand', $current_player_id );

        // Cards played on the table
        $result['cardsontable'] = $this->cards->getCardsInLocation( 'cardsontable' );

				$result['round_number'] = self::getGameStateValue('round_number');

				$result['round_trump'] = self::getGameStateValue('current_bid_shape');


        foreach ($result['players'] as $player_id => $players) {
					self::dump( "player bet :", $result['players'][$player_id]['tricks']);
					self::dump( "player score :", $result['players'][$player_id]['score']);
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
				$round = self::getGameStateValue('round_number');
        return $round * 10;
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    /*
        In this space, you can put any utility methods useful for your game logic
    */



//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
////////////

			function playCard($card_id) {
					self::checkAction("playCard");
					$player_id = self::getActivePlayerId();

					// Check whether the selected card can be played or not
					$playable_cards = $this->checkPlayableCards($player_id);
					if (!in_array($card_id, $playable_cards)) throw new BgaVisibleSystemException(self::_("You must play a card with the same suit"));

					$this->cards->moveCard($card_id, 'cardsontable', $player_id);
					// XXX check rules here
					$currentCard = $this->cards->getCard($card_id);

					$currentTrickColor = self::getGameStateValue( 'trickColor' ) ;
	       	if( $currentTrickColor == 0 )
						self::setGameStateValue( 'trickColor', $currentCard['type'] );

					// And notify
					self::notifyAllPlayers('playCard', clienttranslate('${player_name} plays ${value_displayed} ${color_displayed}'), array (
									'i18n' => array ('color_displayed','value_displayed' ),'card_id' => $card_id,'player_id' => $player_id,
									'player_name' => self::getActivePlayerName(),'value' => $currentCard ['type_arg'],
									'value_displayed' => $this->values_label [$currentCard ['type_arg']],'color' => $currentCard ['type'],
									'color_displayed' => $this->colors [$currentCard ['type']] ['name'] ));
					// Next player
					$this->gamestate->nextState('playCard');
			}

			function checkPlayableCards ($player_id): array {
	        // Get all data needed to check playable cards at the moment
	        $currentTrickColor = self::getGameStateValue('trickColor');
	        $hand = $this->cards->getPlayerHand($player_id);
	        $playable_card_ids = [];

	        $all_ids = self::getObjectListFromDB("SELECT card_id FROM card WHERE card_location = 'hand' AND card_location_arg = $player_id", true);

	        if ($this->cards->getCardsInLocation('cardsontable', $player_id)) return []; // Already played a card

					if (!$currentTrickColor) { // First card of the trick
	            return $all_ids;
					} // Broken Heart or no limitation, can play any card
					else {
	            // Must follow the lead suit if possible
	            $same_suit = false;
	            foreach ($hand as $card)
	                if ($card['type'] == $currentTrickColor) {
	                    $same_suit = true;
	                    break;
	                }
	            if ($same_suit) return self::getObjectListFromDB("SELECT card_id FROM card WHERE card_type = $currentTrickColor AND card_location = 'hand' AND card_location_arg = $player_id", true); // Has at least 1 card of the same suit
	            else return $all_ids; // If not, may play any card...
	        }
	    }

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in israeliwhistshahar.action.php)
    */

    /*

    Example:

    function playCard( $card_id )
    {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        self::checkAction( 'playCard' );

        $player_id = self::getActivePlayerId();

        // Add your game logic to play a card there
        ...

        // Notify all players about the card played
        self::notifyAllPlayers( "cardPlayed", clienttranslate( '${player_name} plays ${card_name}' ), array(
            'player_id' => $player_id,
            'player_name' => self::getActivePlayerName(),
            'card_name' => $card_name,
            'card_id' => $card_id
        ) );

    }

    */


//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

		function argGiveCards() {
				return array ();
		}



    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    /*

    Example for game state "MyGameState":

    function argMyGameState()
    {
        // Get some values from the current game situation in database...

        // return values:
        return array(
            'variable1' => $value1,
            'variable2' => $value2,
            ...
        );
    }
    */

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    /*

    Example for game state "MyGameState":

    function stMyGameState()
    {
        // Do some stuff ...

        // (very often) go to another gamestate
        $this->gamestate->nextState( 'some_gamestate_transition' );
    }
    */


		function stNewHand() {
		        // Take back all cards (from any location => null) to deck
		        $this->cards->moveAllCardsInLocation(null, "deck");
		        $this->cards->shuffle('deck');

		        // Deal 13 cards to each players
		        // Create deck, shuffle it and give 13 initial cards
		        $players = self::loadPlayersBasicInfos();
		        foreach ( $players as $player_id => $player ) {
		            $cards = $this->cards->pickCards(13, 'deck', $player_id);
		            // Notify player about his cards
		            self::notifyPlayer($player_id, 'newHand', '', array ('cards' => $cards));
		        }

						// init globals
						self::setGameStateValue( 'num_of_passes', 0 );
						self::setGameStateValue( 'current_bid', 0 );
						self::setGameStateValue( 'current_bid_shape', 0 );
						self::setGameStateValue( 'current_bid_player_id', 0 );
						self::setGameStateValue( 'total_round_bets', 0 );
						self::setGameStateValue( 'num_of_bets', 0 );

		        $this->gamestate->nextState("");
		    }

		    function stNewTrick() {
		        // New trick: active the player who wins the last trick
		        // Reset trick color to 0 (= no color)
		        self::setGameStateInitialValue('trickColor', 0);
		        $this->gamestate->nextState();
		    }

				function pass() {
					self::checkAction("pass");

					$player_id = self::getActivePlayerId();
					$sql = "UPDATE player SET player_bid_value=-2 WHERE player_id='$player_id'";
					self::DbQuery($sql);

					$passes = self::getGameStateValue( 'num_of_passes' );
					self::setGameStateValue('num_of_passes', $passes + 1);

					self::notifyAllPlayers('playerPass', clienttranslate('${player_name} passes'), array (
									'player_name' => self::getActivePlayerName()));

					$this->gamestate->nextState('nextBidder');
				}


				function stNextBidder() {
				//	$active_player_id = self::getActivePlayerId();

					//$best_bid_value = 0;
				//	$best_value_player_id = null;

					// $sqlPlayers = "SELECT player_id id, player_bid_value player_bid, player_name name FROM player ";
					//
					// $result['players'] = self::getCollectionFromDb( $sqlPlayers );
					// $player_name = self::getActivePlayerName();
					//
					// self::dump( "player bid:", $player_name);
					//
					// foreach ($result['players'] as $player_id => $players) {
					// 	$current_bid = (int)$result['players'][$player_id]['player_bid'];
					// 	self::dump( "Current bid", $current_bid );
					//
					// 	if ($current_bid == -1) { // no-bid
					// 		++$num_non_bet;
					// 		self::dump( "we are non bid:", $num_non_bet);
					// 	} else if ($current_bid == -2) { // pass
					// 		++$num_passes;
					// 		self::dump( "we are pass:", $num_passes);
					// 	} else if ($current_bid > $best_bid_value) { // check best bid
					// 		$best_bid_value = $current_bid;
					// 		$best_value_player_id = $player_id;
					// 		self::dump( "we are best bid:", $best_bid_value);
					// 	}
					// }

					$passes = self::getGameStateValue( 'num_of_passes' );
					self::dump( "num_passes_global:", $passes);

					self::activeNextPlayer();

					if ($passes == 3) {
						self::notifyAllPlayers("bid_won", clienttranslate('${player_name} won the bid with ${value_displayed} ${color_displayed}'), array (
										'player_name' => self::getActivePlayerName(),
										'value_displayed' => self::getGameStateValue( 'current_bid' ),
										'color_displayed' => $this->colors [self::getGameStateValue( 'current_bid_shape' )] ['name'] ));
						$this->gamestate->nextState('playerBet');
					} else {
						$this->gamestate->nextState('playerBid');
					}
				}

				function playerBid($bid_value, $shape) {
						$current_bid = self::getGameStateValue( 'current_bid' );
						$current_bid_shape = self::getGameStateValue( 'current_bid_shape' );
						$active_player_id = self::getActivePlayerId();

						if ($bid_value < 5) {
							throw new BgaVisibleSystemException(self::_("Bid value must be at lease 5"));
						}

						// No bid yet
						if ($current_bid == 0 || $this->isNewWinningBid($bid_value, $shape, $current_bid, $current_bid_shape)) {
							self::setGameStateValue('current_bid', $bid_value);
							self::setGameStateValue('current_bid_shape', $shape);
							self::setGameStateValue('current_bid_player_id', $active_player_id);
							self::setGameStateValue('num_of_passes', 0);
						} else {
							throw new BgaVisibleSystemException(self::_("Bid is not strong enough"));
						}

						// // Update bid in DB
						// $active_player_id = self::getActivePlayerId();
						// $sql = "UPDATE player SET player_bid_value=$bid_value WHERE player_id='$active_player_id'";
						// self::DbQuery($sql);

						// And notify
						self::notifyAllPlayers('playerBid', clienttranslate('${player_name} bids ${value_displayed} ${color_displayed}'), array (
										'i18n' => array ('color_displayed','value_displayed' ),'player_id' => $active_player_id,
										'player_name' => self::getActivePlayerName(),
										'value_displayed' => $bid_value,
										'color_displayed' => $this->colors [$shape] ['name'] ));

						// self::setGameStateValue('num_of_passes', 0);
						$transition = 'nextBidder';
		        $this->gamestate->nextState($transition);
		    }

				function playerBet($bet_value) {
					$player_id = self::getActivePlayerId();
					$current_bid_player_id = self::getGameStateValue( 'current_bid_player_id' );
					$current_bid = self::getGameStateValue( 'current_bid' );

					if ($player_id == $current_bid_player_id && $bet_value < $current_bid) {
						throw new BgaVisibleSystemException(self::_("Bet cannot be smaller then bid value"));
					}

					$total_round_bets = self::getGameStateValue( 'total_round_bets' );
					$num_of_bets = self::getGameStateValue( 'num_of_bets' );
					$sum_bets = $total_round_bets + $bet_value;

					if ($sum_bets == 13) {
						throw new BgaVisibleSystemException(self::_("Total bets value cannot be exactly 13"));
					}

					$num_of_bets = $num_of_bets + 1;
					self::setGameStateValue('total_round_bets', $sum_bets);
					self::setGameStateValue('num_of_bets', $num_of_bets);

					$sql = "UPDATE player SET tricks_need=$bet_value WHERE player_id='$player_id'";
					self::DbQuery($sql);

					self::notifyAllPlayers("playerBet", clienttranslate('${player_name} bet on taking ${value_displayed} tricks'), array (
									'player_name' => self::getActivePlayerName(),
									'player_id' => $player_id,
									'value_displayed' => $bet_value));

					$this->gamestate->nextState('nextBet');
				}

				function stNextBet() {
					self::activeNextPlayer();

					$num_of_bets = self::getGameStateValue( 'num_of_bets' );

					if ($num_of_bets == 4) {
						$this->gamestate->nextState('newTrick');
					} else {
						$this->gamestate->nextState('playerBet');
					}
				}

				function getShapePower($shape) {
					/*
					 1 = Spades => 4
					 2 = Hearts => 3
					 3 = Clubs => 1
					 4 = Diamonds => 2
					*/
					if ($shape == 1) { // Spade
						return 4;
					}
					if ($shape == 2) { // Heart
						return 3;
					}
					if ($shape == 3) { // Club
						return 1;
					}
					if ($shape == 4) { // Diamond
						return 2;
					}
		    }

				function isNewWinningBid($bid_value, $shape, $current_bid, $current_bid_shape) {
					$better_shape = $this->getShapePower($shape) > $this->getShapePower($current_bid_shape);
					$better_value = $bid_value > $current_bid;
					$same_value = $bid_value == $current_bid;

					return ($same_value == true && $better_shape == true) || $better_value;
		    }

		    function stNextPlayer() {
		        // Active next player OR end the trick and go to the next trick OR end the hand
		        if ($this->cards->countCardInLocation('cardsontable') == 4) {
		            // This is the end of the trick
								// figure out winner of trick
								$cards_on_table = $this->cards->getCardsInLocation('cardsontable');
		            $best_value = 0;
		            $best_value_player_id = null;
		            $currentTrickColor = self::getGameStateValue('trickColor');
								$currentTrumpColor = self::getGameStateValue('current_bid_shape');
								$best_trump_player_id = null;
								$best_trump = 0;

		            foreach ( $cards_on_table as $card ) {
		                // Note: type = card color
		                if ($card ['type'] == $currentTrickColor) {
		                    if ($best_value_player_id === null || $card ['type_arg'] > $best_value) {
		                        $best_value_player_id = $card ['location_arg']; // Note: location_arg = player who played this card on table
		                        $best_value = $card ['type_arg']; // Note: type_arg = value of the card
		                    }
		                } else if ($card ['type'] == $currentTrumpColor) {
											if ($best_trump_player_id === null || $card ['type_arg'] > $best_trump) {
													$best_trump_player_id = $card ['location_arg']; // Note: location_arg = player who played this card on table
													$best_trump = $card ['type_arg']; // Note: type_arg = value of the card
											}
										}
		            }
								if ($best_trump > 0) {
									$best_value_player_id = $best_trump_player_id;
								}

		            // Active this player => he's the one who starts the next trick
		            $this->gamestate->changeActivePlayer( $best_value_player_id );

								// Move all cards to "cardswon" of the given player
		            $this->cards->moveAllCardsInLocation('cardsontable', 'cardswon', null, $best_value_player_id);


								//save
								$sql = "UPDATE player SET tricks_taken=tricks_taken+1 WHERE player_id='$best_value_player_id'";
								self::DbQuery($sql);

								// Notify
		            // Note: we use 2 notifications here in order we can pause the display during the first notification
		            //  before we move all cards to the winner (during the second)
		            $players = self::loadPlayersBasicInfos();
		            self::notifyAllPlayers( 'trickWin', clienttranslate('${player_name} wins the trick'), array(
		                'player_id' => $best_value_player_id,
		                'player_name' => $players[ $best_value_player_id ]['player_name']
		            ) );
		            self::notifyAllPlayers( 'giveAllCardsToPlayer','', array(
		                'player_id' => $best_value_player_id
		            ) );


		            if ($this->cards->countCardInLocation('hand') == 0) {
		                // End of the hand
		                $this->gamestate->nextState("endHand");
		            } else {
		                // End of the trick
		                $this->gamestate->nextState("nextTrick");
		            }
		        } else {
		            // Standard case (not the end of the trick)
		            // => just active the next player
		            $player_id = self::activeNextPlayer();
		            self::giveExtraTime($player_id);
		            $this->gamestate->nextState('nextPlayer');
		        }
		    }


		    function stEndHand() {
					// Count and score points, then end the game or go to the next hand.
					$players = self::loadPlayersBasicInfos();

					$isUnder = self::getGameStateValue( 'total_round_bets' ) < 13;

					$sqlPlayers = "SELECT player_id id, tricks_taken tricks, tricks_need need, player_score points FROM player ";
					$result['players'] = self::getCollectionFromDb( $sqlPlayers );

					$scores = array();

					foreach ( $players as $player_id => $player ) {
							$tricks_need = $result['players'][$player_id]['need'];
							$tricks_taken = $result['players'][$player_id]['tricks'];
							$player_points = $result['players'][$player_id]['points'];
							$round_points = 0;

							// success
							if($tricks_need == $tricks_taken) {
								if ($tricks_taken == 0) {
									if ($isUnder == true) {
										$round_points = 50;
									} else {
										$round_points = 25;
									}
								} else {
									$round_points = ($tricks_taken * $tricks_taken) + 10;
								}
							} else { // fails
								$diff = $tricks_need - $tricks_taken;
								$round_points = abs($diff) * -10;
							}

							$sum_points = $round_points + $player_points;

							self::dump( "player sum_points :", $sum_points);
							$scores[$player_id] = $sum_points;

							$sql = "UPDATE player SET player_score=$sum_points, tricks_taken=0, tricks_need=0 WHERE player_id='$player_id'";
							self::DbQuery($sql);

							self::notifyAllPlayers("newScores", clienttranslate('${player_name} took ${tricks} / ${need} tricks and received ${points} points'), array (
											'player_id' => $player_id,'player_name' => $players [$player_id] ['player_name'],
											'points' => $round_points,
											'tricks' => $tricks_taken, 'need' => $tricks_need  ));
					}

					self::notifyAllPlayers( "points", '', array( 'scores' => $scores ) );

					// Apply scores to player
					// foreach ( $player_to_points as $player_id => $points ) {
					// 		if ($points != 0) {
					// 				$sql = "UPDATE player SET player_score=player_score-$points,tricks_taken=0, tricks_need=0 WHERE player_id='$player_id'";
					// 				self::DbQuery($sql);
					//
					// 				$heart_number = $player_to_points [$player_id];
					// 				self::notifyAllPlayers("points", clienttranslate('${player_name} gets ${nbr} hearts and looses ${nbr} points'), array (
					// 								'player_id' => $player_id,'player_name' => $players [$player_id] ['player_name'],
					// 								'nbr' => $heart_number ));
					// 		} else {
					// 				// No point lost (just notify)
					// 				self::notifyAllPlayers("points", clienttranslate('${player_name} did not get any hearts'), array (
					// 								'player_id' => $player_id,'player_name' => $players [$player_id] ['player_name'] ));
					// 		}
					// }

				//	$newScores = self::getCollectionFromDb("SELECT player_id, player_score FROM player", true );
				//	self::notifyAllPlayers( "newScores", '', array( 'newScores' => $newScores ) );

					// increase round number
					$round = self::getGameStateValue( 'round_number' ) ;
					$round = $round + 1;
					self::setGameStateValue('round_number', $round);
					self::notifyAllPlayers( "newRound", '', array( 'round_number' => $round, 'scores' => $scores ) );

					///// check if this is the end of the game
					if ($round == 3) {
							// Trigger the end of the game !
							$this->gamestate->nextState("endGame");
							return;
					}

					$this->gamestate->nextState("nextHand");
		    }

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

    function zombieTurn( $state, $active_player )
    {
    	$statename = $state['name'];

        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                default:
                    $this->gamestate->nextState( "zombiePass" );
                	break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive( $active_player, '' );

            return;
        }

        throw new feException( "Zombie mode not supported at this game state: ".$statename );
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

    function upgradeTableDb( $from_version )
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
