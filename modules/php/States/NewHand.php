<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhistshahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhistshahar\Game;

class NewHand extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 2,
            type: StateType::GAME,
            updateGameProgression: true
        );
    }

    function onEnteringState(): string
    {
        // Take back all cards (from any location => null) to deck
        $this->game->deck->moveAllCardsInLocation(null, "deck");
        $this->game->deck->shuffle("deck");

        // Deal 13 cards to each players
        // Create deck, shuffle it and give 13 initial cards
        $players = $this->game->loadPlayersBasicInfos();
        foreach ($players as $player_id => $player) {
            $cards = $this->game->deck->pickCards(13, "deck", $player_id);
            // Notify player about his cards
            $this->game->notify->player($player_id, "newHand", "", [
                "cards" => $cards,
            ]);
        }

        // reset globals
        $this->game->setGameStateValue("currentBidValue", 0);
        $this->game->setGameStateValue("currentBidSuit", 0);
        $this->game->setGameStateValue("currentBidPlayerId", 0);
        $this->game->setGameStateValue("contractsSum", 0);
        $this->game->setGameStateValue("numberOfContracts", 0);

        // Reset all players' bid values for the new hand
        $this->game->DbQuery("UPDATE player SET bid_value = 0, bid_suit = 0");

        return PlayerBid::class;
    }
}
