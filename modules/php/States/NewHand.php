<?php

declare(strict_types=1);

namespace Bga\Games\IsraeliWhistShahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\IsraeliWhistShahar\Game;
use Bga\Games\IsraeliWhistShahar\States\PlayerBid;

class NewHand extends \Bga\GameFramework\States\GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game, id: 2, type: StateType::GAME, updateGameProgression: true);
    }

    function onEnteringState(): string {
        // Take back all cards (from any location => null) to deck
        $this->game->cards->moveAllCardsInLocation(null, 'deck');
        $this->game->cards->shuffle('deck');

        // Deal 13 cards to each players
        // Create deck, shuffle it and give 13 initial cards
        $players = $this->game->loadPlayersBasicInfos();
        foreach ($players as $player_id => $player) {
            $cards = $this->game->cards->pickCards(13, 'deck', $player_id);
            // Notify player about his cards
            $this->game->notifyPlayer($player_id, 'newHand', '', ['cards' => $cards]);
        }

        // init globals
        $this->game->setGameStateValue('num_of_passes', 0);
        $this->game->setGameStateValue('current_bid', 0);
        $this->game->setGameStateValue('current_bid_shape', 0);
        $this->game->setGameStateValue('current_bid_player_id', 0);
        $this->game->setGameStateValue('total_round_bets', 0);
        $this->game->setGameStateValue('num_of_bets', 0);

        return PlayerBid::class;
    }
}
