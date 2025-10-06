<?php

declare(strict_types=1);

namespace Bga\Games\IsraeliWhistShahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\IsraeliWhistShahar\Game;
use Bga\Games\IsraeliWhistShahar\States\NewTrick;
use Bga\Games\IsraeliWhistShahar\States\PlayerBet;

class NextBet extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 26, type: StateType::GAME);
    }

    function onEnteringState(): string
    {
        $num_of_bets = $this->game->getGameStateValue("num_of_bets");
        $this->game->dump("num_of_bets:", $num_of_bets);

        if ($num_of_bets == 4) {
            // All players have bet, start the trick phase
            $this->game->setGameStateValue(
                "trumpColor",
                $this->game->getGameStateValue("current_bid_shape")
            );

            // Set the bid winner as the first player
            $bid_winner = $this->game->getGameStateValue(
                "current_bid_player_id"
            );
            $this->game->gamestate->changeActivePlayer($bid_winner);

            return NewTrick::class;
        } else {
            // Move to next player for betting
            $this->game->activeNextPlayer();
            return PlayerBet::class;
        }
    }
}
