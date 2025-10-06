<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhistshahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhistshahar\Game;

class NextDeclaration extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 26, type: StateType::GAME);
    }

    function onEnteringState(): string
    {
        $numberOfContracts = $this->game->getGameStateValue(
            "numberOfContracts"
        );
        $this->game->dump("numberOfContracts:", $numberOfContracts);

        if ($numberOfContracts == 4) {
            // All players have bet, start the trick phase
            $this->game->setGameStateValue(
                "trumpSuit",
                $this->game->getGameStateValue("currentBidSuit")
            );

            // Set the bid winner as the first player
            $bid_winner = $this->game->getGameStateValue("currentBidPlayerId");
            $this->game->gamestate->changeActivePlayer($bid_winner);

            return NewTrick::class;
        } else {
            // Move to next player for betting
            $this->game->activeNextPlayer();
            return PlayerDeclaration::class;
        }
    }
}
